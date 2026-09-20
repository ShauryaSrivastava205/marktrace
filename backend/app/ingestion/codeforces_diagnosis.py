"""Diagnosis for a Codeforces-derived Attempt.

Runs the shared root-cause engine with a minimum-evidence floor and reports
the result in evidence terms. Codeforces submissions are not exam marks, so
nothing here says "marks": impact is the number of failed problems and their
combined evidence weight.
"""

from __future__ import annotations

from ..engine.diagnose import diagnose
from ..engine.graph_loader import get_label
from ..engine.models import Attempt
from ..engine.stage1_evidence_gate import gate
from ..engine.stage2_concept_weakness import concept_weakness

# A concept needs at least this much weighted evidence (about five single-tag
# problems) before it can be called a gap. Chosen against the data available
# when it was set: spurious weak concepts on real handles had <= 2.6, the
# synthetic DP-weak student ~11. Anything from ~3 to ~10 behaves identically
# on those, so 5 is the round value inside that band, not a fitted optimum.
MIN_EVIDENCE = 5.0


def diagnose_codeforces(attempt: dict, min_evidence: float = MIN_EVIDENCE) -> dict:
    """Attempt dict (from build_attempt) -> diagnosis in evidence terms."""
    parsed = Attempt(**attempt)
    result = diagnose(parsed, min_evidence=min_evidence)
    gated_failures, _ = gate(parsed)

    root_gaps = []
    for gap in result["root_gaps"]:
        associated = {gap["concept_id"], *gap["downstream_affected"]}
        touching = [a for a in gated_failures if associated & set(a.concept_ids)]
        root_gaps.append(
            {
                "concept_id": gap["concept_id"],
                "name": gap["name"],
                "confidence": gap["confidence"],
                "failed_problems": gap["affected_questions"],
                "evidence_weight": round(sum(a.weight for a in touching), 2),
                "downstream_affected": gap["downstream_affected"],
            }
        )

    # Concepts that would look weak but were held back by the evidence floor.
    unfloored = concept_weakness(parsed)
    floored = concept_weakness(parsed, min_evidence)
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
        "blast_radius": result["blast_radius"],
        "explanation": explain(root_gaps, below_floor, min_evidence),
    }


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
    sentences.append(
        "This is inferred from submission verdicts, which are only a rough signal "
        "of understanding."
    )
    return " ".join(sentences)
