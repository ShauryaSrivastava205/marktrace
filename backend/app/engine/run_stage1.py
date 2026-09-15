"""Quick manual check for Stage 1: load the sample attempt, run it through the
evidence gate, and print what got kept vs. excluded.

Run with: python -m app.engine.run_stage1  (from backend/)
"""

import json
from pathlib import Path

from .models import Answer, Attempt
from .stage1_evidence_gate import gate

SAMPLE_PATH = Path(__file__).resolve().parent / "sample_attempt.json"


def _describe(answer: Answer) -> str:
    concepts = ", ".join(answer.concept_ids)
    return f"  {answer.question_id}: concepts=[{concepts}] error_type={answer.error_type} marks={answer.marks}"


def main() -> None:
    with SAMPLE_PATH.open() as f:
        attempt = Attempt.model_validate(json.load(f))

    conceptual_evidence, excluded = gate(attempt)

    print(f"Attempt for student: {attempt.student_id}")
    print(f"Total answers: {len(attempt.answers)}\n")

    print(f"Conceptual evidence ({len(conceptual_evidence)}) — counts toward knowledge-gap diagnosis:")
    for answer in conceptual_evidence:
        print(_describe(answer))

    print(f"\nExcluded ({len(excluded)}) — implementation/careless, not knowledge-gap evidence:")
    for answer in excluded:
        print(_describe(answer))


if __name__ == "__main__":
    main()
