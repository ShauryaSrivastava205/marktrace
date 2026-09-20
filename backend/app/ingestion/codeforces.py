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
  - tag count           -> weight        (1 / number of mapped concepts)
Feed the resulting Answers to the UNCHANGED engine and it traces the root
gap exactly as it does for the quiz. The concept graph does the upstream
tracing — we only supply surface signals here.

Run it:
    python -m app.ingestion.codeforces <handle>
    python -m app.ingestion.codeforces tourist --json > attempt.json

HONEST CAVEATS (read before trusting output):
  1. Mapping quality is everything — reconcile codeforces_tag_map.json against
     your real graph node ids first.
  2. Difficulty control matters: we DROP problems rated far above the user's
     rating AT THE TIME OF THE ATTEMPT (from user.rating history), so "couldn't
     solve a 2500" is not counted as a weakness. Attempts made before the
     user's first rated contest have no known ability and are dropped, not
     guessed. The window's ceiling is floored at MIN_WINDOW_CEILING so very
     low-rated beginners are not erased. Tune the window.
  3. verdict -> error_type is a heuristic, not ground truth.
  4. A multi-tag problem splits ONE unit of evidence across its mapped
     concepts (weight = 1/n) instead of counting in full for each.
  5. Verdicts that say nothing about correctness (PARTIAL, SKIPPED,
     IDLENESS_LIMIT_EXCEEDED, still-testing) are ignored, not counted as failures.
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

# Difficulty window around the user's rating at the time of the attempt.
# Failing a problem this-much-above your rating is NOT treated as a weakness.
RATING_ABOVE = 200
RATING_BELOW = 400
# The window's ceiling never drops below this. The easiest Codeforces problems
# are rated 800, so a new user whose first rating is ~400 would otherwise see
# every problem on the site excluded as "far above" them and lose all evidence.
MIN_WINDOW_CEILING = 1000

# Submissions with these verdicts (or no verdict yet) are not evidence either
# way: they are not a correct solution and not a real wrong attempt.
IGNORED_VERDICTS = {"PARTIAL", "SKIPPED", "IDLENESS_LIMIT_EXCEEDED", "TESTING"}

_TAG_MAP_PATH = Path(__file__).resolve().parents[2] / "data" / "codeforces_tag_map.json"


# --------------------------------------------------------------------------- #
# CF API calls
# --------------------------------------------------------------------------- #
class CodeforcesError(RuntimeError):
    """A Codeforces API call failed; the message carries CF's own `comment`."""


class HandleNotFoundError(CodeforcesError):
    """The handle does not exist on Codeforces."""


def _get(method: str, **params: Any) -> Any:
    """Call one CF API method, return `result`, raise CodeforcesError on failure.

    Codeforces reports most failures as HTTP 400 with a JSON body whose
    `comment` explains why, so the body is read before the status is judged.
    """
    resp = requests.get(
        f"{CF_API}/{method}",
        params=params,
        headers={"User-Agent": USER_AGENT},
        timeout=HTTP_TIMEOUT,
    )
    try:
        body = resp.json()
    except ValueError:
        body = None

    if isinstance(body, dict) and body.get("status") == "OK":
        return body["result"]

    comment = body.get("comment") if isinstance(body, dict) else None
    detail = comment or f"HTTP {resp.status_code}"
    if comment and "not found" in comment.lower():
        raise HandleNotFoundError(f"Codeforces {method}: {comment}")
    raise CodeforcesError(f"Codeforces API failed on {method}: {detail}")


def fetch_rating_history(handle: str) -> list[tuple[int, int]]:
    """Rated-contest history as [(unix_time, new_rating), ...], oldest first.

    Empty for a real handle that has never taken part in a rated contest.
    Raises HandleNotFoundError for a handle that does not exist.
    """
    changes = _get("user.rating", handle=handle)
    return sorted((int(c["ratingUpdateTimeSeconds"]), int(c["newRating"])) for c in changes)


def rating_at(history: list[tuple[int, int]], timestamp: int) -> int | None:
    """The user's rating as of `timestamp`: the newRating from their latest
    rated contest at or before it. Rating only changes at contests, so this is
    a step function rather than an interpolation. None if the user had not yet
    completed a rated contest (ability unknown)."""
    current: int | None = None
    for updated_at, new_rating in history:
        if updated_at > timestamp:
            break
        current = new_rating
    return current


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


# --------------------------------------------------------------------------- #
# Build the Attempt
# --------------------------------------------------------------------------- #
def build_attempt(handle: str) -> dict:
    """Public handle -> Attempt dict ready for POST /diagnose.

    Besides `student_id` and `answers`, the result carries a `meta` block
    counting why evidence was dropped (the engine ignores it).
    """
    history = fetch_rating_history(handle)
    time.sleep(REQUEST_GAP_SECONDS)
    submissions = fetch_submissions(handle)

    tag_map = load_tag_map()

    # Aggregate submissions -> one record per problem. Only submissions that
    # actually carry a verdict about correctness are counted.
    problems: dict[str, dict] = {}
    ignored_submissions = 0
    for sub in submissions:
        prob = sub.get("problem", {})
        cid = prob.get("contestId")
        idx = prob.get("index")
        if cid is None or idx is None:
            continue
        verdict = sub.get("verdict")
        if verdict is None or verdict in IGNORED_VERDICTS:
            ignored_submissions += 1
            continue
        submitted_at = int(sub.get("creationTimeSeconds", 0))
        key = f"{cid}-{idx}"
        rec = problems.setdefault(
            key,
            {
                "tags": prob.get("tags", []),
                "rating": prob.get("rating"),
                "solved": False,
                "first_fail": None,
                "first_attempt_at": submitted_at,
                "name": prob.get("name", key),
            },
        )
        rec["first_attempt_at"] = min(rec["first_attempt_at"], submitted_at)
        if verdict == "OK":
            rec["solved"] = True
        elif rec["first_fail"] is None:
            rec["first_fail"] = verdict

    meta = {
        "problems_attempted": len(problems),
        "ignored_submissions": ignored_submissions,
        "dropped_unknown_ability": 0,
        "dropped_outside_window": 0,
        "dropped_no_concept": 0,
        "rated_contests": len(history),
    }

    # One kept problem -> one Answer.
    answers: list[dict] = []
    for key, rec in problems.items():
        # Difficulty control against the user's rating when they first
        # attempted this problem, not their rating today.
        ability = rating_at(history, rec["first_attempt_at"])
        if ability is None:
            meta["dropped_unknown_ability"] += 1
            continue
        p_rating = rec["rating"]
        if p_rating is not None and (
            p_rating > max(ability + RATING_ABOVE, MIN_WINDOW_CEILING)
            or p_rating < ability - RATING_BELOW
        ):
            meta["dropped_outside_window"] += 1
            continue
        concept_ids = tags_to_concepts(rec["tags"], tag_map)
        if not concept_ids:
            meta["dropped_no_concept"] += 1
            continue  # no concept signal -> contributes nothing (correct)
        answers.append(
            {
                "question_id": f"cf_{key}",
                "concept_ids": concept_ids,
                "correct": rec["solved"],
                "error_type": None if rec["solved"] else verdict_to_error_type(rec["first_fail"]),
                # One unit of evidence split across the mapped concepts.
                "weight": 1 / len(concept_ids),
            }
        )

    return {"student_id": handle, "answers": answers, "meta": meta}


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
    ]
    if "meta" in attempt:
        lines.append("dropped: " + ", ".join(f"{k}={v}" for k, v in attempt["meta"].items()))
    lines.append("weakest concepts (failed / attempted):")
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
