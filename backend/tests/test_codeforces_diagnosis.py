import unittest
from unittest import mock

from app.ingestion import codeforces as cf
from app.ingestion.codeforces_diagnosis import MIN_EVIDENCE, diagnose_codeforces
from tests.test_codeforces_ingestion import HISTORY, FakeSubmissions, solid_background, ts


def diagnose_fixture(fake: FakeSubmissions) -> dict:
    with mock.patch.object(cf, "fetch_rating_history", return_value=HISTORY), \
         mock.patch.object(cf, "fetch_submissions", return_value=fake.subs), \
         mock.patch.object(cf, "REQUEST_GAP_SECONDS", 0):
        attempt = cf.build_attempt("fixture")
    return diagnose_codeforces(attempt)


class MinimumEvidenceTests(unittest.TestCase):
    def test_a_real_gap_with_plenty_of_evidence_is_still_found(self):
        fake = FakeSubmissions()
        for i in range(10):
            fake.problem(1200 + 20 * i, ["dp"], ["WRONG_ANSWER"], ts(2023, 8))
        fake.problem(1000, ["dp"], ["OK"], ts(2023, 8))
        solid_background(fake, ts(2023, 8))
        result = diagnose_fixture(fake)
        self.assertEqual([g["concept_id"] for g in result["root_gaps"]], ["dp"])
        self.assertEqual(result["below_evidence_floor"], [])

    def test_three_failures_out_of_four_attempts_is_not_a_gap(self):
        fake = FakeSubmissions()
        when = ts(2023, 8)
        fake.problem(1200, ["graphs"], ["WRONG_ANSWER"], when)
        fake.problem(1250, ["graphs"], ["WRONG_ANSWER"], when)
        fake.problem(1225, ["graphs"], ["WRONG_ANSWER"], when)
        fake.problem(1100, ["graphs"], ["OK"], when)
        result = diagnose_fixture(fake)
        self.assertEqual(result["root_gaps"], [])
        self.assertEqual([c["concept_id"] for c in result["below_evidence_floor"]], ["graph"])
        self.assertFalse(result["evidence_sufficient"])
        self.assertIn("no concept has enough evidence", result["explanation"].lower())

    def test_the_floor_counts_weighted_attempts_inclusively(self):
        def with_failures(n: int) -> dict:
            fake = FakeSubmissions()
            for i in range(n):
                fake.problem(1200, ["dp"], ["WRONG_ANSWER"], ts(2023, 8))
            return diagnose_fixture(fake)

        self.assertEqual(MIN_EVIDENCE, 5.0)
        self.assertEqual(with_failures(4)["root_gaps"], [])
        self.assertEqual([g["concept_id"] for g in with_failures(5)["root_gaps"]], ["dp"])

    def test_multi_tag_failures_count_for_less_toward_the_floor(self):
        fake = FakeSubmissions()
        # Five failed problems, but each is shared three ways: 5/3 weight for dp.
        for i in range(5):
            fake.problem(1200, ["dp", "greedy", "graphs"], ["WRONG_ANSWER"], ts(2023, 8))
        self.assertEqual(diagnose_fixture(fake)["root_gaps"], [])


class EvidenceTermsTests(unittest.TestCase):
    def setUp(self) -> None:
        fake = FakeSubmissions()
        for i in range(8):
            fake.problem(1200 + 20 * i, ["dp"], ["WRONG_ANSWER"], ts(2023, 8))
        self.result = diagnose_fixture(fake)

    def test_explanation_and_gaps_never_mention_marks(self):
        self.assertNotIn("mark", self.result["explanation"].lower())
        for gap in self.result["root_gaps"]:
            self.assertNotIn("marks_associated", gap)

    def test_gap_reports_failed_problems_and_evidence_weight(self):
        gap = self.result["root_gaps"][0]
        self.assertEqual(gap["concept_id"], "dp")
        self.assertEqual(gap["failed_problems"], 8)
        self.assertEqual(gap["evidence_weight"], 8.0)
        self.assertIn("evidence weight 8", self.result["explanation"])
        self.assertIn("rough signal", self.result["explanation"])

    def test_no_evidence_at_all_says_so_without_marks(self):
        result = diagnose_fixture(FakeSubmissions())
        self.assertEqual(result["root_gaps"], [])
        self.assertNotIn("mark", result["explanation"].lower())


if __name__ == "__main__":
    unittest.main()
