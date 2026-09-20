"""Gemini-backed coaching layer: turns a diagnosis into a plain-language
explanation and a short study plan for the student.

Grounded strictly in the facts the caller supplies in CoachRequest -- the
system instruction forbids inventing concepts or gaps, and any failure to
reach Gemini falls back to a safe, factual restatement of the data instead
of a 500.
"""

import os
from typing import Optional

from .engine.models import CoachRequest, RootGap

MODEL_NAME = "gemini-1.5-flash"
REQUEST_TIMEOUT_SECONDS = 15
WORD_LIMIT = 150

SYSTEM_INSTRUCTION = f"""You are a study coach explaining a diagnostic result to a student.

Hard rules:
- Explain the diagnosis in plain, encouraging language and give a short, concrete study plan: what to fix first and why.
- Use ONLY the concepts and facts given to you below. Do not invent gaps or mention concepts that are not listed.
- Do not claim certainty beyond the given confidence tier. If a root gap's confidence is LOW or INSUFFICIENT, explicitly call that part of the diagnosis preliminary.
- Never say a fix will "recover" marks. Say a concept is "associated with" marks lost.
- Keep the response under {WORD_LIMIT} words.
"""


def _fallback(request: CoachRequest) -> str:
    """Safe fallback used whenever Gemini can't be reached: restates the top
    root gap straight from the caller-supplied data, inventing nothing."""
    if not request.root_gaps:
        return "No conceptual gaps were identified from this attempt."
    top: RootGap = request.root_gaps[0]
    preliminary = " This is a preliminary finding." if top.confidence in ("LOW", "INSUFFICIENT") else ""
    return (
        f"{top.name} is associated with {top.marks_associated} marks lost "
        f"across {top.affected_questions} question(s).{preliminary}"
    )


def _build_prompt(request: CoachRequest) -> str:
    lines = [f"evidence_sufficient: {request.evidence_sufficient}", "", "root_gaps:"]
    for gap in request.root_gaps:
        lines.append(
            f"- {gap.name} (concept_id={gap.concept_id}): confidence={gap.confidence}, "
            f"marks_associated={gap.marks_associated}, affected_questions={gap.affected_questions}, "
            f"downstream_affected={gap.downstream_affected}"
        )
    lines.append("")
    lines.append("concept_mastery:")
    for concept in request.concept_mastery:
        lines.append(
            f"- {concept.name} (concept_id={concept.concept_id}): "
            f"mastery={concept.mastery}, status={concept.status}"
        )
    lines.append("")
    lines.append(f"explanation: {request.explanation}")
    return "\n".join(lines)


def gemini_api_key() -> Optional[str]:
    return os.environ.get("GEMINI_API_KEY")


def coach(request: CoachRequest) -> dict:
    """Assumes gemini_api_key() is already known to be set -- the endpoint
    checks that and returns 503 before calling this. Any error talking to
    Gemini itself is caught here and turned into the safe fallback."""
    try:
        import google.generativeai as genai

        genai.configure(api_key=gemini_api_key())
        model = genai.GenerativeModel(MODEL_NAME, system_instruction=SYSTEM_INSTRUCTION)
        response = model.generate_content(
            _build_prompt(request),
            request_options={"timeout": REQUEST_TIMEOUT_SECONDS},
        )
        text = (response.text or "").strip()
        return {"coaching": text or _fallback(request)}
    except Exception:
        return {"coaching": _fallback(request)}
