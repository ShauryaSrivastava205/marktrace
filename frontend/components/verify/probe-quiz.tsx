"use client"

import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { OptionKey } from "@/lib/mockDiagnose"
import type { ProbeQuestion, VerifyProbe } from "@/lib/mockVerify"
import { TASK_META } from "@/lib/verify"

interface ProbeQuizProps {
  probe: VerifyProbe
  /** question_id -> picked option. */
  answers: Record<string, OptionKey>
  onAnswer: (questionId: string, option: OptionKey) => void
  onSubmit: () => void
  conceptName: string
}

export function ProbeQuiz({ probe, answers, onAnswer, onSubmit, conceptName }: ProbeQuizProps) {
  const reduceMotion = useReducedMotion()
  const answered = probe.questions.filter((q) => answers[q.question_id]).length
  const complete = answered === probe.questions.length

  const step = (delay: number) => ({
    initial: reduceMotion ? undefined : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.42, delay: reduceMotion ? 0 : delay, ease: "easeOut" as const },
  })

  return (
    <section>
      <motion.div {...step(0)} className="flex items-center gap-2">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Verification probe
        </p>
      </motion.div>

      <motion.h1
        {...step(0.08)}
        className="mt-2 max-w-3xl font-serif text-[1.75rem] font-semibold leading-[1.15] text-foreground sm:text-4xl"
      >
        Three questions to test whether {conceptName} is really the root gap
      </motion.h1>

      <motion.p
        {...step(0.12)}
        className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground"
      >
        Each one probes the diagnosis from a different angle. Answer all three — the verdict is
        built from what the three together show, not from a score.
      </motion.p>

      <motion.ol {...step(0.16)} className="mt-8 space-y-4">
        {probe.questions.map((question, i) => (
          <ProbeCard
            key={question.question_id}
            question={question}
            index={i}
            picked={answers[question.question_id]}
            onPick={(option) => onAnswer(question.question_id, option)}
          />
        ))}
      </motion.ol>

      <motion.div
        {...step(0.24)}
        className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-5"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {answered} of {probe.questions.length} answered
        </p>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!complete}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            complete
              ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
              : "cursor-not-allowed border-border bg-muted text-muted-foreground",
          )}
        >
          Submit probe
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </motion.div>
    </section>
  )
}

function ProbeCard({
  question,
  index,
  picked,
  onPick,
}: {
  question: ProbeQuestion
  index: number
  picked: OptionKey | undefined
  onPick: (option: OptionKey) => void
}) {
  const reduceMotion = useReducedMotion()
  const meta = TASK_META[question.task_type]
  const groupName = `probe-${question.question_id}`

  return (
    <motion.li
      initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: reduceMotion ? 0 : 0.2 + index * 0.1, ease: "easeOut" }}
      className="overflow-hidden rounded-md border border-border bg-card shadow-sm"
    >
      <fieldset className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
            {meta.label}
          </span>
          <span className="text-[12px] text-muted-foreground">{meta.purpose}</span>
        </div>

        <legend className="sr-only">
          {meta.label}: {meta.purpose}
        </legend>

        <p className="mt-3 font-sans text-[15px] font-medium leading-relaxed text-foreground">
          {question.prompt}
        </p>

        <div className="mt-4 grid gap-2">
          {(Object.entries(question.options) as [OptionKey, string][]).map(([key, text]) => {
            const selected = picked === key
            return (
              <label
                key={key}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2 text-[13px] transition-colors",
                  "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  selected
                    ? "border-primary/55 bg-primary/[0.06] text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/35 hover:bg-muted/50",
                )}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={key}
                  checked={selected}
                  onChange={() => onPick(key)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {key}
                </span>
                <span className={cn("flex-1", selected && "font-medium")}>{text}</span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </motion.li>
  )
}
