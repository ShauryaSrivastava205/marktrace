import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.coach import _fallback
from app.engine.models import CoachRequest, ConceptMasteryEntry, RootGap
from app.main import coach_endpoint

SAMPLE_REQUEST = CoachRequest(
    root_gaps=[
        RootGap(
            concept_id="recursion",
            name="Recursion",
            confidence="MEDIUM",
            marks_associated=15,
            affected_questions=2,
            downstream_affected=["dp"],
        )
    ],
    concept_mastery=[
        ConceptMasteryEntry(concept_id="recursion", name="Recursion", mastery=0.2, status="weak"),
        ConceptMasteryEntry(concept_id="arrays", name="Arrays", mastery=1.0, status="ok"),
    ],
    explanation="Recursion is associated with 15 marks lost across 2 question(s).",
    evidence_sufficient=True,
)


class FallbackTests(unittest.TestCase):
    """The fallback is the safety net when Gemini is unreachable, so it must
    never invent anything beyond the caller-supplied CoachRequest."""

    def test_restates_top_root_gap_without_inventing_facts(self):
        text = _fallback(SAMPLE_REQUEST)

        self.assertIn("Recursion", text)
        self.assertIn("15", text)
        self.assertIn("2", text)
        self.assertNotIn("recover", text.lower())

    def test_flags_low_confidence_as_preliminary(self):
        low_confidence = SAMPLE_REQUEST.model_copy(
            update={"root_gaps": [SAMPLE_REQUEST.root_gaps[0].model_copy(update={"confidence": "LOW"})]}
        )

        self.assertIn("preliminary", _fallback(low_confidence).lower())

    def test_flags_insufficient_confidence_as_preliminary(self):
        insufficient = SAMPLE_REQUEST.model_copy(
            update={"root_gaps": [SAMPLE_REQUEST.root_gaps[0].model_copy(update={"confidence": "INSUFFICIENT"})]}
        )

        self.assertIn("preliminary", _fallback(insufficient).lower())

    def test_medium_confidence_has_no_preliminary_caveat(self):
        self.assertNotIn("preliminary", _fallback(SAMPLE_REQUEST).lower())

    def test_no_root_gaps_says_so_plainly(self):
        no_gaps = SAMPLE_REQUEST.model_copy(update={"root_gaps": []})

        self.assertEqual(_fallback(no_gaps), "No conceptual gaps were identified from this attempt.")


class CoachEndpointTests(unittest.TestCase):
    def test_returns_503_when_gemini_api_key_is_missing(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("GEMINI_API_KEY", None)
            with self.assertRaises(HTTPException) as ctx:
                coach_endpoint(SAMPLE_REQUEST)

        self.assertEqual(ctx.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
