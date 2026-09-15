"""Stage 6 of the root-cause engine: translate each selected root into the
marks it actually cost the student.

direct_marks only counts gated (conceptual/procedural) failures that tested
the root concept itself. associated_marks widens that to every concept the
root explains (root + its weak descendants), which is the number worth
surfacing to a student/teacher as "marks tied to this gap". Each failed
question is counted once even if it tags multiple concepts in that set, so
affected_questions is a count of distinct questions, not answer-concept pairs.
"""

from .models import Attempt
from .stage1_evidence_gate import gate


def add_mark_impact(roots: list[dict], attempt: Attempt) -> list[dict]:
    """Attach {direct_marks, associated_marks, affected_questions} to each root."""
    conceptual_evidence, _ = gate(attempt)

    scored: list[dict] = []
    for root in roots:
        root_id = root["concept_id"]
        associated_concepts = {root_id, *root["explains"]}

        direct_marks = sum(
            answer.marks for answer in conceptual_evidence if root_id in answer.concept_ids
        )

        associated_answers = [
            answer
            for answer in conceptual_evidence
            if associated_concepts.intersection(answer.concept_ids)
        ]
        associated_marks = sum(answer.marks for answer in associated_answers)
        affected_questions = len({answer.question_id for answer in associated_answers})

        scored.append(
            {
                **root,
                "direct_marks": direct_marks,
                "associated_marks": associated_marks,
                "affected_questions": affected_questions,
            }
        )

    return scored
