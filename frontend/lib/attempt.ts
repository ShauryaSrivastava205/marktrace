// The POST /diagnose request body, built from what the student picked.

import type { OptionKey } from "./mockDiagnose"
import { getQuestion, type BankErrorType } from "./questionBank"

export interface AttemptAnswer {
  question_id: string
  /** An array because the API accepts multi-concept questions; the bank tags one. */
  concept_ids: string[]
  correct: boolean
  /** The picked option's error_type when the pick is wrong, null when it is right. */
  error_type: BankErrorType | null
  marks: number
}

export interface Attempt {
  student_id: string
  answers: AttemptAnswer[]
}

/** question_id -> the option the student picked. */
export type Picks = Record<string, OptionKey>

export const DEMO_STUDENT_ID = "demo_student"

/** Where the quiz hands the attempt to the results route. */
export const ATTEMPT_STORAGE_KEY = "marktrace.attempt"

/**
 * Grades each pick against the bank. Correctness and error_type are read off the
 * picked option itself — no answer key is duplicated here, so the payload cannot
 * drift from the questions the student actually saw.
 *
 * Questions with no pick are left out rather than sent as wrong: an unanswered
 * question is missing evidence, not a mistake.
 */
export function buildAttempt(
  questionIds: string[],
  picks: Picks,
  studentId: string = DEMO_STUDENT_ID,
): Attempt {
  const answers = questionIds.flatMap<AttemptAnswer>((questionId) => {
    const picked = picks[questionId]
    if (!picked) return []

    const question = getQuestion(questionId)
    if (!question) return []

    const option = question.options[picked]
    const correct = option.correct

    return [
      {
        question_id: question.question_id,
        concept_ids: [question.concept_id],
        correct,
        error_type: correct ? null : option.error_type,
        marks: question.marks,
      },
    ]
  })

  return { student_id: studentId, answers }
}

/** Hands the attempt to the results route. Storage can be unavailable; that is not fatal. */
export function storeAttempt(attempt: Attempt): void {
  try {
    sessionStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(attempt))
  } catch {
    // Private mode or blocked storage — the results route falls back to the mock.
  }
}

export function readStoredAttempt(): Attempt | null {
  try {
    const raw = sessionStorage.getItem(ATTEMPT_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Attempt) : null
  } catch {
    return null
  }
}

/**
 * TODO(diagnose-api): wire this to the live backend.
 *
 *   const res = await fetch("https://marktrace.onrender.com/diagnose", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(attempt),
 *   })
 *   const diagnose: DiagnoseResult = await res.json()
 *
 * `attempt` is already the exact request body the endpoint expects, so this is the
 * only place that changes. The results route reads the mock until then.
 * Until it is wired, submitting only stores the attempt and navigates.
 */
export function submitAttempt(attempt: Attempt): void {
  // Visible proof of the payload shape while the endpoint is still mock-backed.
  console.log("[marktrace] POST /diagnose payload", attempt)
  storeAttempt(attempt)
}
