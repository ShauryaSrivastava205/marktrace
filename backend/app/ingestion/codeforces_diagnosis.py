"""Diagnosis for a Codeforces-derived Attempt.

Runs the shared root-cause engine with two weakness sources:
  - mastery: the student fails a concept's problems (with a minimum-evidence floor);
  - effort:  the student eventually solves a concept's problems but needs far
             more wrong tries than peers at the same difficulty, sustained over
             time (ingestion/codeforces_effort.py).
Both feed the same graph traversal and set cover; there is no parallel engine.

Codeforces submissions are not exam marks, so nothing here says "marks": impact
is failed problems, evidence weight, or wrong-tries relative to peers.
"""

from __future__ import annotations

from ..engine.diagnose import diagnose
from ..engine.graph_loader import get_label
from ..engine.models import Attempt
from ..engine.stage1_evidence_gate import gate
from ..engine.stage2_concept_weakness import concept_weakness
from . import codeforces_effort as effort

# A concept needs at least this much weighted evidence (about five single-tag
# problems) before it can be called a gap. Chosen against the data available
# when it was set: spurious weak concepts on real handles had <= 2.6, the
# synthetic DP-weak student ~11. Anything from ~3 to ~10 behaves identically
# on those, so 5 is the round value inside that band, not a fitted optimum.
MIN_EVIDENCE = 5.0

_DEFAULT_BASELINE = object()


def _effort_flags(attempt: dict, baseline) -> dict:
    """{"status", "reason"?, "flags", "suppressed"} for this attempt."""
    if baseline is _DEFAULT_BASELINE:
        baseline = effort.load_baseline()
    problem = effort.baseline_problem(baseline)
    if problem is None and "trajectories" not in attempt:
        problem = "attempt carries no per-problem trajectories"
    if problem is not None:
        return {"status": "unavailable", "reason": problem, "flags": [], "suppressed": []}
    analysis = effort.effort_analysis(attempt["trajectories"], baseline)
    return {"status": "ok", **analysis}


def diagnose_codeforces(
    attempt: dict, min_evidence: float = MIN_EVIDENCE, baseline=_DEFAULT_BASELINE
) -> dict:
    """Attempt dict (from build_attempt) -> diagnosis in evidence terms."""
    parsed = Attempt(**attempt)
    effort_result = _effort_flags(attempt, baseline)
    effort_by_concept = {f["concept_id"]: f for f in effort_result["flags"]}

    result = diagnose(parsed, min_evidence=min_evidence, effort_weak=effort_by_concept)
    gated_failures, _ = gate(parsed)

    # Concepts weak by mastery alone (no effort source), with and without the floor.
    unfloored = concept_weakness(parsed)
    floored = concept_weakness(parsed, min_evidence)

    root_gaps = []
    for gap in result["root_gaps"]:
        concept = gap["concept_id"]
        entry = {
            "concept_id": concept,
            "name": gap["name"],
            "confidence": gap["confidence"],
            "basis": "mastery" if floored[concept]["status"] == "weak" else "effort",
            "downstream_affected": gap["downstream_affected"],
        }
        if entry["basis"] == "effort":
            entry["effort"] = effort_by_concept[concept]
        else:
            associated = {concept, *gap["downstream_affected"]}
            touching = [a for a in gated_failures if associated & set(a.concept_ids)]
            entry["failed_problems"] = gap["affected_questions"]
            entry["evidence_weight"] = round(sum(a.weight for a in touching), 2)
        root_gaps.append(entry)

    # Concepts that would look weak but were held back by the evidence floor.
    below_floor = sorted(
        c for c, info in unfloored.items()
        if info["status"] == "weak" and floored[c]["status"] != "weak"
    )

    return {
        "student_id": result["student_id"],
        "evidence_sufficient": result["evidence_sufficient"],
        "concept_mastery": result["concept_mastery"],
        "root_gaps": root_gaps,
        "below_evidence_floor": [{"concept_id": c, "name": get_label(c)} for c in below_floor],
        "effort": {k: effort_result[k] for k in ("status", "reason", "suppressed") if k in effort_result}
        | {"flags": effort_result["flags"]},
        "blast_radius": result["blast_radius"],
        "explanation": explain(root_gaps, below_floor, min_evidence),
    }


def _effort_sentence(gap: dict) -> str:
    e = gap["effort"]
    extra = e["effect"]
    return (
        f"{gap['name']}: you do solve these problems eventually, but across {e['n_solved']} "
        f"solved problems in your range the typical one took {e['raw_median_wrong_tries']:g} "
        f"wrong attempt(s) before an accepted solution, about {extra:.1f} more than peers at "
        f"the same difficulty (z = {e['z']:.1f}, {e['population_handles']} similarly rated "
        f"handles), and this held in both halves of your history. That is an effort signal, "
        f"not proof you can't do it, so confidence is capped at MEDIUM without a "
        f"verification probe (confidence: {gap['confidence']})."
    )


def explain(root_gaps: list[dict], below_floor: list[str], min_evidence: float) -> str:
    """Plain-language summary in evidence terms. Says what the submissions
    show and how thin or solid that is, never that a gap 'cost' anything."""
    if not root_gaps:
        if below_floor:
            names = ", ".join(get_label(c) for c in below_floor)
            return (
                f"No concept has enough evidence to call a gap. {names} showed some "
                f"failed attempts, but fewer than {min_evidence:g} weighted attempts "
                "back them, so no conclusion is drawn."
            )
        return "No conceptual gaps were identified from these submissions."

    sentences = []
    for gap in root_gaps:
        if gap["basis"] == "effort":
            sentences.append(_effort_sentence(gap))
            continue
        downstream = [c for c in gap["downstream_affected"] if c != gap["concept_id"]]
        text = (
            f"{gap['name']} is a candidate gap: {gap['failed_problems']} failed "
            f"problem(s) involve it or the concepts that depend on it "
            f"(evidence weight {gap['evidence_weight']:g})"
        )
        if downstream:
            text += ", and it may also explain weak results in " + ", ".join(
                get_label(c) for c in downstream
            )
        sentences.append(f"{text} (confidence: {gap['confidence']}).")
    if any(g["basis"] == "mastery" for g in root_gaps):
        sentences.append(
            "Failure-based gaps are inferred from submission verdicts, which are only a "
            "rough signal of understanding."
        )
    return " ".join(sentences)
