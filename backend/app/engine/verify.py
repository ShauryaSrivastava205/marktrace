"""Verify: a targeted follow-up quiz that confirms or overturns a root-cause
diagnosis from the engine, rather than inferring confidence from the original
attempt's evidence alone (see stage5_confidence.py's module docstring).

Each probe question targets one of three task types along the causal chain
root -> downstream concept:
  - direct: can the student do the root concept itself, in isolation?
  - causal: do they understand how the root concept produces the downstream
    behavior that was originally flagged as weak?
  - transfer: can they apply the root concept in a novel context, without
    the concept being named for them (see concept_hidden)?

PROBE_BANK is a temporary hand-written mock; the real question bank is coming
later from Vasu and will presumably be keyed by concept_id rather than
hardcoded like this.
"""

from .models import VerifyAnswer

PROBE_BANK = {
    "r_dir_01": {
        "task_type": "direct",
        "concept_id": "recursion",
        "prompt": "int f(int n){ if(n<=1) return 1; return n*f(n-1); }  What is f(4)?",
        "options": {"A": "24", "B": "12", "C": "4", "D": "1"},
        "correct": "A",
    },
    "d_cau_01": {
        "task_type": "causal",
        "concept_id": "dp",
        "prompt": "Which recurrence correctly defines the Fibonacci subproblem?",
        "options": {
            "A": "fib(n)=fib(n-1)+fib(n-2)",
            "B": "fib(n)=fib(n-1)*fib(n-2)",
            "C": "fib(n)=fib(n-1)+1",
            "D": "fib(n)=n+fib(n-1)",
        },
        "correct": "A",
    },
    "r_trn_01": {
        "task_type": "transfer",
        "concept_id": "recursion",
        "concept_hidden": True,
        "prompt": "You must list every subset of {1,2,3}. Which approach naturally generates all of them?",
        "options": {
            "A": "For each element, branch on include/exclude and recurse",
            "B": "Sort the array, then binary search",
            "C": "One for-loop from 0 to n",
            "D": "Swap adjacent pairs until sorted",
        },
        "correct": "A",
    },
}


def grade(root_concept_id: str, downstream_concept_id: str, answers: list[VerifyAnswer]) -> dict:
    """Grade a completed Verify quiz and apply the confirmation ladder.

    The ladder is checked in order: a failed direct probe means the root
    concept itself isn't solid, which takes priority over everything else.
    Only once direct holds do causal and then transfer get to speak to
    whether the original diagnosis is confirmed. Verification requires
    positive evidence, so a task type with no matching answer is treated as
    NOT passed — absence of evidence is not evidence of mastery.
    """
    signals: dict[str, dict[str, bool]] = {}
    for answer in answers:
        probe = PROBE_BANK[answer.question_id]
        signals[answer.task_type] = {"passed": answer.selected == probe["correct"]}

    direct_passed = signals.get("direct", {}).get("passed", False)
    causal_passed = signals.get("causal", {}).get("passed", False)
    transfer_passed = signals.get("transfer", {}).get("passed", False)

    rediagnose = None

    if not direct_passed:
        verdict = "root_not_solid"
        confidence = "LOW"
        diagnosis_confirmed = None
        message = (
            f"{root_concept_id} itself isn't solid yet — the student missed a "
            "direct question on it, so the diagnosis can't be verified until "
            "that's addressed."
        )
    elif not causal_passed:
        verdict = "not_confirmed"
        confidence = "LOW"
        diagnosis_confirmed = False
        rediagnose = {"focus_concept_id": downstream_concept_id}
        message = (
            f"{root_concept_id} is solid, but the student couldn't connect it "
            f"to {downstream_concept_id} — the original diagnosis isn't confirmed."
        )
    elif not transfer_passed:
        verdict = "confirmed"
        confidence = "MEDIUM"
        diagnosis_confirmed = True
        message = (
            f"{root_concept_id} is confirmed as the root cause, though the "
            "student struggled to transfer it to a novel context."
        )
    else:
        verdict = "confirmed"
        confidence = "HIGH"
        diagnosis_confirmed = True
        message = (
            f"{root_concept_id} is confirmed as the root cause, holding up "
            "across direct, causal, and transfer probes."
        )

    result = {
        "root_concept_id": root_concept_id,
        "signals": signals,
        "verdict": verdict,
        "confidence": confidence,
        "diagnosis_confirmed": diagnosis_confirmed,
        "message": message,
    }
    if rediagnose is not None:
        result["rediagnose"] = rediagnose
    return result
