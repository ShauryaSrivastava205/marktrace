"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import type { OptionKey, RootGapConfidence } from "@/lib/mockDiagnose"
import {
  GRADE_OUTCOME_KEYS,
  gradeOutcomes,
  type GradeOutcomeKey,
  type VerifyProbe,
} from "@/lib/mockVerify"
import { ProbeQuiz } from "./probe-quiz"
import { VerdictView } from "./verdict-view"

interface VerifyFlowProps {
  probe: VerifyProbe
  /** Display names for every concept id the probe or a verdict can reference. */
  conceptNames: Record<string, string>
  previousConfidence: RootGapConfidence
}

const OUTCOME_LABEL: Record<GradeOutcomeKey, string> = {
  confirmed_high: "Confirmed · HIGH",
  confirmed_medium: "Confirmed · MEDIUM",
  not_confirmed: "Not confirmed · LOW",
}

/**
 * The two states of /verify on one route: the probe, then the verdict built
 * from its grade. Grading is server-side work that doesn't exist yet — the
 * probe payload ships no answer key — so the verdict here is mock.
 */
export function VerifyFlow({ probe, conceptNames, previousConfidence }: VerifyFlowProps) {
  const reduceMotion = useReducedMotion()
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({})
  const [submitted, setSubmitted] = useState(false)
  const [outcomeKey, setOutcomeKey] = useState<GradeOutcomeKey>("confirmed_high")

  const result = gradeOutcomes[outcomeKey]
  const rootName = conceptNames[probe.root_concept_id] ?? probe.root_concept_id
  const focusId = result.rediagnose?.focus_concept_id
  const focusName = focusId ? conceptNames[focusId] ?? focusId : null

  const handleAnswer = useCallback((questionId: string, option: OptionKey) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }, [])

  const fade = {
    initial: reduceMotion ? undefined : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? undefined : { opacity: 0, y: -12 },
    transition: { duration: 0.34, ease: "easeOut" as const },
  }

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {submitted ? (
          <motion.div key="verdict" {...fade}>
            {/* Keyed on the outcome so the dev toggle replays the reveal. */}
            <VerdictView
              key={outcomeKey}
              result={result}
              previousConfidence={previousConfidence}
              rootName={rootName}
              focusName={focusName}
            />
          </motion.div>
        ) : (
          <motion.div key="probe" {...fade}>
            <ProbeQuiz
              probe={probe}
              answers={answers}
              onAnswer={handleAnswer}
              onSubmit={() => setSubmitted(true)}
              conceptName={rootName}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {process.env.NODE_ENV !== "production" && (
        <div className="mt-12 rounded-md border border-dashed border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Dev only · preview outcome
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {GRADE_OUTCOME_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setOutcomeKey(key)
                  setSubmitted(true)
                }}
                aria-pressed={submitted && outcomeKey === key}
                className={cn(
                  "rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
                  submitted && outcomeKey === key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {OUTCOME_LABEL[key]}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Back to probe
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
