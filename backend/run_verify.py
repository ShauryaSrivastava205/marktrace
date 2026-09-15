"""Exercises grade() against three fake answer sets, one per rung of the
Verify confirmation ladder, then exercises VerifyRequest's validation on two
malformed answer sets to prove the 422 path fires before grade() ever runs.

Run with: python run_verify.py  (from backend/)
"""

import json

from pydantic import ValidationError

from app.engine.models import VerifyAnswer, VerifyRequest
from app.engine.verify import grade

ROOT_CONCEPT_ID = "recursion"
DOWNSTREAM_CONCEPT_ID = "dp"


def _answers(direct: str, causal: str, transfer: str) -> list[VerifyAnswer]:
    return [
        VerifyAnswer(question_id="r_dir_01", task_type="direct", selected=direct),
        VerifyAnswer(question_id="d_cau_01", task_type="causal", selected=causal),
        VerifyAnswer(question_id="r_trn_01", task_type="transfer", selected=transfer),
    ]


CASES = [
    ("all three correct -> expect HIGH", _answers("A", "A", "A")),
    (
        "direct+transfer correct, causal wrong -> expect not_confirmed + rediagnose",
        _answers("A", "B", "A"),
    ),
    ("causal+transfer correct, direct wrong -> expect root_not_solid", _answers("B", "A", "A")),
]

MALFORMED_CASES = [
    (
        "MALFORMED: missing transfer answer -> expect 422 validation error",
        [
            VerifyAnswer(question_id="r_dir_01", task_type="direct", selected="A"),
            VerifyAnswer(question_id="d_cau_01", task_type="causal", selected="A"),
        ],
    ),
    (
        "MALFORMED: two direct answers -> expect 422 validation error",
        [
            VerifyAnswer(question_id="r_dir_01", task_type="direct", selected="A"),
            VerifyAnswer(question_id="r_dir_01", task_type="direct", selected="B"),
            VerifyAnswer(question_id="r_trn_01", task_type="transfer", selected="A"),
        ],
    ),
]


def main() -> None:
    for label, answers in CASES:
        print(f"--- {label} ---")
        result = grade(ROOT_CONCEPT_ID, DOWNSTREAM_CONCEPT_ID, answers)
        print(json.dumps(result, indent=2))
        print()

    for label, answers in MALFORMED_CASES:
        print(f"--- {label} ---")
        try:
            VerifyRequest(
                student_id="s1",
                root_concept_id=ROOT_CONCEPT_ID,
                downstream_concept_id=DOWNSTREAM_CONCEPT_ID,
                answers=answers,
            )
        except ValidationError as e:
            print(f"Caught ValidationError:\n{e}")
        print()


if __name__ == "__main__":
    main()
