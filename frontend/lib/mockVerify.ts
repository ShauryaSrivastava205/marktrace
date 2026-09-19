// Types for POST /verify/probe and POST /verify/grade, plus dev fallback data.
//
// The types are the real contract, checked against the deployed API
// (backend/app/engine/verify.py). `verifyProbe` and `gradeOutcomes` below are
// only used when the API cannot be reached - see lib/api.ts.

import type { OptionKey, RootGapConfidence } from "./mockDiagnose"

/**
 * What a probe question is testing:
 *  - direct   — the root concept itself
 *  - causal   — the concept the root gap was blamed for
 *  - transfer — the root concept applied to an unfamiliar context
 */
export type TaskType = "direct" | "causal" | "transfer"

export interface ProbeQuestion {
  question_id: string
  task_type: TaskType
  concept_id: string
  prompt: string
  options: Record<OptionKey, string>
}

export interface VerifyProbe {
  root_concept_id: string
  downstream_concept_id: string
  questions: ProbeQuestion[]
}

export interface Signal {
  passed: boolean
}

/**
 * Four outcomes, not two:
 *  - confirmed      - direct and causal both passed
 *  - not_confirmed  - the root is solid but the causal link was not shown
 *  - root_not_solid - the direct probe was missed, so nothing can be concluded
 */
export type Verdict = "confirmed" | "not_confirmed" | "root_not_solid"

export interface Rediagnose {
  focus_concept_id: string
}

export interface GradeResult {
  root_concept_id: string
  downstream_concept_id: string
  /** Partial by design: the grader only reports signals it actually probed. */
  signals: Partial<Record<TaskType, Signal>>
  verdict: Verdict
  /** A tier, never a percentage. */
  confidence: RootGapConfidence
  /** null when the probe could not settle the question either way. */
  diagnosis_confirmed: boolean | null
  message: string
  /** Only present when the diagnosis was not confirmed. */
  rediagnose?: Rediagnose
}

export const verifyProbe: VerifyProbe = {
  root_concept_id: "recursion",
  downstream_concept_id: "dp",
  questions: [
    {
      question_id: "r_dir_p1",
      task_type: "direct",
      concept_id: "recursion",
      prompt:
        "A recursive function computes power(x, n) = x^n. Which is the correct recursive step?",
      options: {
        A: "return x * power(x, n-1)",
        B: "return power(x, n-1)",
        C: "return x * power(x, n)",
        D: "return x + power(x, n-1)",
      },
    },
    {
      question_id: "d_cau_p1",
      task_type: "causal",
      concept_id: "dp",
      prompt: "To solve a DP problem top-down (memoization), what must you define FIRST?",
      options: {
        A: "The recursive subproblem / recurrence relation",
        B: "The final answer's value",
        C: "The programming language",
        D: "The array size only",
      },
    },
    {
      question_id: "r_trn_p1",
      task_type: "transfer",
      concept_id: "recursion",
      prompt:
        "You must explore every folder and sub-folder to find a file. Which approach naturally fits?",
      options: {
        A: "Look in a folder, and for each sub-folder repeat the same process",
        B: "Sort all folders alphabetically first",
        C: "Check only the top folder",
        D: "Use a single loop over a fixed list",
      },
    },
  ],
}

export type GradeOutcomeKey =
  | "confirmed_high"
  | "confirmed_medium"
  | "not_confirmed"
  | "root_not_solid"

export const gradeOutcomes: Record<GradeOutcomeKey, GradeResult> = {
  confirmed_high: {
    root_concept_id: "recursion",
    downstream_concept_id: "dp",
    signals: {
      direct: { passed: true },
      causal: { passed: true },
      transfer: { passed: true },
    },
    verdict: "confirmed",
    confidence: "HIGH",
    diagnosis_confirmed: true,
    message:
      "Recursion confirmed as your root gap — it's solid now, and fixing it resolved the Dynamic Programming questions that depended on it.",
  },
  confirmed_medium: {
    root_concept_id: "recursion",
    downstream_concept_id: "dp",
    signals: {
      direct: { passed: true },
      causal: { passed: true },
      transfer: { passed: false },
    },
    verdict: "confirmed",
    confidence: "MEDIUM",
    diagnosis_confirmed: true,
    message:
      "Recursion is confirmed as the root cause, though applying it to an unfamiliar context is still shaky — keep practicing.",
  },
  not_confirmed: {
    root_concept_id: "recursion",
    downstream_concept_id: "dp",
    signals: {
      direct: { passed: true },
      causal: { passed: false },
      transfer: { passed: true },
    },
    verdict: "not_confirmed",
    confidence: "LOW",
    diagnosis_confirmed: false,
    message:
      "Your recursion is now solid — a real gain that underpins 8 other topics. But your DP gap isn't explained by recursion after all, so its true cause is elsewhere.",
    rediagnose: { focus_concept_id: "dp" },
  },
  root_not_solid: {
    root_concept_id: "recursion",
    downstream_concept_id: "dp",
    signals: {
      direct: { passed: false },
      causal: { passed: true },
      transfer: { passed: true },
    },
    verdict: "root_not_solid",
    confidence: "LOW",
    diagnosis_confirmed: null,
    message:
      "recursion itself is not solid yet. The direct probe was missed, so the diagnosis cannot be verified until that concept is addressed.",
  },
}

export const GRADE_OUTCOME_KEYS: GradeOutcomeKey[] = [
  "confirmed_high",
  "confirmed_medium",
  "not_confirmed",
  "root_not_solid",
]
