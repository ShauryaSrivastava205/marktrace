"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { ArrowLeft, ArrowRight, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import type { OptionKey } from "@/lib/mockDiagnose"
import type { BankQuestion } from "@/lib/questionBank"
import { buildAttempt, DEMO_STUDENT_ID, type Attempt, type Picks } from "@/lib/attempt"
import { postDiagnose, ApiError } from "@/lib/api"
import { storeSession } from "@/lib/session"
import { LoadingState, ErrorState } from "@/components/api-state"
import { QuizProgress } from "./quiz-progress"
import { QuestionCard } from "./question-card"

interface QuizFlowProps {
  questions: BankQuestion[]
  /** concept_id -> display name, resolved on the server. */
  conceptNames: Record<string, string>
}

export function QuizFlow({ questions, conceptNames }: QuizFlowProps) {
  const router = useRouter()
  const reduceMotion = useReducedMotion()

  const [picks, setPicks] = useState<Picks>({})
  const [index, setIndex] = useState(0)
  // Which way the next card should come from, so Back reads as going back.
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = questions.length
  const question = questions[index]

  const answeredIndexes = useMemo(
    () =>
      new Set(questions.flatMap((q, i) => (picks[q.question_id] ? [i] : []))),
    [questions, picks],
  )

  const firstUnanswered = useMemo(
    () => questions.findIndex((q) => !picks[q.question_id]),
    [questions, picks],
  )

  const complete = firstUnanswered === -1
  const isLast = index === total - 1

  const goTo = useCallback(
    (next: number) => {
      setDirection(next >= index ? 1 : -1)
      setIndex(Math.min(Math.max(next, 0), total - 1))
    },
    [index, total],
  )

  const handlePick = useCallback(
    (option: OptionKey) => {
      setPicks((prev) => ({ ...prev, [question.question_id]: option }))
    },
    [question.question_id],
  )

  const runDiagnosis = useCallback(
    async (attempt: Attempt) => {
      setSubmitting(true)
      setError(null)
      try {
        const diagnose = await postDiagnose(attempt)
        storeSession({ attempt, diagnose, picks })
        router.push("/results")
      } catch (cause) {
        // Staying on the quiz keeps every answer intact for the retry.
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Something went wrong while sending your answers.",
        )
        setSubmitting(false)
      }
    },
    [picks, router],
  )

  const handleSubmit = useCallback(() => {
    if (!complete || submitting) return
    // Graded against the bank here, never during the quiz.
    void runDiagnosis(
      buildAttempt(
        questions.map((q) => q.question_id),
        picks,
        DEMO_STUDENT_ID,
      ),
    )
  }, [complete, submitting, questions, picks, runDiagnosis])

  // Enter-only, and deliberately so. An exit animation here has to finish
  // before the next card can mount, and if it ever fails to report completion
  // the quiz stops advancing while the progress header keeps counting up -
  // the card is the question, so it must never depend on an animation ending.
  const slide = {
    initial: reduceMotion ? false : { opacity: 0, x: direction * 24 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.28, ease: "easeOut" as const },
  }

  if (submitting) {
    return (
      <LoadingState
        title="Analyzing your answers…"
        detail="Tracing each mistake back through the concept graph to find what actually caused it."
      />
    )
  }

  return (
    <div>
      {error && (
        <ErrorState
          className="mb-6"
          title="We could not analyze your answers"
          message={`${error} Your answers are safe — nothing was lost.`}
          onRetry={handleSubmit}
          retryLabel="Retry diagnosis"
        />
      )}

      <QuizProgress
        current={index}
        total={total}
        answered={answeredIndexes}
        onJump={goTo}
      />

      <div className="mt-5">
        {/* Keyed on the question, so changing question remounts the card and
            animates the new one in. Exactly one card is mounted at any time. */}
        <motion.div key={question.question_id} {...slide}>
          <QuestionCard
            question={question}
            index={index}
            conceptName={conceptNames[question.concept_id] ?? question.concept_id}
            picked={picks[question.question_id]}
            onPick={handlePick}
          />
        </motion.div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-5">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border border-border bg-background px-3.5 py-2 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            index === 0
              ? "cursor-not-allowed text-muted-foreground/50"
              : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </button>

        {isLast ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {!complete && firstUnanswered !== -1 && (
              <button
                type="button"
                onClick={() => goTo(firstUnanswered)}
                className="text-[13px] font-medium text-primary underline-offset-4 transition-colors hover:underline"
              >
                Question {firstUnanswered + 1} is unanswered
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!complete || submitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                complete && !submitting
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "cursor-not-allowed border-border bg-muted text-muted-foreground",
              )}
            >
              {submitting ? "Diagnosing…" : "Submit for diagnosis"}
              <Send className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              picks[question.question_id]
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            Next
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
