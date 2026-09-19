// What one finished diagnostic leaves behind for the pages that follow it.
//
// The quiz POSTs /diagnose and stores the result here; the results and verify
// screens read it. sessionStorage is deliberate: a diagnosis belongs to the
// sitting that produced it, not to the browser forever.

import type { DiagnoseResult, OptionKey, ReviewItem } from "./mockDiagnose"
import type { Attempt, Picks } from "./attempt"
import { OPTION_KEYS, displayOrder, getQuestion } from "./questionBank"

export const SESSION_STORAGE_KEY = "marktrace.session"

export interface DiagnosticSession {
  /** Exactly what was POSTed, kept so a retry does not need the quiz again. */
  attempt: Attempt
  /** Exactly what POST /diagnose returned. */
  diagnose: DiagnoseResult
  /** What the student picked, so their answers can be reviewed afterwards. */
  picks: Picks
}

export function storeSession(session: DiagnosticSession): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Private mode or blocked storage. The next screen falls back to sample data.
  }
}

export function readSession(): DiagnosticSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DiagnosticSession
    // Anything without a diagnosis is not worth rendering as one.
    return parsed?.diagnose?.concept_mastery ? parsed : null
  } catch {
    return null
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Nothing to do; a stale session is not worth failing over.
  }
}

/**
 * The per-question review, rebuilt from the bank and the student's picks.
 *
 * /diagnose returns a diagnosis, not an answer sheet, so this is the only
 * honest source for "what did I actually answer". Options are relabelled into
 * the order the quiz showed them, so the letters here are the letters the
 * student saw.
 */
export function buildReviewItems(picks: Picks): ReviewItem[] {
  return Object.entries(picks).flatMap<ReviewItem>(([questionId, picked]) => {
    const question = getQuestion(questionId)
    if (!question) return []

    const order = displayOrder(questionId)
    const shownAs = (bankKey: OptionKey): OptionKey => OPTION_KEYS[order.indexOf(bankKey)]

    const options = Object.fromEntries(
      order.map((bankKey, i) => [OPTION_KEYS[i], question.options[bankKey].text]),
    ) as Record<OptionKey, string>

    const correctBankKey = OPTION_KEYS.find((key) => question.options[key].correct)
    if (!correctBankKey) return []

    return [
      {
        concept_id: question.concept_id,
        prompt: question.prompt,
        options,
        correct: shownAs(correctBankKey),
        student_pick: shownAs(picked),
        // The bank tags wrong options only; a correct pick has no error to name.
        error_type: question.options[picked].correct
          ? null
          : question.options[picked].error_type,
        // The bank carries no written explanations, and the review degrades
        // gracefully without one rather than being given invented prose.
      },
    ]
  })
}
