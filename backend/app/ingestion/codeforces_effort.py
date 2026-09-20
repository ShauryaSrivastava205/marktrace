"""Effort-based weakness detection for Codeforces evidence.

Some concepts a student eventually solves, but only after markedly more wrong
attempts than comparable students need. Eventual-solve mastery cannot see that.
This module scores it against a population baseline:

  1. Per in-window problem, `wrong_tries` (failures before the first accepted
     submission, capped) is normalised for difficulty by subtracting the
     population's mean wrong tries at the same (problem rating - ability) band.
  2. A student's per-concept score is the MEDIAN normalised wrong tries over the
     concept's solved problems (medians, because the distribution is heavy-tailed).
  3. That is turned into a z-score against the population's distribution of the
     same per-concept median.
  4. A concept is flagged only if it passes every gate below.

Gates (each exists because a looser rule was shown to over-flag on real data):
  - at least MIN_PROBLEMS in-window problems and MIN_SOLVED solved;
  - z >= Z_FLAG;
  - correlated tag clusters are de-duplicated: a concept only counts problems
    not already used by a stronger flagged concept (graph + dfs share problems);
  - temporal persistence: both chronological halves of the concept's solved
    problems must independently show the signal (z >= Z_HALF).

Refreshing the baseline is a data job, not a code change:
    python -m app.ingestion.codeforces_effort scan  <cache_dir> --contest ID
    python -m app.ingestion.codeforces_effort build <cache_dir>
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import statistics
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Iterable

from . import codeforces as cf

BASELINE_PATH = Path(__file__).resolve().parents[2] / "data" / "cf_effort_baseline.json"

BAND = 100                 # rating-minus-ability band width for difficulty normalisation
MIN_BAND_SAMPLES = 100     # thinner bands borrow the nearest well-populated band
MIN_PROBLEMS = 8           # in-window problems for a concept
MIN_SOLVED = 5             # ...of which solved
MIN_HALF_SOLVED = 3        # solved problems needed in each half for persistence
MIN_POP_HANDLES = 15       # handles needed for a concept to have a baseline
Z_FLAG = 3.0               # a flag needs z >= this (z >= 2 flags ~13% of ordinary handles)
Z_HALF = 1.5               # each chronological half must reach this
Z_MEDIUM = 4.0             # effort gaps reach MEDIUM only above this AND with both
                           # halves at Z_FLAG; they never go higher without a verify probe


# --------------------------------------------------------------------------- #
# Baseline
# --------------------------------------------------------------------------- #
def _params() -> dict:
    return {
        "band": BAND, "min_problems": MIN_PROBLEMS, "min_solved": MIN_SOLVED,
        "min_pop_handles": MIN_POP_HANDLES, "max_wrong_tries": cf.MAX_WRONG_TRIES,
        "rating_above": cf.RATING_ABOVE, "rating_below": cf.RATING_BELOW,
        "min_window_ceiling": cf.MIN_WINDOW_CEILING,
    }


def _tag_map_sha() -> str:
    canonical = json.dumps(cf.load_tag_map(), sort_keys=True).encode()
    return hashlib.sha256(canonical).hexdigest()


def _band(delta: int) -> int:
    return delta // BAND


def _concept_problems(trajectories: Iterable[dict]) -> dict[str, list[dict]]:
    """concept -> its in-window problems that can be difficulty-normalised."""
    by: dict[str, list[dict]] = defaultdict(list)
    for t in trajectories:
        if t["delta"] is None:
            continue
        for concept in t["concept_ids"]:
            by[concept].append(t)
    return by


def _band_mean(baseline: dict, delta: int) -> float:
    means = {int(b): v for b, v in baseline["band_means"].items() if v["n"] >= MIN_BAND_SAMPLES}
    band = min(means, key=lambda b: (abs(b - _band(delta)), b))
    return means[band]["mean"]


def build_baseline(populations: Iterable[list[dict]]) -> dict:
    """Population baseline from one trajectory list per handle."""
    populations = list(populations)

    bands: dict[int, list[int]] = defaultdict(list)
    for trajectories in populations:
        for t in trajectories:
            if t["solved"] and t["delta"] is not None:
                bands[_band(t["delta"])].append(t["wrong_tries"])
    band_means = {
        str(b): {"mean": round(statistics.mean(v), 4), "sd": round(statistics.pstdev(v), 4), "n": len(v)}
        for b, v in sorted(bands.items())
    }
    provisional = {"band_means": band_means}

    medians: dict[str, list[float]] = defaultdict(list)
    for trajectories in populations:
        for concept, problems in _concept_problems(trajectories).items():
            solved = [t for t in problems if t["solved"]]
            if len(problems) < MIN_PROBLEMS or len(solved) < MIN_SOLVED:
                continue
            medians[concept].append(_median_residual(solved, provisional))

    concepts = {
        concept: {
            "n_handles": len(values),
            "mean": round(statistics.mean(values), 4),
            "sd": round(statistics.pstdev(values), 4),
        }
        for concept, values in sorted(medians.items())
        if len(values) >= MIN_POP_HANDLES
    }
    return {
        "built_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "n_handles": len(populations),
        "n_solved_problems": sum(v["n"] for v in band_means.values()),
        "tag_map_sha256": _tag_map_sha(),
        "params": _params(),
        "band_means": band_means,
        "concepts": concepts,
    }


def load_baseline(path: Path = BASELINE_PATH) -> dict | None:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def baseline_problem(baseline: dict | None) -> str | None:
    """Why this baseline must not be used, or None if it is current."""
    if baseline is None:
        return "no effort baseline has been built"
    if baseline.get("tag_map_sha256") != _tag_map_sha():
        return "baseline was built with a different Codeforces tag map"
    if baseline.get("params") != _params():
        return "baseline was built with different window or gating parameters"
    return None


# --------------------------------------------------------------------------- #
# Scoring
# --------------------------------------------------------------------------- #
def _median_residual(solved: list[dict], baseline: dict) -> float:
    return statistics.median(t["wrong_tries"] - _band_mean(baseline, t["delta"]) for t in solved)


def _z(median: float, stats: dict) -> float:
    return (median - stats["mean"]) / stats["sd"] if stats["sd"] > 0 else 0.0


def _evaluate(problems: list[dict], stats: dict, baseline: dict) -> dict | None:
    """Score one concept's problems, or None if there is too little to judge."""
    solved = [t for t in problems if t["solved"]]
    if len(problems) < MIN_PROBLEMS or len(solved) < MIN_SOLVED:
        return None
    median = _median_residual(solved, baseline)
    ordered = sorted(solved, key=lambda t: t["first_attempt_at"])
    half = len(ordered) // 2
    first, second = ordered[:half], ordered[half:]
    halves = None
    if half >= MIN_HALF_SOLVED:
        halves = (
            _z(_median_residual(first, baseline), stats),
            _z(_median_residual(second, baseline), stats),
        )
    return {
        "n_problems": len(problems),
        "n_solved": len(solved),
        "median_residual": round(median, 3),
        "raw_median_wrong_tries": statistics.median(t["wrong_tries"] for t in solved),
        "z": round(_z(median, stats), 2),
        "z_first_half": None if halves is None else round(halves[0], 2),
        "z_second_half": None if halves is None else round(halves[1], 2),
    }


def _passes(result: dict | None) -> bool:
    return (
        result is not None
        and result["z"] >= Z_FLAG
        and result["z_first_half"] is not None
        and result["z_first_half"] >= Z_HALF
        and result["z_second_half"] >= Z_HALF
    )


def _tier(result: dict) -> str:
    strong = result["z"] >= Z_MEDIUM and min(result["z_first_half"], result["z_second_half"]) >= Z_FLAG
    return "MEDIUM" if strong else "LOW"  # never HIGH: only a verify probe can confirm


def effort_analysis(trajectories: list[dict], baseline: dict) -> dict:
    """{"flags": [...stable effort-weak concepts...], "suppressed": [...]}.

    `suppressed` records candidates that were dropped and why, so an abstention
    is inspectable rather than silent.
    """
    problems_by = _concept_problems(trajectories)
    candidates = []
    for concept, problems in problems_by.items():
        stats = baseline["concepts"].get(concept)
        if stats is None:
            continue
        result = _evaluate(problems, stats, baseline)
        if result is not None and result["z"] >= Z_FLAG:
            candidates.append((result["z"], concept, result))
    candidates.sort(reverse=True)

    flags: list[dict] = []
    suppressed: list[dict] = []
    used: set[str] = set()
    for _, concept, first_pass in candidates:
        stats = baseline["concepts"][concept]
        problems = problems_by[concept]
        independent = [t for t in problems if t["problem_id"] not in used]
        shared = len(problems) - len(independent)
        result = first_pass if shared == 0 else _evaluate(independent, stats, baseline)
        if _passes(result):
            flags.append(
                {
                    "concept_id": concept,
                    **result,
                    "tier": _tier(result),
                    "shared_problems_removed": shared,
                    "population_handles": stats["n_handles"],
                    "population_mean_residual": stats["mean"],
                }
            )
            used.update(t["problem_id"] for t in problems)
        else:
            persistent_signal = result is not None and result["z"] >= Z_FLAG
            reason = (
                "not persistent across both halves of history"
                if persistent_signal
                else f"evidence overlaps a stronger flagged concept ({shared} shared problems)"
            )
            suppressed.append({"concept_id": concept, "z": first_pass["z"], "reason": reason})
    return {"flags": flags, "suppressed": suppressed}


# --------------------------------------------------------------------------- #
# Population scan + CLI (data jobs)
# --------------------------------------------------------------------------- #
def _unique_problems(submissions: list[dict]) -> int:
    return len(
        {
            (s["problem"].get("contestId"), s["problem"].get("index"))
            for s in submissions
            if s["problem"].get("contestId") is not None
        }
    )


def scan_population(
    cache_dir: Path,
    contest_id: int,
    target_kept: int,
    seed: int,
    exclude_dirs: Iterable[Path] = (),
    min_problems: int = 100,
    max_candidates: int = 400,
    rating_range: tuple[int, int] = (1000, 1800),
    log: Callable[[str], None] = print,
) -> int:
    """Cache {"subs", "hist"} for handles sampled from a contest's participants.

    Resumable: handles already cached (or skipped) are not fetched again.
    Returns how many handles are now cached.
    """
    cache_dir.mkdir(parents=True, exist_ok=True)
    excluded = {p.stem for d in exclude_dirs for p in Path(d).glob("*.json")}
    skipped_file = cache_dir / "_skipped.json"
    skipped = set(json.loads(skipped_file.read_text())) if skipped_file.exists() else set()

    rows = cf._get("contest.ratingChanges", contestId=contest_id)
    time.sleep(cf.REQUEST_GAP_SECONDS)
    low, high = rating_range
    pool = [r["handle"] for r in rows if low <= r["oldRating"] <= high and r["handle"] not in excluded]
    random.Random(seed).shuffle(pool)

    def kept_count() -> int:
        return sum(1 for p in cache_dir.glob("*.json") if not p.name.startswith("_"))

    for handle in pool[:max_candidates]:
        if kept_count() >= target_kept:
            break
        if (cache_dir / f"{handle}.json").exists() or handle in skipped:
            continue
        try:
            subs = cf.fetch_submissions(handle)
            time.sleep(cf.REQUEST_GAP_SECONDS)
            if _unique_problems(subs) < min_problems:
                skipped.add(handle)
                skipped_file.write_text(json.dumps(sorted(skipped)))
                continue
            hist = cf.fetch_rating_history(handle)
            time.sleep(cf.REQUEST_GAP_SECONDS)
        except cf.CodeforcesError as exc:
            log(f"skip {handle}: {exc}")
            skipped.add(handle)
            skipped_file.write_text(json.dumps(sorted(skipped)))
            continue
        (cache_dir / f"{handle}.json").write_text(json.dumps({"subs": subs, "hist": hist}))
        if kept_count() % 10 == 0:
            log(f"cached {kept_count()} handles")
    return kept_count()


def load_cached_trajectories(cache_dir: Path) -> dict[str, list[dict]]:
    out = {}
    for path in sorted(Path(cache_dir).glob("*.json")):
        if path.name.startswith("_"):
            continue
        data = json.loads(path.read_text())
        out[path.stem], _ = cf.collect_trajectories(data["subs"], [tuple(x) for x in data["hist"]])
    return out


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.ingestion.codeforces_effort")
    sub = parser.add_subparsers(dest="command", required=True)
    scan = sub.add_parser("scan", help="cache submissions + rating history for a population")
    scan.add_argument("cache_dir", type=Path)
    scan.add_argument("--contest", type=int, required=True, help="contest whose participants are sampled")
    scan.add_argument("--target", type=int, default=200)
    scan.add_argument("--seed", type=int, default=1)
    scan.add_argument("--exclude", type=Path, action="append", default=[], help="cache dirs whose handles to skip")
    build = sub.add_parser("build", help="build data/cf_effort_baseline.json from a cache dir")
    build.add_argument("cache_dir", type=Path)
    build.add_argument("--out", type=Path, default=BASELINE_PATH)
    args = parser.parse_args(argv)

    if args.command == "scan":
        n = scan_population(args.cache_dir, args.contest, args.target, args.seed, args.exclude)
        print(f"{n} handles cached in {args.cache_dir}")
        return 0
    baseline = build_baseline(load_cached_trajectories(args.cache_dir).values())
    args.out.write_text(json.dumps(baseline, indent=2, sort_keys=True) + "\n")
    print(f"wrote {args.out} ({baseline['n_handles']} handles, {len(baseline['concepts'])} concepts)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
