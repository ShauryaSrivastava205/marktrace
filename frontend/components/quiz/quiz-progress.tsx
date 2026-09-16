"use client"

import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

interface QuizProgressProps {
  current: number
  total: number
  /** Indexes of questions that already have a pick. */
  answered: Set<number>
  onJump: (index: number) => void
}

export function QuizProgress({ current, total, answered, onJump }: QuizProgressProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Question {current + 1} of {total}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {answered.size} of {total} answered
        </p>
      </div>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered.size}
        aria-label="Questions answered"
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${(answered.size / total) * 100}%` }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <ol className="mt-3 flex flex-wrap gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === current
          const isAnswered = answered.has(i)
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ", not answered"}`}
                className={cn(
                  "flex size-7 items-center justify-center rounded-sm border font-mono text-[11px] font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  !isCurrent &&
                    isAnswered &&
                    "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15",
                  !isCurrent &&
                    !isAnswered &&
                    "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground",
                )}
              >
                {i + 1}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
