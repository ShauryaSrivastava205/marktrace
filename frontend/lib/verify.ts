import type { RootGapConfidence } from "./mockDiagnose"
import type { GradeResult, Signal, TaskType } from "./mockVerify"

/** Canonical order the three probes are always read in. */
export const TASK_ORDER: TaskType[] = ["direct", "causal", "transfer"]

interface TaskMeta {
  /** Short word shown as the probe's label. */
  label: string
  /** What this probe is for, in the student's terms. */
  purpose: string
  /** Read on the verdict checklist, where the probe is already answered. */
  evidence: string
}

export const TASK_META: Record<TaskType, TaskMeta> = {
  direct: {
    label: "Direct",
    purpose: "the concept itself",
    evidence: "Can you do the concept itself",
  },
  causal: {
    label: "Causal",
    purpose: "does it fix the concept it was blamed for?",
    evidence: "Does fixing it repair the concept it was blamed for",
  },
  transfer: {
    label: "Transfer",
    purpose: "apply it unprompted",
    evidence: "Can you apply it unprompted",
  },
}

const TIER_RANK: Record<RootGapConfidence, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 }

/** Tiers are ordered words, never numbers — nothing here becomes a percentage. */
export function isUpgrade(from: RootGapConfidence, to: RootGapConfidence): boolean {
  return TIER_RANK[to] > TIER_RANK[from]
}

/** The signals the grader actually reported, in canonical order. */
export function reportedSignals(result: GradeResult): [TaskType, Signal][] {
  return TASK_ORDER.flatMap((task) => {
    const signal = result.signals[task]
    return signal ? ([[task, signal]] as [TaskType, Signal][]) : []
  })
}
