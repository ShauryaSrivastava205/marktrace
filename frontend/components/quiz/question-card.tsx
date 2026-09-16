"use client"

import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { PromptText } from "@/components/prompt-text"
import type { OptionKey } from "@/lib/mockDiagnose"
import { OPTION_KEYS, displayOrder, type BankQuestion } from "@/lib/questionBank"

interface QuestionCardProps {
  question: BankQuestion
  index: number
  conceptName: string
  picked: OptionKey | undefined
  onPick: (option: OptionKey) => void
}

/**
 * One question, four options, nothing about which is right. `option.correct` is
 * never read here — grading happens only after submit, in buildAttempt.
 */
export function QuestionCard({
  question,
  index,
  conceptName,
  picked,
  onPick,
}: QuestionCardProps) {
  const reduceMotion = useReducedMotion()
  const groupName = `q-${question.question_id}`

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <fieldset className="p-5 sm:p-6">
        <legend className="sr-only">
          Question {index + 1}: {question.prompt}
        </legend>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
            Q{String(index + 1).padStart(2, "0")}
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
            {conceptName}
          </span>
          <span className="text-[12px] text-muted-foreground">
            {question.marks} mark{question.marks === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-3">
          <PromptText prompt={question.prompt} className="text-base sm:text-[17px]" />
        </div>

        <div className="mt-5 grid gap-2">
          {displayOrder(question.question_id).map((key, i) => {
            const option = question.options[key]
            const selected = picked === key
            // The letter is the position on screen; `key` stays the bank's key,
            // which is what the pick is recorded and later graded as.
            const label = OPTION_KEYS[i]

            return (
              <motion.label
                key={key}
                initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.26,
                  delay: reduceMotion ? 0 : 0.06 + i * 0.05,
                  ease: "easeOut",
                }}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 text-[14px] transition-colors",
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
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                <span className={cn("flex-1", selected && "font-medium text-foreground")}>
                  {option.text}
                </span>
              </motion.label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
