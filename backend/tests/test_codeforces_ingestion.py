"""Ground-truth tests for the Codeforces adapter.

The fixture is a synthetic student whose weakness (DP) is known in advance, so
these tests check that the pipeline handle -> build_attempt -> diagnose can
surface a gap that really exists, and stays quiet when it does not.
"""

import calendar
import unittest
from unittest import mock

from app.engine.diagnose import diagnose
from app.engine.graph_loader import get_conceptual_ancestors
from app.engine.models import Attempt
from app.engine.stage2_concept_weakness import concept_weakness
from app.engine.stage3_candidates import candidate_root_causes
from app.ingestion import codeforces as cf


def ts(year: int, month: int, day: int = 1) -> int:
    return calendar.timegm((year, month, day, 12, 0, 0))


# Rating history: 1000 after Jan 2023, 1150 after Mar, 1300 after Jun.
HISTORY = [(ts(2023, 1), 1000), (ts(2023, 3), 1150), (ts(2023, 6), 1300)]


class FakeSubmissions:
    """Builds Codeforces-shaped submissions for one synthetic student."""

    def __init__(self) -> None:
        self.subs: list[dict] = []
        self._next_contest = 1000

    def problem(self, rating, tags, verdicts, when) -> None:
        contest = self._next_contest
        self._next_contest += 1
        for offset, verdict in enumerate(verdicts):
            self.subs.append(
                {
                    "problem": {
                        "contestId": contest,
                        "index": "A",
                        "name": f"P{contest}",
                        "rating": rating,
                        "tags": tags,
                    },
                    "verdict": verdict,
                    "creationTimeSeconds": when + offset * 600,
                    "programmingLanguage": "C++17",
                    "author": {"participantType": "PRACTICE"},
                }
            )


def run(history, subs, handle="fixture"):
    with mock.patch.object(cf, "fetch_rating_history", return_value=history), \
         mock.patch.object(cf, "fetch_submissions", return_value=subs), \
         mock.patch.object(cf, "REQUEST_GAP_SECONDS", 0):
        attempt = cf.build_attempt(handle)
    return attempt, diagnose(Attempt(**attempt))


def solid_background(fake: FakeSubmissions, when: int) -> None:
    """Everything that is not DP is solved, near the student's rating."""
    for tags in (["greedy"], ["graphs"], ["strings"], ["binary search"], ["dfs and similar"]):
        for i in range(5):
            fake.problem(1100 + 60 * i, tags, ["OK"], when)


class DpWeakStudentTests(unittest.TestCase):
    def setUp(self) -> None:
        fake = FakeSubmissions()
        when = ts(2023, 8)
        # Ten DP problems near the 1300 rating, all failed (two WAs each).
        for i in range(5):
            fake.problem(1200 + 40 * i, ["dp"], ["WRONG_ANSWER", "WRONG_ANSWER"], when)
        for i in range(3):
            fake.problem(1250 + 40 * i, ["dp", "math"], ["WRONG_ANSWER", "WRONG_ANSWER"], when)
        for i in range(2):
            fake.problem(1300 + 40 * i, ["dp", "greedy"], ["WRONG_ANSWER", "WRONG_ANSWER"], when)
        # Two easier DP problems solved, so the signal is a gap, not zero data.
        fake.problem(1000, ["dp"], ["OK"], when)
        fake.problem(1050, ["dp"], ["OK"], when)
        solid_background(fake, when)
        # Noise that must not implicate anything.
        fake.problem(2400, ["dp"], ["WRONG_ANSWER"] * 3, when)       # far above ability
        fake.problem(2200, ["graphs"], ["WRONG_ANSWER"] * 3, when)   # far above ability
        fake.problem(1300, ["graphs"], ["PARTIAL", "SKIPPED"], when)  # not evidence
        self.attempt, self.result = run(HISTORY, fake.subs)

    def test_dp_is_the_surfaced_root_gap(self):
        roots = {gap["concept_id"]: gap for gap in self.result["root_gaps"]}
        self.assertEqual(set(roots), {"dp"})
        self.assertIn(roots["dp"]["confidence"], {"MEDIUM", "LOW"})
        self.assertNotEqual(roots["dp"]["confidence"], "INSUFFICIENT")
        self.assertTrue(self.result["evidence_sufficient"])

    def test_recursion_is_a_candidate_upstream_of_the_dp_gap(self):
        # The tag map never names recursion; the graph must supply it.
        self.assertIn("recursion", get_conceptual_ancestors("dp"))
        weakness = concept_weakness(Attempt(**self.attempt))
        candidates = {c["concept_id"] for c in candidate_root_causes(weakness)}
        self.assertIn("recursion", candidates)

    def test_solved_and_out_of_window_concepts_are_not_blamed(self):
        status = {c["concept_id"]: c["status"] for c in self.result["concept_mastery"]}
        for concept in ("graph", "strings", "binary_search", "dfs", "greedy"):
            self.assertNotEqual(status.get(concept), "weak", concept)

    def test_far_above_ability_and_ignored_verdicts_are_dropped(self):
        meta = self.attempt["meta"]
        self.assertEqual(meta["dropped_outside_window"], 2)
        self.assertEqual(meta["ignored_submissions"], 2)


class ControlStudentTests(unittest.TestCase):
    def test_a_student_who_solves_everything_gets_no_root_gap(self):
        fake = FakeSubmissions()
        solid_background(fake, ts(2023, 8))
        _, result = run(HISTORY, fake.subs)
        self.assertEqual(result["root_gaps"], [])


class TemporalWindowTests(unittest.TestCase):
    def test_old_failures_are_judged_against_the_rating_at_the_time(self):
        fake = FakeSubmissions()
        # Feb 2023: rating was 1000 (window 600..1200). 1400-rated DP problems
        # were far too hard then. Judged against today's 1300 they would count.
        for i in range(8):
            fake.problem(1400, ["dp"], ["WRONG_ANSWER"], ts(2023, 2, 1 + i))
        solid_background(fake, ts(2023, 8))
        attempt, result = run(HISTORY, fake.subs)
        self.assertEqual(attempt["meta"]["dropped_outside_window"], 8)
        self.assertEqual(result["root_gaps"], [])

    def test_attempts_before_the_first_rated_contest_are_dropped_not_guessed(self):
        fake = FakeSubmissions()
        for i in range(6):
            fake.problem(1000, ["dp"], ["WRONG_ANSWER"], ts(2022, 12, 1 + i))
        attempt, result = run(HISTORY, fake.subs)
        self.assertEqual(attempt["meta"]["dropped_unknown_ability"], 6)
        self.assertEqual(attempt["answers"], [])
        self.assertEqual(result["root_gaps"], [])

    def test_unrated_handle_yields_no_evidence_instead_of_a_default_rating(self):
        fake = FakeSubmissions()
        for i in range(6):
            fake.problem(1000, ["dp"], ["WRONG_ANSWER"], ts(2023, 8, 1 + i))
        attempt, _ = run([], fake.subs)
        self.assertEqual(attempt["answers"], [])

    def test_a_low_rated_beginner_keeps_the_easiest_problems(self):
        # Rated 404 after one contest: ceiling would be 604, above which sits
        # every problem on the site. The floor keeps the 800-1000 band.
        beginner = [(ts(2023, 1), 404)]
        fake = FakeSubmissions()
        fake.problem(800, ["greedy"], ["WRONG_ANSWER"], ts(2023, 2))
        fake.problem(1000, ["greedy"], ["OK"], ts(2023, 2))
        fake.problem(1200, ["greedy"], ["WRONG_ANSWER"], ts(2023, 2))  # still above
        attempt, _ = run(beginner, fake.subs)
        self.assertEqual([a["question_id"] for a in attempt["answers"]], ["cf_1000-A", "cf_1001-A"])
        self.assertEqual(attempt["meta"]["dropped_outside_window"], 1)

    def test_the_ceiling_floor_does_not_loosen_the_window_for_stronger_users(self):
        fake = FakeSubmissions()
        fake.problem(1600, ["dp"], ["WRONG_ANSWER"], ts(2023, 8))  # ability 1300 -> ceiling 1500
        attempt, _ = run(HISTORY, fake.subs)
        self.assertEqual(attempt["answers"], [])
        self.assertEqual(attempt["meta"]["dropped_outside_window"], 1)

    def test_rating_at_is_a_step_function_over_contest_history(self):
        self.assertIsNone(cf.rating_at(HISTORY, ts(2022, 12)))
        self.assertEqual(cf.rating_at(HISTORY, ts(2023, 1)), 1000)
        self.assertEqual(cf.rating_at(HISTORY, ts(2023, 2)), 1000)
        self.assertEqual(cf.rating_at(HISTORY, ts(2023, 3, 2)), 1150)
        self.assertEqual(cf.rating_at(HISTORY, ts(2030, 1)), 1300)


class AdapterCorrectnessTests(unittest.TestCase):
    def test_tag_weight_is_split_across_mapped_concepts(self):
        fake = FakeSubmissions()
        fake.problem(1200, ["dp", "greedy", "math"], ["WRONG_ANSWER"], ts(2023, 8))
        fake.problem(1200, ["dp"], ["OK"], ts(2023, 8))
        attempt, _ = run(HISTORY, fake.subs)
        by_id = {a["question_id"]: a for a in attempt["answers"]}
        self.assertEqual(by_id["cf_1000-A"]["weight"], 0.5)   # math is unmapped
        self.assertEqual(by_id["cf_1001-A"]["weight"], 1.0)

    def test_output_does_not_describe_codeforces_evidence_as_marks(self):
        fake = FakeSubmissions()
        fake.problem(1200, ["dp"], ["WRONG_ANSWER"], ts(2023, 8))
        attempt, _ = run(HISTORY, fake.subs)
        self.assertNotIn("marks", attempt["answers"][0])

    def test_a_problem_with_only_ignored_verdicts_produces_no_answer(self):
        fake = FakeSubmissions()
        fake.problem(1200, ["dp"], ["PARTIAL", "SKIPPED", "IDLENESS_LIMIT_EXCEEDED"], ts(2023, 8))
        attempt, _ = run(HISTORY, fake.subs)
        self.assertEqual(attempt["answers"], [])


def fake_response(status_code, body):
    response = mock.Mock(status_code=status_code)
    if isinstance(body, Exception):
        response.json.side_effect = body
    else:
        response.json.return_value = body
    return response


class ApiErrorTests(unittest.TestCase):
    def test_missing_handle_raises_a_clear_error_with_the_codeforces_comment(self):
        body = {"status": "FAILED", "comment": "handle: User ghost_handle not found"}
        with mock.patch.object(cf.requests, "get", return_value=fake_response(400, body)):
            with self.assertRaises(cf.HandleNotFoundError) as caught:
                cf.fetch_rating_history("ghost_handle")
        self.assertIn("ghost_handle not found", str(caught.exception))

    def test_other_http_errors_keep_the_codeforces_comment(self):
        body = {"status": "FAILED", "comment": "Call limit exceeded"}
        with mock.patch.object(cf.requests, "get", return_value=fake_response(503, body)):
            with self.assertRaises(cf.CodeforcesError) as caught:
                cf.fetch_submissions("someone")
        self.assertNotIsInstance(caught.exception, cf.HandleNotFoundError)
        self.assertIn("Call limit exceeded", str(caught.exception))

    def test_non_json_error_falls_back_to_the_http_status(self):
        with mock.patch.object(cf.requests, "get", return_value=fake_response(502, ValueError())):
            with self.assertRaises(cf.CodeforcesError) as caught:
                cf.fetch_submissions("someone")
        self.assertIn("502", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
