import unittest

from app.engine.diagnose import diagnose
from app.engine.models import Answer, Attempt, VerifyAnswer
from app.engine.verify import get_probe, grade


class DiagnosisTests(unittest.TestCase):
    def test_diagnosis_distinguishes_a_conceptual_gap_from_mastery(self):
        weak_attempt = Attempt(
            student_id="weak-recursion",
            answers=[
                Answer(
                    question_id="rec_01",
                    concept_ids=["recursion"],
                    correct=False,
                    error_type="conceptual",
                    marks=5,
                )
            ],
        )
        strong_attempt = Attempt(
            student_id="strong-recursion",
            answers=[
                Answer(
                    question_id="rec_01",
                    concept_ids=["recursion"],
                    correct=True,
                    error_type=None,
                    marks=5,
                )
            ],
        )

        weak_result = diagnose(weak_attempt)
        strong_result = diagnose(strong_attempt)

        self.assertEqual(weak_result["concept_mastery"][0]["status"], "weak")
        self.assertTrue(weak_result["root_gaps"])
        self.assertEqual(strong_result["concept_mastery"][0]["status"], "ok")
        self.assertFalse(strong_result["root_gaps"])


class VerificationTests(unittest.TestCase):
    def test_probe_hides_answers_and_matches_requested_root_gap(self):
        probe = get_probe("graph", "bfs")

        self.assertEqual(probe["root_concept_id"], "graph")
        self.assertEqual(probe["downstream_concept_id"], "bfs")
        self.assertEqual(
            {question["task_type"] for question in probe["questions"]},
            {"direct", "causal", "transfer"},
        )
        self.assertTrue(all("correct" not in question for question in probe["questions"]))

    def test_grade_returns_high_confidence_for_three_correct_answers(self):
        result = grade(
            "recursion",
            "dp",
            [
                VerifyAnswer(question_id="r_dir_p1", task_type="direct", selected="A"),
                VerifyAnswer(question_id="d_cau_p1", task_type="causal", selected="A"),
                VerifyAnswer(question_id="r_trn_p1", task_type="transfer", selected="A"),
            ],
        )

        self.assertEqual(result["verdict"], "confirmed")
        self.assertEqual(result["confidence"], "HIGH")
        self.assertTrue(result["diagnosis_confirmed"])


if __name__ == "__main__":
    unittest.main()
