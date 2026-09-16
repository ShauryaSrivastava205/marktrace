"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { PromptText } from "@/components/prompt-text"
import { resolveConceptName } from "@/lib/conceptNames"
import { conceptStatus, downstreamIdsFor, rootGapAffecting } from "@/lib/diagnosis"
import type { DiagnoseResult, ErrorType, OptionKey, ReviewItem } from "@/lib/mockDiagnose"

/** A request to open and scroll to the questions for one concept. */
export interface ReviewFocusRequest {
  conceptId: string
  nonce: number
}

interface ReviewAnswersProps {
  reviewItems: ReviewItem[]
  diagnose: DiagnoseResult
  onSelectConcept?: (conceptId: string) => void
  focusRequest?: ReviewFocusRequest | null
}

const DIAGNOSTIC_LABEL: Record<Exclude<ErrorType, null>, string> = {
  conceptual: "Conceptual error",
  procedural: "Procedural error",
  implementation: "Implementation error",
  careless: "Careless error",
}

const DIAGNOSTIC_STYLE: Record<Exclude<ErrorType, null>, string> = {
  conceptual: "bg-destructive/10 text-destructive",
  procedural: "bg-amber-500/15 text-amber-700",
  implementation: "bg-primary/10 text-primary",
  careless: "bg-muted text-muted-foreground",
}

export function ReviewAnswers({
  reviewItems,
  diagnose,
  onSelectConcept,
  focusRequest,
}: ReviewAnswersProps) {
  const incorrect = reviewItems.filter((item) => item.student_pick !== item.correct).length
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set())
  const reduceMotion = useReducedMotion()

  // "Review related mistakes" opens that concept's questions and jumps to them.
  useEffect(() => {
    if (!focusRequest) return
    const matches = reviewItems
      .map((item, i) => (item.concept_id === focusRequest.conceptId ? i : -1))
      .filter((i) => i >= 0)
    if (matches.length === 0) return

    setOpenIndexes((prev) => new Set([...prev, ...matches]))
    document.getElementById(`review-q${matches[0] + 1}`)?.scrollIntoView({
      block: "center",
      behavior: reduceMotion ? "auto" : "smooth",
    })
  }, [focusRequest, reviewItems, reduceMotion])

  const toggle = (index: number) =>
    setOpenIndexes((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-serif text-xl font-semibold text-foreground">Review your answers</h2>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {reviewItems.length} questions · {incorrect} incorrect
        </p>
      </div>

      <ol className="mt-5 space-y-3">
        {reviewItems.map((item, i) => (
          <ReviewCard
            key={`${item.concept_id}-${i}`}
            item={item}
            index={i}
            diagnose={diagnose}
            onSelectConcept={onSelectConcept}
            open={openIndexes.has(i)}
            onToggle={() => toggle(i)}
          />
        ))}
      </ol>
    </section>
  )
}

function ReviewCard({
  item,
  index,
  diagnose,
  onSelectConcept,
  open,
  onToggle,
}: {
  item: ReviewItem
  index: number
  diagnose: DiagnoseResult
  onSelectConcept?: (conceptId: string) => void
  open: boolean
  onToggle: () => void
}) {
  const reduceMotion = useReducedMotion()

  const isCorrect = item.student_pick === item.correct
  const conceptName = resolveConceptName(item.concept_id, diagnose)
  const status = conceptStatus(item.concept_id, diagnose)
  const isRootGap = status === "root_gap"
  const gap = rootGapAffecting(item.concept_id, diagnose)
  const ownGap = diagnose.root_gaps.find((g) => g.concept_id === item.concept_id) ?? null
  const dependencyTargets = ownGap ? downstreamIdsFor(ownGap, diagnose) : []

  return (
    <li
      id={`review-q${index + 1}`}
      className="scroll-mt-24 overflow-hidden rounded-md border border-border bg-card shadow-sm"
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
            Q{index + 1}
          </span>

          <button
            type="button"
            onClick={() => onSelectConcept?.(item.concept_id)}
            disabled={!onSelectConcept}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
              isRootGap ? "bg-destructive/12 text-destructive" : "bg-primary/10 text-primary",
              onSelectConcept && "transition-opacity hover:opacity-75",
            )}
          >
            {conceptName}
            {isRootGap && " · root gap"}
          </button>

          {item.error_type ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                DIAGNOSTIC_STYLE[item.error_type],
              )}
            >
              {DIAGNOSTIC_LABEL[item.error_type]}
            </span>
          ) : (
            <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
              Correct
            </span>
          )}
        </div>

        <div className="mt-3">
          <PromptText prompt={item.prompt} />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <AnswerStat
            label="Your answer"
            value={item.options[item.student_pick]}
            optionKey={item.student_pick}
            tone={isCorrect ? "correct" : "wrong"}
          />
          <AnswerStat
            label="Correct answer"
            value={item.options[item.correct]}
            optionKey={item.correct}
            tone="correct"
          />
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
        >
          {isCorrect ? "Why this is right" : "Explain my mistake"}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex"
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-border bg-muted/25 p-4 sm:p-5">
              <Block label={isCorrect ? "Why this is right" : "Why your answer failed"}>
                {item.explanation ? (
                  <p className="leading-relaxed text-foreground">{item.explanation}</p>
                ) : (
                  <p className="italic text-muted-foreground">
                    No written explanation is attached to this question yet.
                  </p>
                )}
              </Block>

              <Block label="All options">
                <ul className="space-y-1.5">
                  {(Object.entries(item.options) as [OptionKey, string][]).map(([key, text]) => {
                    const correct = key === item.correct
                    const picked = key === item.student_pick
                    const wrongPick = picked && !correct
                    return (
                      <li
                        key={key}
                        className={cn(
                          "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-[13px]",
                          correct && "border-accent/45 bg-accent/[0.06] text-foreground",
                          wrongPick && "border-destructive/45 bg-destructive/[0.06] text-foreground",
                          !correct && !wrongPick && "border-border text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold",
                            correct && "border-accent bg-accent text-accent-foreground",
                            wrongPick && "border-destructive bg-destructive text-white",
                            !correct && !wrongPick && "border-border",
                          )}
                        >
                          {key}
                        </span>
                        <span className="flex-1">{text}</span>
                        {correct && <Check className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />}
                        {wrongPick && <X className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden="true" />}
                      </li>
                    )
                  })}
                </ul>
              </Block>

              <Block label="Root concept involved">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{conceptName}</span>
                  {isRootGap ? (
                    <span className="rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-destructive">
                      Root gap
                    </span>
                  ) : gap ? (
                    <span className="text-muted-foreground">— affected by {gap.name}</span>
                  ) : (
                    <span className="text-muted-foreground">— not linked to a root gap</span>
                  )}
                </div>
              </Block>

              {(dependencyTargets.length > 0 || gap) && (
                <Block label="Dependency impact">
                  {dependencyTargets.length > 0 ? (
                    <ul className="space-y-1">
                      {dependencyTargets.map((id) => (
                        <li key={id} className="flex items-center gap-2 text-[13px]">
                          <span className="font-medium text-destructive">{conceptName}</span>
                          <span aria-hidden="true" className="text-muted-foreground">
                            →
                          </span>
                          <span className="text-foreground">{resolveConceptName(id, diagnose)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    gap && (
                      <div className="flex items-center gap-2 text-[13px]">
                        <span className="font-medium text-destructive">{gap.name}</span>
                        <span aria-hidden="true" className="text-muted-foreground">
                          →
                        </span>
                        <span className="text-foreground">{conceptName}</span>
                      </div>
                    )
                  )}
                </Block>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 text-[13px]">{children}</div>
    </div>
  )
}

function AnswerStat({
  label,
  value,
  optionKey,
  tone,
}: {
  label: string
  value: string
  optionKey: OptionKey
  tone: "correct" | "wrong"
}) {
  const correct = tone === "correct"
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md border px-3 py-2",
        correct ? "border-accent/40 bg-accent/[0.05]" : "border-destructive/40 bg-destructive/[0.05]",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full",
          correct ? "bg-accent text-accent-foreground" : "bg-destructive text-white",
        )}
        aria-hidden="true"
      >
        {correct ? <Check className="size-3" /> : <X className="size-3" />}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-[13px] font-medium text-foreground">
          <span className="font-mono text-muted-foreground">{optionKey}</span> · {value}
        </p>
      </div>
    </div>
  )
}
