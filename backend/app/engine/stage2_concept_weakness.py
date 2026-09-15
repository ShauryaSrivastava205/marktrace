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


def concept_weakness(attempt: Attempt) -> dict[str, dict]:
    """Per-concept {strength, weak_wrong, mastery, status} for every concept
    tagged on any answer in the attempt."""
    strength: dict[str, int] = {}
    weak_wrong: dict[str, int] = {}
    concept_ids: set[str] = set()

    for answer in attempt.answers:
        concept_ids.update(answer.concept_ids)
        for concept_id in answer.concept_ids:
            if answer.correct:
                strength[concept_id] = strength.get(concept_id, 0) + 1
            elif answer.error_type in EVIDENCE_ERROR_TYPES:
                weak_wrong[concept_id] = weak_wrong.get(concept_id, 0) + 1
            # implementation/careless wrong answers: neutral, counted nowhere.

    result: dict[str, dict] = {}
    for concept_id in concept_ids:
        s = strength.get(concept_id, 0)
        w = weak_wrong.get(concept_id, 0)
        total = s + w
        mastery = s / total if total > 0 else None

        if mastery is None:
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

    return result
