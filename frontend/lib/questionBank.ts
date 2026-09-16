// The diagnostic's question source.
//
// `data/dsa_question_bank.json` is a copy of the repo-root `data/dsa_question_bank.json`
// (the bank Vasu maintains). It lives inside frontend/ because the Next root is
// frontend/ and importing across that boundary does not resolve cleanly. Refresh it
// with: cp data/dsa_question_bank.json frontend/data/dsa_question_bank.json
//
// Nothing here restates the bank's content. Prompts, options, which option is
// correct and every error_type are read from the JSON at load; the only thing this
// module names is which question ids the diagnostic asks.

import rawBank from "@/data/dsa_question_bank.json"
import type { OptionKey } from "./mockDiagnose"

export const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"]

/** The error taxonomy the bank tags wrong options with. */
export type BankErrorType = "conceptual" | "procedural" | "implementation" | "careless"

const ERROR_TYPES: BankErrorType[] = [
  "conceptual",
  "procedural",
  "implementation",
  "careless",
]

export interface BankOption {
  text: string
  correct: boolean
  /** Present on wrong options only — what kind of mistake picking it represents. */
  error_type: BankErrorType | null
}

export interface BankQuestion {
  question_id: string
  concept_id: string
  marks: number
  prompt: string
  options: Record<OptionKey, BankOption>
}

export interface QuestionBank {
  bank_version: string
  subject: string
  questions: BankQuestion[]
}

function fail(message: string): never {
  throw new Error(`dsa_question_bank.json: ${message}`)
}

function parseOption(raw: unknown, where: string): BankOption {
  if (typeof raw !== "object" || raw === null) fail(`${where} is not an object`)
  const option = raw as Record<string, unknown>

  if (typeof option.text !== "string") fail(`${where}.text is not a string`)
  if (typeof option.correct !== "boolean") fail(`${where}.correct is not a boolean`)

  const rawErrorType = option.error_type
  if (rawErrorType !== undefined && !ERROR_TYPES.includes(rawErrorType as BankErrorType)) {
    fail(`${where}.error_type is not a known error type: ${String(rawErrorType)}`)
  }

  return {
    text: option.text,
    correct: option.correct,
    // A correct option carries no error to report, whatever the bank stores.
    error_type: option.correct ? null : ((rawErrorType as BankErrorType | undefined) ?? null),
  }
}

function parseQuestion(raw: unknown, index: number): BankQuestion {
  if (typeof raw !== "object" || raw === null) fail(`questions[${index}] is not an object`)
  const question = raw as Record<string, unknown>

  const id = question.question_id
  if (typeof id !== "string") fail(`questions[${index}].question_id is not a string`)
  if (typeof question.concept_id !== "string") fail(`${id}.concept_id is not a string`)
  if (typeof question.marks !== "number") fail(`${id}.marks is not a number`)
  if (typeof question.prompt !== "string") fail(`${id}.prompt is not a string`)
  if (typeof question.options !== "object" || question.options === null) {
    fail(`${id}.options is not an object`)
  }

  const rawOptions = question.options as Record<string, unknown>
  const options = Object.fromEntries(
    OPTION_KEYS.map((key) => {
      if (!(key in rawOptions)) fail(`${id} is missing option ${key}`)
      return [key, parseOption(rawOptions[key], `${id}.options.${key}`)]
    }),
  ) as Record<OptionKey, BankOption>

  // A question with no single correct option cannot be graded, so it must not ship.
  const correctCount = OPTION_KEYS.filter((key) => options[key].correct).length
  if (correctCount !== 1) fail(`${id} has ${correctCount} correct options, expected exactly 1`)

  return {
    question_id: id,
    concept_id: question.concept_id,
    marks: question.marks,
    prompt: question.prompt,
    options,
  }
}

function parseBank(raw: unknown): QuestionBank {
  if (typeof raw !== "object" || raw === null) fail("top level is not an object")
  const bank = raw as Record<string, unknown>

  if (!Array.isArray(bank.questions)) fail("questions is not an array")

  return {
    bank_version: typeof bank.bank_version === "string" ? bank.bank_version : "unknown",
    subject: typeof bank.subject === "string" ? bank.subject : "unknown",
    questions: bank.questions.map(parseQuestion),
  }
}

/** Validated at module load: a malformed bank fails loudly rather than mis-grading. */
export const questionBank: QuestionBank = parseBank(rawBank)

const BY_ID = new Map(questionBank.questions.map((q) => [q.question_id, q]))

export function getQuestion(questionId: string): BankQuestion | undefined {
  return BY_ID.get(questionId)
}

/**
 * The diagnostic set: one pass over every demo concept, weighted toward recursion
 * and DP because the dependency between them is what the diagnosis has to resolve.
 * Ids only — every prompt, option and grade still comes from the bank.
 */
export const DIAGNOSTIC_QUESTION_IDS: string[] = [
  "r_q01",
  "r_q03",
  "dp_q03",
  "dp_q04",
  "graph_q02",
  "bfs_q03",
  "bs_q01",
  "ll_q03",
  "arr_q05",
]

/**
 * Every question in the bank stores its correct option as "A". Rendering options
 * in bank order would therefore hand the answer to anyone who notices, so the
 * quiz shows them in a shuffled order instead.
 *
 * The shuffle is seeded from the question id, not random: it must produce the
 * same order on the server and on the client or React would report a hydration
 * mismatch, and the same order across re-renders or options would jump while
 * the student reads them.
 *
 * This is display order only. Grading still reads the option the student picked
 * by its bank key, so the /diagnose payload is unaffected.
 */
export function displayOrder(questionId: string): OptionKey[] {
  let seed = 0
  for (let i = 0; i < questionId.length; i++) {
    seed = (seed * 31 + questionId.charCodeAt(i)) >>> 0
  }

  const keys = [...OPTION_KEYS]
  for (let i = keys.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
  }
  return keys
}

/** Throws at module load if the diagnostic names an id the bank does not have. */
export const diagnosticQuestions: BankQuestion[] = DIAGNOSTIC_QUESTION_IDS.map((id) => {
  const question = BY_ID.get(id)
  if (!question) fail(`diagnostic references unknown question_id "${id}"`)
  return question
})
