"use client"

import { ArrowRight } from "lucide-react"
import { CONCEPT_NODES, getDependencyLabels } from "./data"

interface InfoPanelProps {
  nodeId: string | null
}

export function InfoPanel({ nodeId }: InfoPanelProps) {
  const meta = nodeId ? CONCEPT_NODES.find((n) => n.id === nodeId) : null
  const dependsOn = meta && !meta.isRoot ? getDependencyLabels(meta.id) : []

  return (
    <div
      className="pointer-events-none absolute inset-x-3 bottom-3 z-30 max-w-xs rounded-md border border-border bg-popover/95 px-3.5 py-3 shadow-lg backdrop-blur-sm transition-all duration-200 ease-out"
      style={{
        opacity: meta ? 1 : 0,
        transform: meta ? "translateY(0) scale(1)" : "translateY(6px) scale(0.97)",
      }}
      aria-live="polite"
    >
      {meta && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="font-sans text-xs font-semibold tracking-wide text-foreground">
              {meta.label}
            </span>
            <span
              className={
                meta.isRoot
                  ? "font-sans text-[11px] font-medium text-destructive"
                  : "font-sans text-[11px] font-medium text-muted-foreground"
              }
            >
              {meta.isRoot ? "Root Gap" : `${meta.mastery}% mastery`}
            </span>
          </div>

          {meta.isRoot ? (
            <div className="mt-1.5 space-y-1">
              <p className="font-sans text-[12px] text-muted-foreground">
                Mastery: <span className="text-foreground">{meta.mastery}%</span>
              </p>
              <p className="font-sans text-[12px] text-muted-foreground">
                Exam exposure: <span className="text-foreground">{meta.examMarks} marks</span>
              </p>
              <p className="font-sans text-[12px] leading-snug text-muted-foreground">
                Likely misconception:{" "}
                <span className="text-foreground">&ldquo;{meta.misconception}&rdquo;</span>
              </p>
            </div>
          ) : (
            <div className="mt-1.5 space-y-1">
              {dependsOn.length > 0 && (
                <p className="font-sans text-[12px] text-muted-foreground">
                  Depends on: <span className="text-foreground">{dependsOn.join(", ")}</span>
                </p>
              )}
              <p className="font-sans text-[12px] leading-snug text-muted-foreground">
                Why affected: {meta.summary}
              </p>
            </div>
          )}

          <button
            type="button"
            tabIndex={-1}
            className="pointer-events-none mt-2 inline-flex items-center gap-1 font-sans text-[11px] font-medium text-primary"
          >
            {meta.isRoot ? "Understand this topic" : "Explore topic"}
            <ArrowRight className="size-3" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  )
}
