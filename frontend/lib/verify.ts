import type { DiagnoseResult, RootGap, RootGapConfidence } from "./mockDiagnose"
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

const TIER_RANK: Record<RootGapConfidence, number> = {
  INSUFFICIENT: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
}

export type TierMove = "upgraded" | "unchanged" | "lowered"

/**
 * How the probe moved the diagnosis's confidence. Tiers are ordered words,
 * never numbers - nothing here becomes a percentage.
 *
 * A probe can lower confidence as well as raise it: a diagnosis that arrived
 * at MEDIUM and then failed its direct probe comes back LOW, and saying that
 * was "unchanged" would misreport the result.
 */
export function tierMove(from: RootGapConfidence, to: RootGapConfidence): TierMove {
  if (TIER_RANK[to] > TIER_RANK[from]) return "upgraded"
  if (TIER_RANK[to] < TIER_RANK[from]) return "lowered"
  return "unchanged"
}

export function isUpgrade(from: RootGapConfidence, to: RootGapConfidence): boolean {
  return tierMove(from, to) === "upgraded"
}

/** The signals the grader actually reported, in canonical order. */
export function reportedSignals(result: GradeResult): [TaskType, Signal][] {
  return TASK_ORDER.flatMap((task) => {
    const signal = result.signals[task]
    return signal ? ([[task, signal]] as [TaskType, Signal][]) : []
  })
}

export interface VerifyTarget {
  rootConceptId: string
  /** The concept the root gap was blamed for - what the causal probe tests. */
  downstreamConceptId: string
  /**
   * The tier the diagnosis arrived with, which the probe may move. null when
   * the requested root is not a root gap in this session, so there is no
   * earlier tier to honestly report.
   */
  previousConfidence: RootGapConfidence | null
}

/**
 * The downstream concept to fall back on when a root gap explains nothing but
 * itself. These mirror the pairs in data/verify_probes.json - the only pairs
 * the backend has probes for - so a fallback points at a probe that exists
 * rather than at a guess.
 */
const KNOWN_DOWNSTREAM: Record<string, string> = {
  recursion: "dp",
  graph: "bfs",
}

/**
 * What to verify a root gap against: the first concept it is said to explain,
 * skipping the root itself (`downstream_affected` includes it, and verifying
 * recursion against recursion would test nothing). Falls back to the known
 * pair for that root, and is null when neither yields a partner.
 */
export function downstreamFor(gap: RootGap): string | null {
  const explained = gap.downstream_affected.find((id) => id !== gap.concept_id)
  return explained ?? KNOWN_DOWNSTREAM[gap.concept_id] ?? null
}

/** The verify target for one specific gap, or null when it has no partner. */
export function targetForGap(gap: RootGap): VerifyTarget | null {
  const downstream = downstreamFor(gap)
  if (!downstream) return null
  return {
    rootConceptId: gap.concept_id,
    downstreamConceptId: downstream,
    previousConfidence: gap.confidence,
  }
}

/** Where the "Verify this gap" button on a root gap card points. */
export function verifyHref(gap: RootGap): string {
  const target = targetForGap(gap)
  const params = new URLSearchParams({ root: gap.concept_id })
  if (target) params.set("downstream", target.downstreamConceptId)
  return `/verify?${params.toString()}`
}

/**
 * Resolves the target a /verify link asked for. The confidence comes from this
 * session's diagnosis when the requested root is one of its root gaps; a link
 * naming some other concept is still honoured, just without a "before" tier.
 */
export function targetFromParams(
  diagnose: DiagnoseResult,
  rootConceptId: string,
  downstreamConceptId: string | null,
): VerifyTarget | null {
  const gap = diagnose.root_gaps.find((g) => g.concept_id === rootConceptId) ?? null
  const downstream =
    downstreamConceptId ??
    (gap ? downstreamFor(gap) : (KNOWN_DOWNSTREAM[rootConceptId] ?? null))

  if (!downstream) return null

  return {
    rootConceptId,
    downstreamConceptId: downstream,
    previousConfidence: gap?.confidence ?? null,
  }
}

/**
 * Picks what to verify when the page was opened without a target: the leading
 * root gap that has something to verify against.
 */
export function chooseVerifyTarget(diagnose: DiagnoseResult): VerifyTarget | null {
  for (const gap of diagnose.root_gaps) {
    const target = targetForGap(gap)
    if (target) return target
  }
  return null
}
