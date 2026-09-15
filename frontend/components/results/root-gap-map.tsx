"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { ConceptGraph } from "@/components/auth/concept-graph/concept-graph"
import type { BlastRadiusStep, ConceptEdgeMeta, ConceptMeta } from "@/components/auth/concept-graph/data"
import { resolveConceptName } from "@/lib/conceptNames"
import type { DiagnoseResult } from "@/lib/mockDiagnose"

interface RootGapMapProps {
  diagnose: DiagnoseResult
  className?: string
}

/**
 * Turns the /diagnose payload into a node/edge dataset the shared
 * ConceptGraph component can render: one root per root gap, with
 * blast_radius.unlocked_concepts (plus each gap's other downstream
 * concepts) laid out beneath it.
 */
function buildGraphDataset(diagnose: DiagnoseResult) {
  const { root_gaps, blast_radius } = diagnose
  const rootIds = root_gaps.map((g) => g.concept_id)

  // Group each root gap's downstream concepts together (in root order) so
  // they lay out clustered beneath the root they belong to, rather than
  // interleaved. A concept already claimed by an earlier root is skipped.
  const claimed = new Set<string>(rootIds)
  const groups: { rootId: string; targets: string[] }[] = root_gaps.map((gap) => {
    const own = gap.downstream_affected.filter((id) => id !== gap.concept_id)
    const unlocked = gap.concept_id === blast_radius.root_concept_id ? blast_radius.unlocked_concepts : []
    const targets: string[] = []
    for (const id of [...own, ...unlocked]) {
      if (claimed.has(id)) continue
      claimed.add(id)
      targets.push(id)
    }
    return { rootId: gap.concept_id, targets }
  })

  const downstreamList = groups.flatMap((g) => g.targets)

  const rootSpacing = 700 / Math.max(root_gaps.length, 1)
  const nodes: ConceptMeta[] = root_gaps.map((gap, i) => ({
    id: gap.concept_id,
    label: gap.name,
    tier: 2,
    mastery: 0,
    isRoot: true,
    x: rootSpacing * i + rootSpacing / 2,
    y: 20,
    summary: `Root gap. ${gap.affected_questions} affected question${gap.affected_questions === 1 ? "" : "s"}, ${gap.confidence.toLowerCase()} confidence.`,
    examMarks: gap.marks_associated,
  }))

  const downstreamSpacing = 720 / Math.max(downstreamList.length, 1)
  downstreamList.forEach((id, i) => {
    nodes.push({
      id,
      label: resolveConceptName(id, diagnose),
      tier: 1,
      mastery: 55,
      x: downstreamSpacing * i + downstreamSpacing / 2,
      y: 160,
      summary: "Unlocked by the blast radius above — depends on the root gap it connects to.",
    })
  })

  const edges: ConceptEdgeMeta[] = groups.flatMap((g) =>
    g.targets.map((target) => ({ id: `e-${g.rootId}-${target}`, source: g.rootId, target })),
  )

  const blastTimeline: BlastRadiusStep[] = edges.map((e, i) => ({
    edgeId: e.id,
    nodeId: e.target,
    delay: 120 + i * 90,
  }))

  return { nodes, edges, rootConceptIds: rootIds, blastTimeline }
}

export function RootGapMap({ diagnose, className }: RootGapMapProps) {
  const reduceMotion = useReducedMotion()
  const dataset = useMemo(() => buildGraphDataset(diagnose), [diagnose])

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      className={cn("rounded-md border border-border bg-card p-4 shadow-sm lg:p-5", className)}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold text-foreground">Root-gap map</h2>
        <p className="text-xs text-muted-foreground">
          {dataset.rootConceptIds.length} root gap{dataset.rootConceptIds.length === 1 ? "" : "s"} ·{" "}
          {diagnose.blast_radius.unlocked_concepts.length} unlocked concepts
        </p>
      </div>
      <div className="relative mt-3 h-80 overflow-hidden rounded-md bg-grid-paper sm:h-96 lg:h-[420px]">
        <ConceptGraph
          nodes={dataset.nodes}
          edges={dataset.edges}
          rootConceptIds={dataset.rootConceptIds}
          blastTimeline={dataset.blastTimeline}
          autoTriggerBlastRadius
        />
      </div>
    </motion.div>
  )
}
