"""Stage 2 of the root-cause engine: turn Stage 1's gated evidence into a
per-concept mastery score.

For each concept a student was tested on, we only count two things:
  - strength:   correct answers on that concept (real demonstrated understanding).
  - weak_wrong: wrong answers on that concept gated as conceptual/procedural
                (real gap evidence — same gate as Stage 1).
Implementation/careless wrong answers are neutral: the concept still appears
in the output (so "no reliable evidence either way" is visible), but the
answer contributes to neither strength nor weak_wrong.

mastery = strength / (strength + weak_wrong), i.e. the fraction of gated
attempts on that concept that were correct. status thresholds against
MASTERY_THRESHOLD, kept as a named constant so it's easy to tune later.
"""

from .models import Answer, Attempt
from .stage1_evidence_gate import EVIDENCE_ERROR_TYPES

MASTERY_THRESHOLD = 0.5


def concept_weakness(
    attempt: Attempt,
    min_evidence: float = 0.0,
    effort_weak: dict[str, dict] | None = None,
) -> dict[str, dict]:
    """Per-concept {strength, weak_wrong, mastery, status} for every concept
    tagged on any answer in the attempt.

    min_evidence is a floor on strength + weak_wrong (weighted attempts). A
    concept below it is "insufficient" however bad its ratio looks, so a
    couple of failures can't make it a root gap. The default 0 applies no
    floor, which keeps the original quiz behaviour.

    effort_weak is a second weakness source: concepts the student eventually
    solves but only after far more wrong tries than peers (see
    ingestion/codeforces_effort.py). {concept_id: {"tier", "n_solved", "z"}}.
    Such a concept becomes "weak" with source="effort" even though its mastery
    ratio looks healthy, so the same graph traversal and set cover can pick the
    root among effort-weak concepts. A concept already weak by mastery keeps
    its mastery source."""
    strength: dict[str, float] = {}
    weak_wrong: dict[str, float] = {}
    concept_ids: set[str] = set()

    for answer in attempt.answers:
        concept_ids.update(answer.concept_ids)
        for concept_id in answer.concept_ids:
            if answer.correct:
                strength[concept_id] = strength.get(concept_id, 0) + answer.weight
            elif answer.error_type in EVIDENCE_ERROR_TYPES:
                weak_wrong[concept_id] = weak_wrong.get(concept_id, 0) + answer.weight
            # implementation/careless wrong answers: neutral, counted nowhere.

    result: dict[str, dict] = {}
    for concept_id in concept_ids:
        s = strength.get(concept_id, 0)
        w = weak_wrong.get(concept_id, 0)
        total = s + w
        mastery = s / total if total > 0 else None

        if mastery is None or total + 1e-9 < min_evidence:
            status = "insufficient"
        elif mastery < MASTERY_THRESHOLD:
            status = "weak"
        else:
            status = "ok"

        result[concept_id] = {
            "strength": s,
            "weak_wrong": w,
            "mastery": mastery,
            "status": status,
        }

    for concept_id, flag in (effort_weak or {}).items():
        entry = result.setdefault(
            concept_id,
            {"strength": 0, "weak_wrong": 0, "mastery": None, "status": "insufficient"},
        )
        if entry["status"] != "weak":
            entry["status"] = "weak"
            entry["source"] = "effort"
            entry["effort_tier"] = flag["tier"]
            entry["effort_solved"] = flag["n_solved"]
            entry["effort_z"] = flag["z"]

    return result
