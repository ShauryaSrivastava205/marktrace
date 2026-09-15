"""Stage 1 of the root-cause engine: decide which wrong answers are even
allowed to count as evidence of a knowledge gap.

A wrong answer only implicates a concept if the mistake was conceptual or
procedural (the student didn't know or couldn't apply the idea). A wrong
answer caused by an implementation slip (off-by-one, syntax) or a careless
mistake (misread the question, rushed) says nothing reliable about the
student's grasp of the concept, so it is excluded from evidence rather than
being allowed to falsely implicate a concept the student actually understands.
Correct answers carry no error signal and are ignored entirely.
"""

from .models import Answer, Attempt

EVIDENCE_ERROR_TYPES = {"conceptual", "procedural"}
EXCLUDED_ERROR_TYPES = {"implementation", "careless"}


def gate(attempt: Attempt) -> tuple[list[Answer], list[Answer]]:
    """Split an attempt's wrong answers into (conceptual_evidence, excluded).

    conceptual_evidence: wrong answers with error_type in {conceptual, procedural}.
    excluded: wrong answers with error_type in {implementation, careless}.
    Correct answers are dropped from both lists.
    """
    conceptual_evidence: list[Answer] = []
    excluded: list[Answer] = []

    for answer in attempt.answers:
        if answer.correct:
            continue
        if answer.error_type in EVIDENCE_ERROR_TYPES:
            conceptual_evidence.append(answer)
        elif answer.error_type in EXCLUDED_ERROR_TYPES:
            excluded.append(answer)

    return conceptual_evidence, excluded
