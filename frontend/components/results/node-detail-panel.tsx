"use client"

import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, MousePointerClick } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveConceptName } from "@/lib/conceptNames"
import { downstreamIdsFor, rootGapAffecting, type DiagnosisGraphNode } from "@/lib/diagnosis"
import type { DiagnoseResult, ReviewItem } from "@/lib/mockDiagnose"
import { MasteryMeter, STATUS_STYLE, masteryLabel, statusLabel } from "./status"

interface NodeDetailPanelProps {
  node: DiagnosisGraphNode | null
  diagnose: DiagnoseResult
  reviewItems: ReviewItem[]
  onReviewMistakes: (conceptId: string) => void
}

export function NodeDetailPanel({
  node,
  diagnose,
  reviewItems,
  onReviewMistakes,
}: NodeDetailPanelProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="h-full rounded-md border border-border bg-card p-5 shadow-sm">
      {/* Keyed remount rather than AnimatePresence: the panel must swap even
          if an exit animation never gets a frame to finish. */}
      <motion.div
        key={node?.id ?? "empty"}
        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="h-full"
      >
        {node ? (
          <Detail
            node={node}
            diagnose={diagnose}
            reviewItems={reviewItems}
            onReviewMistakes={onReviewMistakes}
          />
        ) : (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
            <MousePointerClick className="size-5 text-muted-foreground/60" aria-hidden="true" />
            <p className="mt-3 max-w-[22ch] text-[13px] leading-relaxed text-muted-foreground">
              Select a concept in the map to see why MarkTrace flagged it.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function Detail({
  node,
  diagnose,
  reviewItems,
  onReviewMistakes,
}: {
  node: DiagnosisGraphNode
  diagnose: DiagnoseResult
  reviewItems: ReviewItem[]
  onReviewMistakes: (conceptId: string) => void
}) {
  const style = STATUS_STYLE[node.status]
  const ownGap = diagnose.root_gaps.find((g) => g.concept_id === node.id) ?? null
  const parentGap = rootGapAffecting(node.id, diagnose)
  const downstream = ownGap ? downstreamIdsFor(ownGap, diagnose) : []
  const hasMistakes = reviewItems.some(
    (item) => item.concept_id === node.id && item.student_pick !== item.correct,
  )

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-xl font-semibold leading-tight text-foreground">
          {node.name}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
            style.chip,
          )}
        >
          {statusLabel(node.status, node.evidence)}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span
            className={cn(
              "font-serif font-semibold tabular-nums text-foreground",
              node.masteryPct === null ? "text-base italic font-normal text-muted-foreground" : "text-3xl",
            )}
          >
            {node.masteryPct === null
              ? masteryLabel(node.masteryPct, node.evidence)
              : `${node.masteryPct}%`}
          </span>
          {node.masteryPct !== null && (
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              mastery
            </span>
          )}
        </div>
        <MasteryMeter pct={node.masteryPct} status={node.status} className="mt-2" />
      </div>

      <dl className="mt-5 space-y-4 border-t border-border pt-4 text-[13px]">
        {ownGap && (
          <Field label="Why MarkTrace flagged this">
            {ownGap.affected_questions} incorrect question
            {ownGap.affected_questions === 1 ? "" : "s"} share this prerequisite.
          </Field>
        )}

        {!ownGap && parentGap && (
          <Field label="Why MarkTrace flagged this">
            Downstream of {parentGap.name}, which is a root gap.
          </Field>
        )}

        {!ownGap && !parentGap && node.evidence === "insufficient" && (
          <Field label="Why there is no score">
            Not enough answers to score this concept.
          </Field>
        )}

        {!ownGap && !parentGap && node.evidence === "unassessed" && (
          <Field label="Evidence">
            This concept was not part of the assessed set.
          </Field>
        )}

        {ownGap && (
          <>
            <Field label="Confidence">{ownGap.confidence}</Field>
            <Field label="Exam exposure">
              {ownGap.marks_associated} mark{ownGap.marks_associated === 1 ? "" : "s"} associated
            </Field>
          </>
        )}

        {downstream.length > 0 && (
          <Field label={`Affected concepts (${downstream.length})`}>
            <ul className="flex flex-wrap gap-1.5">
              {downstream.map((id) => (
                <li
                  key={id}
                  className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-foreground"
                >
                  {resolveConceptName(id, diagnose)}
                </li>
              ))}
            </ul>
          </Field>
        )}
      </dl>

      <div className="mt-5 space-y-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => onReviewMistakes(node.id)}
          disabled={!hasMistakes}
          className="group inline-flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-border disabled:hover:text-foreground"
        >
          Review related mistakes
          <ArrowRight
            className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          disabled
          title="Practice module coming next"
          className="inline-flex w-full cursor-not-allowed items-center justify-between rounded-md border border-dashed border-border px-3 py-2 text-[13px] font-medium text-muted-foreground"
        >
          Practice this concept
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">
            Coming next
          </span>
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 leading-relaxed text-foreground">{children}</dd>
    </div>
  )
}
