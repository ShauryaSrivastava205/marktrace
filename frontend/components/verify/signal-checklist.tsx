"use client"

import { motion, useReducedMotion } from "motion/react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { GradeResult } from "@/lib/mockVerify"
import { TASK_META, reportedSignals } from "@/lib/verify"

interface SignalChecklistProps {
  result: GradeResult
  baseDelay?: number
}

/** The evidence the verdict rests on — shown before the verdict's own words. */
export function SignalChecklist({ result, baseDelay = 0 }: SignalChecklistProps) {
  const reduceMotion = useReducedMotion()
  const signals = reportedSignals(result)

  if (signals.length === 0) return null

  const passed = signals.filter(([, signal]) => signal.passed).length

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-serif text-xl font-semibold text-foreground">The evidence</h2>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {passed} of {signals.length} probes passed
        </p>
      </div>

      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-md border border-border bg-card shadow-sm">
        {signals.map(([task, signal], i) => {
          const meta = TASK_META[task]
          const delay = reduceMotion ? 0 : baseDelay + i * 0.14

          return (
            <motion.li
              key={task}
              initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, delay, ease: "easeOut" }}
              className="flex items-start gap-3 p-4 sm:px-5"
            >
              <motion.span
                aria-hidden="true"
                initial={reduceMotion ? undefined : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 480, damping: 24, delay: delay + 0.12 }
                }
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                  signal.passed
                    ? "bg-accent text-accent-foreground"
                    : "bg-destructive text-white",
                )}
              >
                {signal.passed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              </motion.span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-base font-semibold text-foreground">
                    {meta.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                      signal.passed
                        ? "bg-accent/12 text-accent"
                        : "bg-destructive/12 text-destructive",
                    )}
                  >
                    {signal.passed ? "Passed" : "Not yet"}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {meta.evidence}
                  {"?"}
                </p>
              </div>
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}
