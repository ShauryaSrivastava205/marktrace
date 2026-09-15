"""Stage 4 of the root-cause engine: pick a parsimonious set of root causes
from Stage 3's candidates.

Only candidates with is_itself_weak == True are eligible roots — a root must
have direct evidence of its own, not just be an ancestor that happens to
explain some weak descendants. Every weak concept is itself such a
candidate (it explains at least itself), so the full weak set is always
coverable.

We then run greedy set cover: repeatedly pick the itself-weak candidate that
still explains the most uncovered weak concepts, mark those covered, and
repeat. Ties are broken by deeper level first (a deeper, more specific
concept is preferred over a shallower one explaining the same weak set),
then by concept_id for determinism.
"""

from .graph_loader import get_level


def select_root_causes(candidates: list[dict]) -> list[dict]:
    """Greedy set-cover over Stage 3 candidates, returning an ordered list of
    {concept_id, explains, level} roots that together cover every weak concept."""
    weak_candidates = [c for c in candidates if c["is_itself_weak"]]
    uncovered = {c["concept_id"] for c in weak_candidates}

    pool = list(weak_candidates)
    roots: list[dict] = []

    while uncovered:
        best = min(
            pool,
            key=lambda c: (
                -len(set(c["explains"]) & uncovered),  # most uncovered weak concepts explained
                -get_level(c["concept_id"]),  # tie-break: deeper (higher-numbered) level first
                c["concept_id"],  # final tie-break: deterministic ordering
            ),
        )
        roots.append(
            {
                "concept_id": best["concept_id"],
                "explains": sorted(best["explains"]),
                "level": get_level(best["concept_id"]),
            }
        )
        uncovered -= set(best["explains"])
        pool.remove(best)

    return roots
