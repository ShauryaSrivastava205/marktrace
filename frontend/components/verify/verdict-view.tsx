"use client"

import { motion, useReducedMotion } from "motion/react"
import { CheckCircle2, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import type { RootGapConfidence } from "@/lib/mockDiagnose"
import type { GradeResult } from "@/lib/mockVerify"
import { ConfidenceBadge } from "./confidence-badge"
import { SignalChecklist } from "./signal-checklist"
import { RediagnoseCallout } from "./rediagnose-callout"

interface VerdictViewProps {
  result: GradeResult
  /** The tier the diagnosis carried in, read off the diagnosis payload. */
  previousConfidence: RootGapConfidence
  rootName: string
  /** Display name for `rediagnose.focus_concept_id`, when there is one. */
  focusName: string | null
}

export function VerdictView({
  result,
  previousConfidence,
  rootName,
  focusName,
}: VerdictViewProps) {
  const reduceMotion = useReducedMotion()
  const confirmed = result.verdict === "confirmed"

  const step = (delay: number) => ({
    initial: reduceMotion ? undefined : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.42, delay: reduceMotion ? 0 : delay, ease: "easeOut" as const },
  })

  return (
    <div className="space-y-10 lg:space-y-12">
      <section>
        <motion.div {...step(0)} className="flex items-center gap-2">
          {confirmed ? (
            <CheckCircle2 className="size-3.5 text-accent" aria-hidden="true" />
          ) : (
            <Search className="size-3.5 text-primary" aria-hidden="true" />
          )}
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.16em]",
              confirmed ? "text-accent" : "text-primary",
            )}
          >
            Verification complete
          </p>
        </motion.div>

        <motion.h1
          {...step(0.08)}
          className="mt-2 max-w-3xl font-serif text-[1.75rem] font-semibold leading-[1.15] text-foreground sm:text-4xl"
        >
          {confirmed
            ? `${rootName} is confirmed as your root gap`
            : `${rootName} is solid — but it isn't the cause`}
        </motion.h1>

        <motion.div
          {...step(0.14)}
          className="mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-5 border-t border-border pt-5"
        >
          <ConfidenceBadge
            previous={previousConfidence}
            current={result.confidence}
            delay={0.22}
          />

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Verdict
            </p>
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
                confirmed
                  ? "border-accent/45 bg-accent/[0.08] text-accent"
                  : "border-destructive/35 bg-destructive/[0.05] text-destructive",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  confirmed ? "bg-accent" : "bg-destructive",
                )}
              />
              {confirmed ? "Confirmed" : "Cause elsewhere"}
            </span>
          </div>
        </motion.div>
      </section>

      <SignalChecklist result={result} baseDelay={0.34} />

      <motion.section {...step(0.62)}>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          What this means
        </h2>
        <p className="mt-3 max-w-3xl font-serif text-lg leading-relaxed text-foreground">
          {result.message}
        </p>
      </motion.section>

      {result.rediagnose && focusName && (
        <RediagnoseCallout
          rediagnose={result.rediagnose}
          focusName={focusName}
          delay={0.72}
        />
      )}
    </div>
  )
}
