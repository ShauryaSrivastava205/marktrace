"""Data shapes the root-cause engine operates on: a student's Attempt at a set
of questions, each answered with zero or more concept tags and (if wrong) a
diagnosed error_type.
"""

from collections import Counter
from typing import Literal, Optional

from pydantic import BaseModel, model_validator

ErrorType = Literal["conceptual", "procedural", "implementation", "careless"]


class Answer(BaseModel):
    question_id: str
    concept_ids: list[str]
    correct: bool
    error_type: Optional[ErrorType] = None
    marks: int


class Attempt(BaseModel):
    student_id: str
    answers: list[Answer]


class VerifyAnswer(BaseModel):
    question_id: str
    task_type: str
    selected: str


class VerifyRequest(BaseModel):
    student_id: str
    root_concept_id: str
    downstream_concept_id: str
    answers: list[VerifyAnswer]

    @model_validator(mode="after")
    def _exactly_one_per_task_type(self) -> "VerifyRequest":
        counts = Counter(answer.task_type for answer in self.answers)
        if counts != Counter({"direct": 1, "causal": 1, "transfer": 1}):
            raise ValueError("answers must contain exactly one each of: direct, causal, transfer")
        return self


class VerifyProbeRequest(BaseModel):
    root_concept_id: str
    downstream_concept_id: str


ConfidenceTier = Literal["INSUFFICIENT", "LOW", "MEDIUM", "HIGH"]


class RootGap(BaseModel):
    concept_id: str
    name: str
    confidence: ConfidenceTier
    marks_associated: int
    affected_questions: int
    downstream_affected: list[str]


class ConceptMasteryEntry(BaseModel):
    concept_id: str
    name: str
    mastery: Optional[float] = None
    status: str


class CoachRequest(BaseModel):
    """A subset of the /diagnose response: exactly what the coach is allowed
    to talk about. Anything not in here must not appear in its output."""

    root_gaps: list[RootGap]
    concept_mastery: list[ConceptMasteryEntry]
    explanation: str
    evidence_sufficient: bool
