export type ConceptTier = 0 | 1 | 2

export interface ConceptMeta {
  id: string
  label: string
  tier: ConceptTier
  mastery: number // 0-100, lower = weaker
  isRoot?: boolean
  x: number
  y: number
  summary: string
  /** Root-gap only: marks attributable to this concept in recent exams. */
  examMarks?: number
  /** Root-gap only: the misconception most exam errors trace back to. */
  misconception?: string
}

export interface ConceptEdgeMeta {
  id: string
  source: string
  target: string
}

// Layout is hand-placed on a 0-600 x 0-360 canvas so the graph reads as a
// small dependency tree: root gap at top, tier-1 dependents in the middle,
// tier-0 downstream concepts at the bottom.
export const CONCEPT_NODES: ConceptMeta[] = [
  {
    id: "recursion",
    label: "Recursion",
    tier: 2,
    mastery: 34,
    isRoot: true,
    x: 320,
    y: 30,
    summary:
      "The root gap. Every downstream miss traces back to an unstable base case or call-stack model here.",
    examMarks: 7,
    misconception: "Confusion about stack unwinding",
  },
  {
    id: "backtracking",
    label: "Backtracking",
    tier: 1,
    mastery: 48,
    x: 110,
    y: 115,
    summary:
      "Depends on recursion to explore and unwind choices. Weak base cases surface here as infinite branches.",
  },
  {
    id: "trees",
    label: "Trees",
    tier: 1,
    mastery: 52,
    x: 320,
    y: 115,
    summary:
      "Depends on recursion to traverse nested structures. Errors here usually mean the recursive call is missing a stop condition.",
  },
  {
    id: "dynamic-programming",
    label: "Dynamic Programming",
    tier: 1,
    mastery: 41,
    x: 550,
    y: 115,
    summary:
      "Depends on recursion to define subproblems before memoizing. A shaky base case breaks the whole table.",
  },
  {
    id: "combinations",
    label: "Combinations",
    tier: 0,
    mastery: 58,
    x: 150,
    y: 195,
    summary:
      "Depends on backtracking's choice-exploration pattern, which itself depends on recursion's call-stack model.",
  },
]

export const CONCEPT_EDGES: ConceptEdgeMeta[] = [
  { id: "e-rec-back", source: "recursion", target: "backtracking" },
  { id: "e-rec-trees", source: "recursion", target: "trees" },
  { id: "e-rec-dp", source: "recursion", target: "dynamic-programming" },
  { id: "e-back-comb", source: "backtracking", target: "combinations" },
]

export interface BlastRadiusStep {
  edgeId: string
  nodeId: string
  /** Milliseconds after the trigger that this edge/node activates. */
  delay: number
}

// The "Show Blast Radius" timeline: each prerequisite edge lights up in turn,
// lifting its destination concept, so the root gap's downstream impact reads
// as a traced sequence rather than an instant reveal.
export const BLAST_RADIUS_TIMELINE: BlastRadiusStep[] = [
  { edgeId: "e-rec-back", nodeId: "backtracking", delay: 150 },
  { edgeId: "e-rec-trees", nodeId: "trees", delay: 250 },
  { edgeId: "e-rec-dp", nodeId: "dynamic-programming", delay: 350 },
  { edgeId: "e-back-comb", nodeId: "combinations", delay: 500 },
]

export const AFFECTED_CONCEPT_COUNT = CONCEPT_NODES.length - 1

export function getDescendantIds(rootId: string): string[] {
  const direct = CONCEPT_EDGES.filter((e) => e.source === rootId).map((e) => e.target)
  const nested = direct.flatMap((id) => getDescendantIds(id))
  return Array.from(new Set([...direct, ...nested]))
}

export function getConnectedEdgeIds(nodeId: string, edges: ConceptEdgeMeta[] = CONCEPT_EDGES): string[] {
  return edges.filter((e) => e.source === nodeId || e.target === nodeId).map((e) => e.id)
}

/** Labels of the concepts a given node directly depends on (its prerequisites). */
export function getDependencyLabels(nodeId: string): string[] {
  return CONCEPT_EDGES.filter((e) => e.target === nodeId)
    .map((e) => CONCEPT_NODES.find((n) => n.id === e.source)?.label)
    .filter((label): label is string => Boolean(label))
}
