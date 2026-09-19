"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { resolveConceptName } from "@/lib/conceptNames"
import type { DiagnoseResult, OptionKey } from "@/lib/mockDiagnose"
import type { GradeResult, VerifyProbe } from "@/lib/mockVerify"
import { verifyProbe as sampleProbe } from "@/lib/mockVerify"
import { ApiError, getVerifyProbe, postVerifyGrade } from "@/lib/api"
import type { VerifyTarget } from "@/lib/verify"
import { LoadingState, ErrorState, FallbackNotice } from "@/components/api-state"
import { ProbeQuiz } from "./probe-quiz"
import { VerdictView } from "./verdict-view"
import { VerificationComingSoon } from "./coming-soon"

interface VerifyFlowProps {
  diagnose: DiagnoseResult
  target: VerifyTarget
  studentId: string
}

type Phase =
  | { kind: "loading-probe" }
  | { kind: "probe-failed"; message: string }
  | { kind: "unavailable" }
  | { kind: "probe"; probe: VerifyProbe; fromSample: boolean }
  | { kind: "grading"; probe: VerifyProbe; fromSample: boolean }
  | { kind: "verdict"; result: GradeResult }

/**
 * The live verification flow: fetch the three probes for this root/downstream
 * pair, collect one answer each, then let the server grade them.
 *
 * Nothing is graded here. The probe payload ships no answer key by design, so
 * a verdict can only come from POST /verify/grade.
 */
export function VerifyFlow({ diagnose, target, studentId }: VerifyFlowProps) {
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>({ kind: "loading-probe" })
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({})
  const [gradeError, setGradeError] = useState<string | null>(null)

  const name = useCallback(
    (conceptId: string) => resolveConceptName(conceptId, diagnose),
    [diagnose],
  )

  const loadProbe = useCallback(async () => {
    setPhase({ kind: "loading-probe" })
    setAnswers({})
    setGradeError(null)
    try {
      const probe = await getVerifyProbe({
        root_concept_id: target.rootConceptId,
        downstream_concept_id: target.downstreamConceptId,
      })
      setPhase({ kind: "probe", probe, fromSample: false })
    } catch (cause) {
      const apiError = cause instanceof ApiError ? cause : null

      // Only an unreachable server justifies bundled questions. A 404 is the
      // server telling us this pair has no probe, and that answer stands.
      if (apiError && !apiError.reachable) {
        setPhase({ kind: "probe", probe: sampleProbe, fromSample: true })
        return
      }

      // 404 means the bank has no probe for this pair. That is content still to
      // be written, not a failure, so it gets its own friendly state.
      if (apiError?.status === 404) {
        setPhase({ kind: "unavailable" })
        return
      }

      setPhase({
        kind: "probe-failed",
        message: apiError?.message ?? "The verification probe could not be loaded.",
      })
    }
  }, [target, name])

  useEffect(() => {
    void loadProbe()
  }, [loadProbe])

  const handleSubmit = useCallback(async () => {
    if (phase.kind !== "probe") return
    const { probe, fromSample } = phase

    // The grader requires exactly one answer per task type; sending a hole
    // would be a 422. The submit button is already gated on this.
    const selections = probe.questions.map((question) => answers[question.question_id])
    if (selections.some((selected) => !selected)) return

    setGradeError(null)
    setPhase({ kind: "grading", probe, fromSample })

    try {
      const result = await postVerifyGrade({
        student_id: studentId,
        root_concept_id: probe.root_concept_id,
        downstream_concept_id: probe.downstream_concept_id,
        answers: probe.questions.map((question, i) => ({
          question_id: question.question_id,
          task_type: question.task_type,
          selected: selections[i],
        })),
      })
      setPhase({ kind: "verdict", result })
    } catch (cause) {
      // Back to the probe with every answer intact, so retrying costs nothing.
      setGradeError(
        cause instanceof ApiError
          ? cause.message
          : "Something went wrong while grading your answers.",
      )
      setPhase({ kind: "probe", probe, fromSample })
    }
  }, [phase, answers, studentId])

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
    <AnimatePresence mode="wait" initial={false}>
      {phase.kind === "loading-probe" && (
        <motion.div key="loading" {...fade}>
          <LoadingState
            title="Preparing your verification…"
            detail={`Fetching three probes that test whether ${name(
              target.rootConceptId,
            )} really explains ${name(target.downstreamConceptId)}.`}
          />
        </motion.div>
      )}

      {phase.kind === "unavailable" && (
        <motion.div key="unavailable" {...fade}>
          <VerificationComingSoon conceptName={name(target.rootConceptId)} />
        </motion.div>
      )}

      {phase.kind === "probe-failed" && (
        <motion.div key="probe-failed" {...fade}>
          <ErrorState
            title="Verification is not available"
            message={phase.message}
            onRetry={() => void loadProbe()}
          />
        </motion.div>
      )}

      {phase.kind === "grading" && (
        <motion.div key="grading" {...fade}>
          <LoadingState
            title="Checking your answers…"
            detail="Weighing the direct, causal and transfer signals against the original diagnosis."
          />
        </motion.div>
      )}

      {phase.kind === "probe" && (
        <motion.div key="probe" {...fade}>
          {phase.fromSample && (
            <FallbackNotice message="Could not reach the server — showing sample probes. The verdict will need a live connection." />
          )}

          {gradeError && (
            <ErrorState
              className="mb-6"
              title="We could not grade your answers"
              message={`${gradeError} Your answers are still here.`}
              onRetry={() => void handleSubmit()}
              retryLabel="Retry grading"
            />
          )}

          <ProbeQuiz
            probe={phase.probe}
            answers={answers}
            onAnswer={handleAnswer}
            onSubmit={() => void handleSubmit()}
            conceptName={name(phase.probe.root_concept_id)}
          />
        </motion.div>
      )}

      {phase.kind === "verdict" && (
        <motion.div key="verdict" {...fade}>
          <VerdictView
            result={phase.result}
            previousConfidence={target.previousConfidence}
            rootName={name(phase.result.root_concept_id)}
            focusName={
              phase.result.rediagnose
                ? name(phase.result.rediagnose.focus_concept_id)
                : null
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
