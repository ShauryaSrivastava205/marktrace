"use client"

import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import {
  conceptStatus,
  evidenceFor,
  masteryPercent,
  rootGapAffecting,
  type ConceptStatusView,
} from "@/lib/diagnosis"
import type { DiagnoseResult } from "@/lib/mockDiagnose"
import { MasteryMeter, STATUS_STYLE, masteryLabel, statusLabel } from "./status"

interface ConceptMasteryPanelProps {
  diagnose: DiagnoseResult
  activeConceptId?: string | null
  onHoverConcept?: (conceptId: string | null) => void
  onSelectConcept?: (conceptId: string) => void
}

/** Most severe first, so the eye lands on what is broken. */
const SEVERITY: Record<ConceptStatusView, number> = {
  root_gap: 0,
  weak: 1,
  developing: 2,
  affected: 3,
  mastered: 4,
  unknown: 5,
}

export function ConceptMasteryPanel({
  diagnose,
  activeConceptId,
  onHoverConcept,
  onSelectConcept,
}: ConceptMasteryPanelProps) {
  const reduceMotion = useReducedMotion()

  const items = diagnose.concept_mastery
    .map((item) => {
      const status = conceptStatus(item.concept_id, diagnose)
      return {
        item,
        status,
        evidence: evidenceFor(item.concept_id, diagnose),
        pct: masteryPercent(item.mastery),
        gap: rootGapAffecting(item.concept_id, diagnose),
      }
    })
    .sort((a, b) => {
      const bySeverity = SEVERITY[a.status] - SEVERITY[b.status]
      if (bySeverity !== 0) return bySeverity
      return (a.pct ?? 101) - (b.pct ?? 101)
    })

  const interactive = Boolean(onSelectConcept)

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-serif text-xl font-semibold text-foreground">Concept mastery</h2>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {items.length} concepts assessed
        </p>
      </div>

      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {diagnose.explanation}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map(({ item, status, evidence, pct, gap }, i) => {
          const style = STATUS_STYLE[status]
          const isActive = activeConceptId === item.concept_id

          return (
            <motion.div
              key={item.concept_id}
              initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.32,
                delay: reduceMotion ? 0 : 0.03 * i,
                ease: "easeOut",
              }}
            >
              <div
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-pressed={interactive ? isActive : undefined}
                onMouseEnter={() => onHoverConcept?.(item.concept_id)}
                onMouseLeave={() => onHoverConcept?.(null)}
                onFocus={() => onHoverConcept?.(item.concept_id)}
                onBlur={() => onHoverConcept?.(null)}
                onClick={() => onSelectConcept?.(item.concept_id)}
                onKeyDown={(e) => {
                  if (!interactive) return
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelectConcept?.(item.concept_id)
                  }
                }}
                className={cn(
                  "h-full rounded-md border bg-card p-4 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  style.border,
                  interactive && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
                  isActive && "border-primary/70 shadow-md ring-1 ring-primary/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-sans text-sm font-semibold leading-tight text-foreground">
                    {item.name}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]",
                      style.chip,
                    )}
                  >
                    {statusLabel(status, evidence)}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  {pct === null ? (
                    <span className="font-sans text-[13px] italic text-muted-foreground">
                      {masteryLabel(pct, evidence)}
                    </span>
                  ) : (
                    <>
                      <span className="font-serif text-2xl font-semibold tabular-nums text-foreground">
                        {pct}
                      </span>
                      <span className="text-xs text-muted-foreground">%</span>
                    </>
                  )}
                </div>

                <MasteryMeter pct={pct} status={status} className="mt-2" />

                <p className="mt-2.5 min-h-[16px] text-[11px] leading-tight text-muted-foreground">
                  {status === "root_gap" ? (
                    <span className={style.text}>Origin of downstream damage</span>
                  ) : gap ? (
                    <>Affected by {gap.name}</>
                  ) : evidence === "insufficient" ? (
                    <>Not enough answers to score</>
                  ) : null}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
