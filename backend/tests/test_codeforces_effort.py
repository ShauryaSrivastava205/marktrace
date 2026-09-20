"""Effort-based weakness: solved eventually, but with far more wrong tries than peers."""

import unittest
from unittest import mock

from app.engine.models import Answer, Attempt
from app.engine.stage2_concept_weakness import concept_weakness
from app.ingestion import codeforces as cf
from app.ingestion import codeforces_effort as ce
from app.ingestion.codeforces_diagnosis import diagnose_codeforces
from tests.test_codeforces_ingestion import HISTORY, FakeSubmissions, ts

STRUGGLE = ["WRONG_ANSWER", "WRONG_ANSWER", "OK"]   # 2 wrong tries, then solved
CLEAN = ["OK"]


def synthetic_baseline(**overrides) -> dict:
    """Peers need ~0.5 wrong tries at every difficulty; a typical handle's
    per-concept median residual is -0.5 with SD 0.3."""
    concept = {"n_handles": 60, "mean": -0.5, "sd": 0.3}
    baseline = {
        "band_means": {str(b): {"mean": 0.5, "sd": 0.5, "n": 1000} for b in range(-4, 4)},
        "concepts": {c: dict(concept) for c in ("dp", "graph", "dfs", "greedy", "strings")},
        "tag_map_sha256": ce._tag_map_sha(),
        "params": ce._params(),
    }
    baseline.update(overrides)
    return baseline


def months(n: int, first: int = 7):
    """n problem slots spread across successive months from `first` (2023)."""
    return [ts(2023 + (first + i - 1) // 12, (first + i - 1) % 12 + 1) for i in range(n)]


def diagnose_fake(fake: FakeSubmissions, baseline=None) -> dict:
    with mock.patch.object(cf, "fetch_rating_history", return_value=HISTORY), \
         mock.patch.object(cf, "fetch_submissions", return_value=fake.subs), \
         mock.patch.object(cf, "REQUEST_GAP_SECONDS", 0):
        attempt = cf.build_attempt("fixture")
    return diagnose_codeforces(attempt, baseline=synthetic_baseline() if baseline is None else baseline)


def struggling_dp_student(n=12) -> FakeSubmissions:
    fake = FakeSubmissions()
    for when in months(n):
        fake.problem(1250, ["dp"], STRUGGLE, when)      # always solved, always after 2 WAs
    for when in months(15):
        fake.problem(1250, ["greedy"], CLEAN, when)
    return fake


class EffortDetectionTests(unittest.TestCase):
    def test_a_student_who_always_solves_dp_but_after_retries_is_flagged(self):
        result = diagnose_fake(struggling_dp_student())
        self.assertEqual(result["effort"]["status"], "ok")
        (gap,) = result["root_gaps"]
        self.assertEqual((gap["concept_id"], gap["basis"]), ("dp", "effort"))
        self.assertIn(gap["confidence"], {"LOW", "MEDIUM"})
        self.assertNotIn("failed_problems", gap)   # nothing was failed
        status = {c["concept_id"]: c for c in result["concept_mastery"]}
        self.assertEqual(status["dp"]["mastery"], 1.0)      # mastery alone would call it healthy
        self.assertEqual(status["dp"]["source"], "effort")
        self.assertNotIn("source", status["greedy"])
        self.assertTrue(result["evidence_sufficient"])

    def test_effort_gaps_never_exceed_medium(self):
        fake = FakeSubmissions()
        for when in months(12):
            fake.problem(1250, ["dp"], ["WRONG_ANSWER"] * 9 + ["OK"], when)
        (gap,) = diagnose_fake(fake)["root_gaps"]
        self.assertEqual(gap["confidence"], "MEDIUM")
        self.assertGreater(gap["effort"]["z"], ce.Z_MEDIUM)

    def test_a_modest_shift_is_not_flagged(self):
        fake = FakeSubmissions()
        for i, when in enumerate(months(12)):
            # Half the problems need one retry, half none: median residual 0, z = 1.7.
            fake.problem(1250, ["dp"], ["WRONG_ANSWER", "OK"] if i % 2 else CLEAN, when)
        self.assertEqual(diagnose_fake(fake)["root_gaps"], [])

    def test_needing_a_retry_on_most_problems_is_flagged(self):
        fake = FakeSubmissions()
        for when in months(12):
            fake.problem(1250, ["dp"], ["WRONG_ANSWER", "OK"], when)   # median 1 wrong try: z = 3.3
        (gap,) = diagnose_fake(fake)["root_gaps"]
        self.assertEqual((gap["concept_id"], gap["confidence"]), ("dp", "LOW"))

    def test_too_few_problems_is_not_flagged(self):
        fake = FakeSubmissions()
        for when in months(7):
            fake.problem(1250, ["dp"], STRUGGLE, when)
        self.assertEqual(diagnose_fake(fake)["root_gaps"], [])

    def test_a_single_bad_stretch_is_not_persistent(self):
        fake = FakeSubmissions()
        slots = months(12)
        for when in slots[:6]:
            fake.problem(1250, ["dp"], STRUGGLE, when)      # early struggle...
        for when in slots[6:]:
            fake.problem(1250, ["dp"], CLEAN, when)          # ...then fine
        result = diagnose_fake(fake)
        self.assertEqual(result["root_gaps"], [])
        (suppressed,) = result["effort"]["suppressed"]
        self.assertEqual(suppressed["concept_id"], "dp")
        self.assertIn("not persistent", suppressed["reason"])

    def test_struggle_that_only_appears_recently_is_not_persistent_either(self):
        fake = FakeSubmissions()
        slots = months(12)
        for when in slots[:6]:
            fake.problem(1250, ["dp"], CLEAN, when)
        for when in slots[6:]:
            fake.problem(1250, ["dp"], STRUGGLE, when)
        self.assertEqual(diagnose_fake(fake)["root_gaps"], [])


class DeduplicationTests(unittest.TestCase):
    def test_graph_and_dfs_on_the_same_problems_are_one_flag(self):
        fake = FakeSubmissions()
        for when in months(12):
            fake.problem(1250, ["graphs", "dfs and similar"], STRUGGLE, when)
        result = diagnose_fake(fake)
        self.assertEqual(len(result["effort"]["flags"]), 1)
        (suppressed,) = result["effort"]["suppressed"]
        self.assertIn("overlaps a stronger flagged concept", suppressed["reason"])

    def test_a_correlated_concept_survives_if_its_own_problems_carry_the_signal(self):
        fake = FakeSubmissions()
        for when in months(12):
            fake.problem(1250, ["graphs", "dfs and similar"], STRUGGLE, when)
        for when in months(12):
            fake.problem(1250, ["dfs and similar"], STRUGGLE, when)     # dfs-only, also struggling
        flagged = {f["concept_id"] for f in diagnose_fake(fake)["effort"]["flags"]}
        self.assertEqual(flagged, {"graph", "dfs"})


class AvailabilityTests(unittest.TestCase):
    def test_without_a_baseline_effort_is_reported_unavailable_and_nothing_is_flagged(self):
        result = diagnose_codeforces(_attempt(struggling_dp_student()), baseline=None)
        self.assertEqual(result["effort"]["status"], "unavailable")
        self.assertIn("no effort baseline", result["effort"]["reason"])
        self.assertEqual(result["root_gaps"], [])

    def test_a_baseline_built_with_another_tag_map_is_refused(self):
        stale = synthetic_baseline(tag_map_sha256="0" * 64)
        result = diagnose_codeforces(_attempt(struggling_dp_student()), baseline=stale)
        self.assertEqual(result["effort"]["status"], "unavailable")
        self.assertIn("tag map", result["effort"]["reason"])

    def test_a_baseline_built_with_other_parameters_is_refused(self):
        stale = synthetic_baseline(params={**ce._params(), "min_solved": 99})
        self.assertIn("parameters", ce.baseline_problem(stale))

    def test_an_attempt_without_trajectories_reports_unavailable(self):
        attempt = _attempt(struggling_dp_student())
        del attempt["trajectories"]
        result = diagnose_codeforces(attempt, baseline=synthetic_baseline())
        self.assertIn("trajectories", result["effort"]["reason"])


def _attempt(fake: FakeSubmissions) -> dict:
    with mock.patch.object(cf, "fetch_rating_history", return_value=HISTORY), \
         mock.patch.object(cf, "fetch_submissions", return_value=fake.subs), \
         mock.patch.object(cf, "REQUEST_GAP_SECONDS", 0):
        return cf.build_attempt("fixture")


class ExplanationTests(unittest.TestCase):
    def test_explanation_says_what_is_true_and_never_mentions_marks(self):
        text = diagnose_fake(struggling_dp_student())["explanation"]
        self.assertIn("solve these problems eventually", text)
        self.assertIn("effort signal, not proof you can't do it", text)
        self.assertIn("capped at MEDIUM", text)
        self.assertNotIn("mark", text.lower())
        self.assertNotIn("rough signal", text)   # that caveat is about failure-based gaps


class EngineIntegrationTests(unittest.TestCase):
    def test_effort_weakness_does_not_override_a_mastery_weakness(self):
        attempt = Attempt(
            student_id="s",
            answers=[Answer(question_id=f"q{i}", concept_ids=["dp"], correct=False, error_type="conceptual") for i in range(6)],
        )
        flag = {"tier": "MEDIUM", "n_solved": 9, "z": 5.0}
        weakness = concept_weakness(attempt, effort_weak={"dp": flag})
        self.assertEqual(weakness["dp"]["status"], "weak")
        self.assertNotIn("source", weakness["dp"])

    def test_the_default_leaves_the_original_engine_behaviour_unchanged(self):
        attempt = Attempt(
            student_id="s",
            answers=[Answer(question_id="q", concept_ids=["dp"], correct=True, marks=3)],
        )
        self.assertEqual(concept_weakness(attempt), concept_weakness(attempt, effort_weak=None))
        self.assertEqual(concept_weakness(attempt)["dp"]["status"], "ok")


def population(n_handles: int, struggle_every: int):
    """Trajectory lists for a synthetic population of dp students."""
    pops = []
    for h in range(n_handles):
        pops.append([
            {"problem_id": f"{h}-{i}", "concept_ids": ["dp"], "first_attempt_at": i, "problem_rating": 1200,
             "ability_at_attempt": 1250, "delta": -50, "attempts": 1, "wrong_tries": 1 if (i + h) % struggle_every == 0 else 0,
             "solved": True, "last_fail": None}
            for i in range(10)
        ])
    return pops


class BaselineBuilderTests(unittest.TestCase):
    def test_baseline_records_difficulty_bands_and_per_concept_distribution(self):
        baseline = ce.build_baseline(population(20, struggle_every=3))
        self.assertEqual(baseline["n_handles"], 20)
        self.assertEqual(baseline["band_means"]["-1"]["n"], 200)
        self.assertIn("dp", baseline["concepts"])
        self.assertEqual(baseline["concepts"]["dp"]["n_handles"], 20)
        self.assertIsNone(ce.baseline_problem(baseline))

    def test_a_concept_with_too_few_handles_gets_no_baseline(self):
        baseline = ce.build_baseline(population(ce.MIN_POP_HANDLES - 1, struggle_every=3))
        self.assertNotIn("dp", baseline["concepts"])


if __name__ == "__main__":
    unittest.main()
