"""Data shapes the root-cause engine operates on: a student's Attempt at a set
of questions, each answered with zero or more concept tags and (if wrong) a
diagnosed error_type.
"""

from typing import Literal, Optional

from pydantic import BaseModel

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
