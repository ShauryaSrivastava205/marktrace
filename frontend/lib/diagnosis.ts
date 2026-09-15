import { resolveConceptName } from "./conceptNames"
import type { DiagnoseResult, RootGap } from "./mockDiagnose"

/**
 * Derivations over a /diagnose payload. Everything here is read-only: no
 * mastery, root-gap or blast-radius logic is recalculated, only reshaped for
 * presentation. Nothing is invented — concepts the payload never scored are
 * kept distinct from concepts it scored as "not enough evidence".
 */

export type ConceptStatusView =
  | "root_gap"
  | "weak"
  | "developing"
  | "mastered"
  | "affected"
  | "unknown"

/** How much the payload actually knows about a concept. */
export type EvidenceState =
  | "scored" // concept_mastery has a numeric mastery
  | "insufficient" // concept_mastery has mastery: null
  | "unassessed" // concept never appears in concept_mastery

const DEVELOPING_MIN = 0.4
const MASTERED_MIN = 0.8

/** mastery arrives as 0..1; null stays null so callers can't render it as 0%. */
export function masteryPercent(mastery: number | null): number | null {
  return mastery === null ? null : Math.round(mastery * 100)
}

export function rootGapIds(d: DiagnoseResult): string[] {
  return d.root_gaps.map((g) => g.concept_id)
}

/**
 * Concepts a root gap drags down: its own downstream_affected (minus itself)
 * plus, for the concept the blast radius is rooted at, its unlocked_concepts.
 */
export function downstreamIdsFor(gap: RootGap, d: DiagnoseResult): string[] {
  const own = gap.downstream_affected.filter((id) => id !== gap.concept_id)
  const unlocked =
    gap.concept_id === d.blast_radius.root_concept_id ? d.blast_radius.unlocked_concepts : []
  return Array.from(new Set([...own, ...unlocked]))
}

export function affectedConceptIds(d: DiagnoseResult): Set<string> {
  const ids = new Set<string>()
  for (const gap of d.root_gaps) {
    for (const id of downstreamIdsFor(gap, d)) ids.add(id)
  }
  for (const id of rootGapIds(d)) ids.delete(id)
  return ids
}

/** The root gap responsible for a downstream concept, if any. */
export function rootGapAffecting(conceptId: string, d: DiagnoseResult): RootGap | null {
  return d.root_gaps.find((gap) => downstreamIdsFor(gap, d).includes(conceptId)) ?? null
}

export function evidenceFor(conceptId: string, d: DiagnoseResult): EvidenceState {
  const scored = d.concept_mastery.find((c) => c.concept_id === conceptId)
  if (!scored) return "unassessed"
  return scored.mastery === null ? "insufficient" : "scored"
}

export function conceptStatus(conceptId: string, d: DiagnoseResult): ConceptStatusView {
  if (rootGapIds(d).includes(conceptId)) return "root_gap"

  const scored = d.concept_mastery.find((c) => c.concept_id === conceptId)
  if (scored) {
    if (scored.mastery === null) return "unknown"
    if (scored.status === "ok" || scored.mastery >= MASTERED_MIN) return "mastered"
    if (scored.mastery >= DEVELOPING_MIN) return "developing"
    return "weak"
  }

  return affectedConceptIds(d).has(conceptId) ? "affected" : "unknown"
}

export interface DiagnosisSummary {
  rootGapCount: number
  marksAssociated: number
  affectedQuestions: number
  downstreamConcepts: number
}

/** Totals across root gaps only — these fields exist nowhere else in the payload. */
export function summarize(d: DiagnoseResult): DiagnosisSummary {
  return {
    rootGapCount: d.root_gaps.length,
    marksAssociated: d.root_gaps.reduce((sum, g) => sum + g.marks_associated, 0),
    affectedQuestions: d.root_gaps.reduce((sum, g) => sum + g.affected_questions, 0),
    downstreamConcepts: affectedConceptIds(d).size,
  }
}

export interface DiagnosisGraphNode {
  id: string
  name: string
  status: ConceptStatusView
  evidence: EvidenceState
  masteryPct: number | null
  isRootGap: boolean
  /** Root gap this concept hangs off, when it is downstream of one. */
  affectedByGapId: string | null
  /** 0 = root gaps, 1 = concepts they affect, 2 = concepts with no link to a gap. */
  layer: 0 | 1 | 2
  x: number
  y: number
}

export interface DiagnosisGraphEdge {
  id: string
  source: string
  target: string
}

export const NODE_WIDTH = 196
const COL = 232
const CLUSTER_GAP = 96
const ROOT_Y = 0
const CHILD_START_Y = 215
const ROW_HEIGHT = 136
const UNLINKED_GAP = 44
const MAX_PER_ROW = 4

/**
 * Lays the payload out as a dependency map: root gaps on top, the concepts
 * each one drags down clustered beneath it, and any remaining scored concepts
 * on a separate row so they read as unconnected rather than downstream.
 */
export function buildDiagnosisGraph(d: DiagnoseResult): {
  nodes: DiagnosisGraphNode[]
  edges: DiagnosisGraphEdge[]
  width: number
} {
  const roots = rootGapIds(d)
  const claimed = new Set<string>(roots)

  const clusters = d.root_gaps.map((gap) => {
    const targets: string[] = []
    for (const id of downstreamIdsFor(gap, d)) {
      if (claimed.has(id)) continue
      claimed.add(id)
      targets.push(id)
    }
    return { gap, targets }
  })

  const makeNode = (
    id: string,
    layer: 0 | 1 | 2,
    x: number,
    y: number,
    affectedByGapId: string | null,
  ): DiagnosisGraphNode => {
    const scored = d.concept_mastery.find((c) => c.concept_id === id)
    return {
      id,
      name: resolveConceptName(id, d),
      status: conceptStatus(id, d),
      evidence: evidenceFor(id, d),
      masteryPct: masteryPercent(scored?.mastery ?? null),
      isRootGap: roots.includes(id),
      affectedByGapId,
      layer,
      x,
      y,
    }
  }

  const nodes: DiagnosisGraphNode[] = []
  const edges: DiagnosisGraphEdge[] = []
  let cursorX = 0

  for (const { gap, targets } of clusters) {
    const cols = Math.min(Math.max(targets.length, 1), MAX_PER_ROW)
    const clusterWidth = cols * COL

    nodes.push(
      makeNode(gap.concept_id, 0, cursorX + clusterWidth / 2 - COL / 2, ROOT_Y, null),
    )

    targets.forEach((id, i) => {
      const row = Math.floor(i / MAX_PER_ROW)
      const rowStart = row * MAX_PER_ROW
      const rowCount = Math.min(targets.length - rowStart, MAX_PER_ROW)
      const rowOffset = (clusterWidth - rowCount * COL) / 2
      const x = cursorX + rowOffset + (i % MAX_PER_ROW) * COL

      nodes.push(makeNode(id, 1, x, CHILD_START_Y + row * ROW_HEIGHT, gap.concept_id))
      edges.push({ id: `e-${gap.concept_id}-${id}`, source: gap.concept_id, target: id })
    })

    cursorX += clusterWidth + CLUSTER_GAP
  }

  const width = Math.max(cursorX - CLUSTER_GAP, COL)

  const unlinked = d.concept_mastery
    .map((c) => c.concept_id)
    .filter((id) => !claimed.has(id))

  if (unlinked.length > 0) {
    const deepestRow = clusters.reduce(
      (max, c) => Math.max(max, Math.ceil(c.targets.length / MAX_PER_ROW)),
      1,
    )
    const y = CHILD_START_Y + deepestRow * ROW_HEIGHT + UNLINKED_GAP
    const start = (width - unlinked.length * COL) / 2
    unlinked.forEach((id, i) => {
      nodes.push(makeNode(id, 2, start + i * COL, y, null))
    })
  }

  return { nodes, edges, width }
}
