"""Assembles the final diagnosis for one Attempt by chaining every stage of
the root-cause engine, shaped to match docs/API_CONTRACT.md's POST /diagnose
response as closely as this engine's current inputs allow.

Known deviations from the contract (to reconcile once the surrounding API
exists): this operates on a student_id, not a session_id, since there is no
diagnostic-session concept at the engine layer yet; and `confidence` here is
Stage 5's tier string (INSUFFICIENT/LOW/MEDIUM/HIGH) rather than a number.
"""

from .graph_loader import get_conceptual_descendants, get_label
from .models import Attempt
from .stage1_evidence_gate import gate
from .stage2_concept_weakness import concept_weakness
from .stage3_candidates import candidate_root_causes
from .stage4_root_selection import select_root_causes
from .stage5_confidence import add_confidence
from .stage6_mark_impact import add_mark_impact


def diagnose(attempt: Attempt) -> dict:
    conceptual_evidence, excluded = gate(attempt)
    weakness = concept_weakness(attempt)
    candidates = candidate_root_causes(weakness)
    roots = select_root_causes(candidates)
    roots = add_confidence(roots, weakness)
    roots = add_mark_impact(roots, attempt)

    weak_concepts = [c for c, info in weakness.items() if info["status"] == "weak"]
    evidence_sufficient = bool(weak_concepts) and any(
        root["confidence"] != "INSUFFICIENT" for root in roots
    )

    concept_mastery = [
        {
            "concept_id": concept_id,
            "name": get_label(concept_id),
            "mastery": info["mastery"],
            "status": info["status"],
        }
        for concept_id, info in weakness.items()
    ]

    root_gaps = [
        {
            "concept_id": root["concept_id"],
            "name": get_label(root["concept_id"]),
            "confidence": root["confidence"],
            "marks_associated": root["associated_marks"],
            "affected_questions": root["affected_questions"],
            "downstream_affected": root["explains"],
        }
        for root in roots
    ]

    # Stage 4 orders roots by explanatory power (greedy set-cover pick order),
    # so the first root is the most parsimonious explanation available.
    if roots:
        top_root = roots[0]
        blast_radius = {
            "root_concept_id": top_root["concept_id"],
            "unlocked_concepts": sorted(get_conceptual_descendants(top_root["concept_id"])),
        }
    else:
        blast_radius = None

    return {
        "student_id": attempt.student_id,
        "evidence_sufficient": evidence_sufficient,
        "concept_mastery": concept_mastery,
        "root_gaps": root_gaps,
        "blast_radius": blast_radius,
        "explanation": _build_explanation(roots),
        # TODO(forecast): needs upcoming-exam concept weightage (marks at
        # risk per concept on the *next* assessment) to compute
        # marks_at_risk / by_concept — that data doesn't exist yet.
        "forecast": None,
    }


def _build_explanation(roots: list[dict]) -> str:
    """A plain-language, honest summary. Deliberately says "associated with",
    never "recover" — this engine reports correlation with lost marks, not a
    guarantee that fixing the concept recovers them."""
    if not roots:
        return "No conceptual gaps were identified from this attempt."

    sentences = []
    for root in roots:
        downstream = [c for c in root["explains"] if c != root["concept_id"]]
        if downstream:
            downstream_str = ", ".join(get_label(c) for c in downstream)
            sentences.append(
                f"{get_label(root['concept_id'])} is associated with "
                f"{root['associated_marks']} marks lost across {root['affected_questions']} "
                f"question(s), which also appears to explain gaps in {downstream_str} "
                f"(confidence: {root['confidence']})."
            )
        else:
            sentences.append(
                f"{get_label(root['concept_id'])} is associated with "
                f"{root['associated_marks']} marks lost across {root['affected_questions']} "
                f"question(s) (confidence: {root['confidence']})."
            )

    return " ".join(sentences)
