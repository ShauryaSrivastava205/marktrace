"use client"

import { motion, useReducedMotion } from "motion/react"
import { Activity, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { masteryPercent, summarize } from "@/lib/diagnosis"
import type { DiagnoseResult } from "@/lib/mockDiagnose"
import { CountUp } from "./count-up"

interface DiagnosticHeroProps {
  diagnose: DiagnoseResult
}

const RANK_LABEL = ["Primary root gap", "Secondary root gap", "Additional root gap"]

function rankLabel(index: number): string {
  return RANK_LABEL[Math.min(index, RANK_LABEL.length - 1)]
}

export function DiagnosticHero({ diagnose }: DiagnosticHeroProps) {
  const reduceMotion = useReducedMotion()
  const summary = summarize(diagnose)
  const { root_gaps } = diagnose

  const step = (delay: number) => ({
    initial: reduceMotion ? undefined : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.42, delay: reduceMotion ? 0 : delay, ease: "easeOut" as const },
  })

  return (
    <section className="relative">
      <motion.div {...step(0)} className="flex items-center gap-2">
        <Activity className="size-3.5 text-primary" aria-hidden="true" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Diagnostic complete
        </p>
      </motion.div>

      <motion.h1
        {...step(0.08)}
        className="mt-2 max-w-3xl font-serif text-[1.75rem] font-semibold leading-[1.15] text-foreground sm:text-4xl"
      >
        {summary.rootGapCount} root gap{summary.rootGapCount === 1 ? "" : "s"} explain
        {summary.rootGapCount === 1 ? "s" : ""} most of your lost mastery
      </motion.h1>

      {!diagnose.evidence_sufficient && (
        <motion.p
          {...step(0.12)}
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/[0.06] px-3 py-1.5 text-[13px] text-amber-700"
        >
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          Limited evidence — treat this diagnosis as provisional.
        </motion.p>
      )}

      <div className="mt-6 grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <motion.ol {...step(0.16)} className="space-y-3">
          {root_gaps.map((gap, i) => {
            const pct = masteryPercent(
              diagnose.concept_mastery.find((c) => c.concept_id === gap.concept_id)?.mastery ?? null,
            )
            return (
              <motion.li
                key={gap.concept_id}
                initial={reduceMotion ? undefined : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.38,
                  delay: reduceMotion ? 0 : 0.24 + i * 0.12,
                  ease: "easeOut",
                }}
                className="flex items-baseline gap-3"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    i === 0 ? "bg-destructive" : "bg-destructive/55",
                  )}
                />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    {rankLabel(i)}
                  </p>
                  <p className="flex flex-wrap items-baseline gap-x-2.5">
                    <span className="font-serif text-xl font-semibold text-foreground">
                      {gap.name}
                    </span>
                    {pct !== null && (
                      <span className="font-sans text-[13px] text-muted-foreground">
                        {pct}% mastery
                      </span>
                    )}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </motion.ol>

        <motion.dl
          {...step(0.3)}
          className="grid grid-cols-3 gap-6 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
        >
          <Metric value={summary.marksAssociated} label="Marks associated" delay={0.42} />
          <Metric value={summary.affectedQuestions} label="Affected questions" delay={0.5} />
          <Metric value={summary.downstreamConcepts} label="Downstream concepts" delay={0.58} />
        </motion.dl>
      </div>
    </section>
  )
}

function Metric({ value, label, delay }: { value: number; label: string; delay: number }) {
  return (
    <div>
      <dd className="font-serif text-3xl font-semibold tabular-nums text-foreground">
        <CountUp value={value} delay={delay} />
      </dd>
      <dt className="mt-1 text-[11px] font-medium uppercase leading-tight tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
    </div>
  )
}
