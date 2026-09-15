import { cn } from "@/lib/utils"
import type { ConceptStatusView, EvidenceState } from "@/lib/diagnosis"

interface StatusStyle {
  label: string
  /** Chip / badge treatment. */
  chip: string
  /** Solid dot + meter fill. */
  fill: string
  /** Card or node border when this status leads. */
  border: string
  /** Card or node wash. */
  surface: string
  text: string
}

export const STATUS_STYLE: Record<ConceptStatusView, StatusStyle> = {
  root_gap: {
    label: "Root gap",
    chip: "bg-destructive/12 text-destructive",
    fill: "bg-destructive",
    border: "border-destructive/45",
    surface: "bg-destructive/[0.05]",
    text: "text-destructive",
  },
  weak: {
    label: "Weak",
    chip: "bg-destructive/10 text-destructive",
    fill: "bg-destructive/75",
    border: "border-destructive/30",
    surface: "bg-destructive/[0.03]",
    text: "text-destructive",
  },
  developing: {
    label: "Developing",
    chip: "bg-amber-500/15 text-amber-700",
    fill: "bg-amber-500",
    border: "border-amber-500/40",
    surface: "bg-amber-500/[0.05]",
    text: "text-amber-700",
  },
  mastered: {
    label: "Mastered",
    chip: "bg-accent/12 text-accent",
    fill: "bg-accent",
    border: "border-accent/35",
    surface: "bg-accent/[0.04]",
    text: "text-accent",
  },
  affected: {
    label: "Affected",
    chip: "bg-primary/10 text-primary",
    fill: "bg-primary/70",
    border: "border-primary/30",
    surface: "bg-primary/[0.03]",
    text: "text-primary",
  },
  unknown: {
    label: "No data",
    chip: "bg-muted text-muted-foreground",
    fill: "bg-muted-foreground/40",
    border: "border-border",
    surface: "bg-muted/40",
    text: "text-muted-foreground",
  },
}

/** "No data" splits by how the payload knows nothing: scored-but-thin vs never scored. */
export function statusLabel(status: ConceptStatusView, evidence: EvidenceState): string {
  if (status !== "unknown") return STATUS_STYLE[status].label
  return evidence === "insufficient" ? "Insufficient" : "Not assessed"
}

/** The one place mastery is turned into words, so null never renders as 0%. */
export function masteryLabel(pct: number | null, evidence: EvidenceState): string {
  if (evidence === "insufficient") return "Insufficient evidence"
  if (evidence === "unassessed") return "Not assessed"
  return pct === null ? "Insufficient evidence" : `${pct}% mastery`
}

export function StatusChip({
  status,
  evidence,
  className,
}: {
  status: ConceptStatusView
  evidence: EvidenceState
  className?: string
}) {
  const style = STATUS_STYLE[status]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        style.chip,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.fill)} aria-hidden="true" />
      {statusLabel(status, evidence)}
    </span>
  )
}

/** Thin horizontal meter. Renders a dashed, empty track when there is no score. */
export function MasteryMeter({
  pct,
  status,
  className,
}: {
  pct: number | null
  status: ConceptStatusView
  className?: string
}) {
  if (pct === null) {
    return (
      <div
        className={cn("h-1.5 w-full rounded-full border border-dashed border-border", className)}
        aria-hidden="true"
      />
    )
  }

  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)} aria-hidden="true">
      {/* Width is the real value at all times; the transition only decorates
          later changes, so a dropped frame can never under-report mastery. */}
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          STATUS_STYLE[status].fill,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
