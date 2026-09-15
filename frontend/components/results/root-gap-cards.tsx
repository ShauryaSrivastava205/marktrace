"use client"

import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { resolveConceptName } from "@/lib/conceptNames"
import { downstreamIdsFor, masteryPercent } from "@/lib/diagnosis"
import type { DiagnoseResult, RootGapConfidence } from "@/lib/mockDiagnose"
import { MasteryMeter } from "./status"

interface RootGapCardsProps {
  diagnose: DiagnoseResult
  onSelectConcept?: (conceptId: string) => void
}

const CONFIDENCE_STYLE: Record<RootGapConfidence, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-amber-500/15 text-amber-700",
  HIGH: "bg-destructive/12 text-destructive",
}

export function RootGapCards({ diagnose, onSelectConcept }: RootGapCardsProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Root gap breakdown
      </h2>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {diagnose.root_gaps.map((gap, i) => {
          const downstream = downstreamIdsFor(gap, diagnose)
          const downstreamNames = downstream.map((id) => resolveConceptName(id, diagnose))
          const pct = masteryPercent(
            diagnose.concept_mastery.find((c) => c.concept_id === gap.concept_id)?.mastery ?? null,
          )

          return (
            <motion.article
              key={gap.concept_id}
              initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.42,
                delay: reduceMotion ? 0 : 0.08 * i,
                ease: "easeOut",
              }}
              className="group relative overflow-hidden rounded-md border border-destructive/40 bg-card shadow-sm"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[3px] bg-destructive/70"
              />

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-destructive">
                      Root gap {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground">
                      {gap.name}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                      CONFIDENCE_STYLE[gap.confidence],
                    )}
                  >
                    {gap.confidence} confidence
                  </span>
                </div>

                {pct !== null && (
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-serif text-3xl font-semibold tabular-nums text-foreground">
                        {pct}%
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        mastery
                      </span>
                    </div>
                    <MasteryMeter pct={pct} status="root_gap" className="mt-2" />
                  </div>
                )}

                <dl className="mt-5 space-y-3 border-t border-border pt-4 text-[13px]">
                  <Row label="Evidence">
                    {gap.affected_questions} incorrect question
                    {gap.affected_questions === 1 ? "" : "s"}
                  </Row>
                  <Row label="Impact">
                    {downstream.length} downstream concept{downstream.length === 1 ? "" : "s"}
                    <span className="text-muted-foreground"> · </span>
                    {gap.marks_associated} exam mark{gap.marks_associated === 1 ? "" : "s"} associated
                  </Row>
                  {downstreamNames.length > 0 && (
                    <Row label="Recommendation">
                      Repair {gap.name} before{" "}
                      {downstreamNames.slice(0, 2).join(" and ")}
                      {downstreamNames.length > 2
                        ? ` (+${downstreamNames.length - 2} more)`
                        : ""}
                      .
                    </Row>
                  )}
                </dl>

                {onSelectConcept && (
                  <button
                    type="button"
                    onClick={() => onSelectConcept(gap.concept_id)}
                    className="mt-4 text-[13px] font-medium text-primary underline-offset-4 transition-colors hover:underline"
                  >
                    Show in graph
                  </button>
                )}
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[124px_minmax(0,1fr)] gap-x-3 gap-y-1">
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="leading-relaxed text-foreground">{children}</dd>
    </div>
  )
}
