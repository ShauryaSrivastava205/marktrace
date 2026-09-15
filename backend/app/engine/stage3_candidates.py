"""Stage 3 of the root-cause engine: turn per-concept weakness into candidate
root causes.

A weak concept might not be the actual root cause — the student may have a
gap in a *prerequisite* that happens to surface as errors on everything
downstream of it. So for every weak concept we also consider its conceptual
ancestors as candidates, on the theory that a gap in an ancestor would
explain weakness in some or all of its descendants.

For each candidate C we compute `explains`: which weak concepts C accounts
for, i.e. C itself (if weak) plus any weak concept that is a conceptual
descendant of C. A candidate that explains multiple weak concepts is a more
compelling root cause than one that only explains itself — that ranking is
left to a later stage; here we just surface every candidate that explains at
least one weak concept.
"""

from .graph_loader import get_conceptual_ancestors, get_conceptual_descendants


def candidate_root_causes(weakness: dict[str, dict]) -> list[dict]:
    """From Stage 2's weakness map, build candidate root causes.

    Candidates are every weak concept plus every conceptual ancestor of a
    weak concept. Each candidate reports which weak concepts it explains
    (itself and/or its conceptual descendants).
    """
    weak = {concept_id for concept_id, info in weakness.items() if info["status"] == "weak"}

    candidate_ids = set(weak)
    for concept_id in weak:
        candidate_ids.update(get_conceptual_ancestors(concept_id))

    candidates: list[dict] = []
    for concept_id in candidate_ids:
        descendants = set(get_conceptual_descendants(concept_id))
        explains = sorted(w for w in weak if w == concept_id or w in descendants)
        if not explains:
            continue
        candidates.append(
            {
                "concept_id": concept_id,
                "explains": explains,
                "is_itself_weak": concept_id in weak,
            }
        )

    candidates.sort(key=lambda c: c["concept_id"])
    return candidates
