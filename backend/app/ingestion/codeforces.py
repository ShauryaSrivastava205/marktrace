"""
Codeforces ingestion  ->  MarkTrace `Attempt`
=============================================

Phase 1 spike. Turns a PUBLIC Codeforces handle into the exact `Attempt`
shape the existing /diagnose engine already consumes. No login, no password,
no API key — a public handle is enough.

The whole idea: one attempted Codeforces problem == one `Answer`.
  - problem tags        -> concept_ids   (via data/codeforces_tag_map.json)
  - solved?             -> correct
  - failing verdict     -> error_type    (heuristic)
  - problem difficulty  -> marks         (weight)
Feed the resulting Answers to the UNCHANGED engine and it traces the root
gap exactly as it does for the quiz. The concept graph does the upstream
tracing — we only supply surface signals here.

Run it:
    python -m app.ingestion.codeforces <handle>
    python -m app.ingestion.codeforces tourist --json > attempt.json

HONEST CAVEATS (read before trusting output):
  1. Mapping quality is everything — reconcile codeforces_tag_map.json against
     your real graph node ids first.
  2. Difficulty control matters: we DROP problems rated far above the user, so
     "couldn't solve a 2500" is not counted as a weakness. Tune the window.
  3. verdict -> error_type is a heuristic, not ground truth.
  4. A multi-tag problem assigns its failure to several concepts (dilutes
     signal). Acceptable for v1; revisit if diagnoses look noisy.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any

import requests

CF_API = "https://codeforces.com/api"
USER_AGENT = "MarkTrace/phase1 (educational root-cause diagnosis)"
REQUEST_GAP_SECONDS = 2.1          # CF asks for <= ~1 request / 2s
HTTP_TIMEOUT = 20

# Difficulty window around the user's current rating.
# Failing a problem this-much-above your rating is NOT treated as a weakness.
RATING_ABOVE = 200
RATING_BELOW = 400
DEFAULT_RATING = 1200              # used when a handle has no rating history

_TAG_MAP_PATH = Path(__file__).resolve().parents[2] / "data" / "codeforces_tag_map.json"


# --------------------------------------------------------------------------- #
# CF API calls
# --------------------------------------------------------------------------- #
def _get(method: str, **params: Any) -> Any:
    """Call one CF API method, return `result`, raise on FAILED."""
    resp = requests.get(
        f"{CF_API}/{method}",
        params=params,
        headers={"User-Agent": USER_AGENT},
        timeout=HTTP_TIMEOUT,
    )
    resp.raise_for_status()
    body = resp.json()
    if body.get("status") != "OK":
        raise RuntimeError(f"Codeforces API failed on {method}: {body.get('comment')}")
    return body["result"]


def fetch_current_rating(handle: str) -> int:
    """Latest rating from user.rating, or DEFAULT_RATING if unrated."""
    try:
        changes = _get("user.rating", handle=handle)
    except RuntimeError:
        return DEFAULT_RATING
    if not changes:
        return DEFAULT_RATING
    return int(changes[-1]["newRating"])


def fetch_submissions(handle: str) -> list[dict]:
    """All of a handle's submissions (user.status)."""
    return _get("user.status", handle=handle)


# --------------------------------------------------------------------------- #
# Tag -> concept mapping
# --------------------------------------------------------------------------- #
def load_tag_map(path: Path = _TAG_MAP_PATH) -> dict[str, list[str]]:
    """Flatten confirmed + reconcile blocks into {cf_tag: [concept_id, ...]}."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    mapping: dict[str, list[str]] = {}
    mapping.update(raw.get("confirmed", {}))
    mapping.update(raw.get("reconcile", {}))
    return mapping


def tags_to_concepts(tags: list[str], tag_map: dict[str, list[str]]) -> list[str]:
    """Map a problem's tags to concept ids, deduped, unmapped tags dropped."""
    out: list[str] = []
    for t in tags:
        for cid in tag_map.get(t, []):
            if cid not in out:
                out.append(cid)
    return out


# --------------------------------------------------------------------------- #
# Verdict -> error_type (heuristic)
# --------------------------------------------------------------------------- #
def verdict_to_error_type(verdict: str | None) -> str:
    if verdict in ("TIME_LIMIT_EXCEEDED", "MEMORY_LIMIT_EXCEEDED"):
        return "procedural"        # right idea, inefficient
    if verdict in ("RUNTIME_ERROR", "COMPILATION_ERROR"):
        return "implementation"    # coding slip, not concept gap
    # WRONG_ANSWER and everything else -> treat as a concept miss
    return "conceptual"


def _difficulty_marks(rating: int | None) -> int:
    if not rating:
        return 3
    return max(1, round(rating / 100))


# --------------------------------------------------------------------------- #
# Build the Attempt
# --------------------------------------------------------------------------- #
def build_attempt(handle: str) -> dict:
    """Public handle -> Attempt dict ready for POST /diagnose."""
    rating = fetch_current_rating(handle)
    time.sleep(REQUEST_GAP_SECONDS)
    submissions = fetch_submissions(handle)

    tag_map = load_tag_map()
    ceiling = rating + RATING_ABOVE
    floor = rating - RATING_BELOW

    # Aggregate submissions -> one record per problem.
    problems: dict[str, dict] = {}
    for sub in submissions:
        prob = sub.get("problem", {})
        cid = prob.get("contestId")
        idx = prob.get("index")
        if cid is None or idx is None:
            continue
        key = f"{cid}-{idx}"
        rec = problems.setdefault(
            key,
            {
                "tags": prob.get("tags", []),
                "rating": prob.get("rating"),
                "solved": False,
                "worst_fail": None,
                "name": prob.get("name", key),
            },
        )
        verdict = sub.get("verdict")
        if verdict == "OK":
            rec["solved"] = True
        elif rec["worst_fail"] is None:
            rec["worst_fail"] = verdict

    # One kept problem -> one Answer.
    answers: list[dict] = []
    for key, rec in problems.items():
        p_rating = rec["rating"]
        # Difficulty control: skip problems well above the user's rating.
        if p_rating is not None and (p_rating > ceiling or p_rating < floor):
            continue
        concept_ids = tags_to_concepts(rec["tags"], tag_map)
        if not concept_ids:
            continue  # no concept signal -> contributes nothing (correct)
        answers.append(
            {
                "question_id": f"cf_{key}",
                "concept_ids": concept_ids,
                "correct": rec["solved"],
                "error_type": None if rec["solved"] else verdict_to_error_type(rec["worst_fail"]),
                "marks": _difficulty_marks(p_rating),
            }
        )

    return {"student_id": handle, "answers": answers}


def summarize(attempt: dict) -> str:
    """Tiny human summary for the terminal (not sent to the engine)."""
    ans = attempt["answers"]
    total = len(ans)
    wrong = sum(1 for a in ans if not a["correct"])
    per_concept: dict[str, list[int]] = {}
    for a in ans:
        for c in a["concept_ids"]:
            bucket = per_concept.setdefault(c, [0, 0])  # [attempted, failed]
            bucket[0] += 1
            if not a["correct"]:
                bucket[1] += 1
    lines = [
        f"handle={attempt['student_id']}  problems_used={total}  unsolved={wrong}",
        "weakest concepts (failed / attempted):",
    ]
    ranked = sorted(per_concept.items(), key=lambda kv: (kv[1][1] / kv[1][0]), reverse=True)
    for cid, (att, fail) in ranked[:10]:
        lines.append(f"  {cid:<18} {fail}/{att}")
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def main(argv: list[str]) -> int:
    if not argv:
        print("usage: python -m app.ingestion.codeforces <handle> [--json]", file=sys.stderr)
        return 2
    handle = argv[0]
    as_json = "--json" in argv[1:]
    try:
        attempt = build_attempt(handle)
    except Exception as exc:  # noqa: BLE001 - spike CLI, surface the error plainly
        print(f"error: {exc}", file=sys.stderr)
        return 1
    if as_json:
        print(json.dumps(attempt, indent=2))
    else:
        print(summarize(attempt))
        print("\n(run with --json to emit the full Attempt for POST /diagnose)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
