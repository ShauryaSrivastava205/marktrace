"""Targeted verification probes for a diagnosis.

Each root gap has a direct, causal, and transfer question. The data lives in
data/verify_probes.json so the API never pretends every student has the same
recursion diagnosis.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from .models import VerifyAnswer

PROBE_PATH = Path(__file__).resolve().parents[3] / "data" / "verify_probes.json"
REQUIRED_TASK_TYPES = {"direct", "causal", "transfer"}


@lru_cache(maxsize=1)
def _probe_groups() -> dict[str, dict[str, Any]]:
    with PROBE_PATH.open() as source:
        return json.load(source)["probes"]


@lru_cache(maxsize=1)
def _probe_bank() -> dict[str, dict[str, Any]]:
    return {
        question["question_id"]: question
        for group in _probe_groups().values()
        for question in group["questions"]
    }


def _group_for(root_concept_id: str, downstream_concept_id: str) -> dict[str, Any]:
    group = _probe_groups().get(root_concept_id)
    if group is None:
        raise ValueError(f"No verification probes are available for '{root_concept_id}'.")
    if group["downstream_concept_id"] != downstream_concept_id:
        raise ValueError(
            f"No verification probe connects '{root_concept_id}' to "
            f"'{downstream_concept_id}'."
        )
    return group


def get_probe(root_concept_id: str, downstream_concept_id: str) -> dict[str, Any]:
    """Return a matching probe without leaking answer keys."""

    group = _group_for(root_concept_id, downstream_concept_id)
    questions = [
        {key: value for key, value in question.items() if key != "correct"}
        for question in group["questions"]
    ]
    return {
        "root_concept_id": group["root_concept_id"],
        "downstream_concept_id": group["downstream_concept_id"],
        "questions": questions,
    }


def grade(
    root_concept_id: str,
    downstream_concept_id: str,
    answers: list[VerifyAnswer],
) -> dict[str, Any]:
    """Grade one exact three-signal probe and produce an honest verdict."""

    group = _group_for(root_concept_id, downstream_concept_id)
    allowed_questions = {question["question_id"] for question in group["questions"]}
    signals: dict[str, dict[str, bool]] = {}

    for answer in answers:
        if answer.question_id not in allowed_questions:
            raise ValueError("A verification answer does not belong to this probe.")
        if answer.task_type in signals:
            raise ValueError(f"More than one '{answer.task_type}' answer was supplied.")

        question = _probe_bank()[answer.question_id]
        if answer.task_type != question["task_type"]:
            raise ValueError("A verification answer has the wrong task type.")
        if answer.selected not in question["options"]:
            raise ValueError("A verification answer has an invalid option.")

        signals[answer.task_type] = {"passed": answer.selected == question["correct"]}

    if set(signals) != REQUIRED_TASK_TYPES:
        raise ValueError("Exactly one direct, causal, and transfer answer is required.")

    direct_passed = signals["direct"]["passed"]
    causal_passed = signals["causal"]["passed"]
    transfer_passed = signals["transfer"]["passed"]

    if not direct_passed:
        verdict = "root_not_solid"
        confidence = "LOW"
        diagnosis_confirmed = None
        message = (
            f"{root_concept_id} itself is not solid yet. The direct probe was missed, "
            "so the diagnosis cannot be verified until that concept is addressed."
        )
        rediagnose = None
    elif not causal_passed:
        verdict = "not_confirmed"
        confidence = "LOW"
        diagnosis_confirmed = False
        message = (
            f"{root_concept_id} is solid, but its link to {downstream_concept_id} "
            "was not demonstrated. The original diagnosis is not confirmed."
        )
        rediagnose = {"focus_concept_id": downstream_concept_id}
    elif not transfer_passed:
        verdict = "confirmed"
        confidence = "MEDIUM"
        diagnosis_confirmed = True
        message = (
            f"{root_concept_id} is confirmed as the root cause, but applying it "
            "in a new context still needs practice."
        )
        rediagnose = None
    else:
        verdict = "confirmed"
        confidence = "HIGH"
        diagnosis_confirmed = True
        message = (
            f"{root_concept_id} is confirmed as the root cause across direct, "
            "causal, and transfer evidence."
        )
        rediagnose = None

    result: dict[str, Any] = {
        "root_concept_id": root_concept_id,
        "downstream_concept_id": downstream_concept_id,
        "signals": signals,
        "verdict": verdict,
        "confidence": confidence,
        "diagnosis_confirmed": diagnosis_confirmed,
        "message": message,
    }
    if rediagnose is not None:
        result["rediagnose"] = rediagnose
    return result
