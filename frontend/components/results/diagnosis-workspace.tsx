"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { buildDiagnosisGraph } from "@/lib/diagnosis"
import type { DiagnoseResult, ReviewItem } from "@/lib/mockDiagnose"
import { RootGapCards } from "./root-gap-cards"
import { ConceptMasteryPanel } from "./concept-mastery-panel"
import { ReviewAnswers, type ReviewFocusRequest } from "./review-answers"
import { NodeDetailPanel } from "./node-detail-panel"
import { KnowledgeGraph } from "./graph/knowledge-graph"

interface DiagnosisWorkspaceProps {
  diagnose: DiagnoseResult
  reviewItems: ReviewItem[]
}

/**
 * Owns the selection/hover state shared by the map, the mastery tiles and
 * the answer review so the three read as one instrument.
 */
export function DiagnosisWorkspace({ diagnose, reviewItems }: DiagnosisWorkspaceProps) {
  const reduceMotion = useReducedMotion()
  const graphRef = useRef<HTMLDivElement>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusRequest, setFocusRequest] = useState<ReviewFocusRequest | null>(null)

  const model = useMemo(() => buildDiagnosisGraph(diagnose), [diagnose])

  const selectedNode = useMemo(
    () => model.nodes.find((n) => n.id === selectedId) ?? null,
    [model.nodes, selectedId],
  )

  /** Selection coming from outside the map scrolls the map into view. */
  const selectFromOutside = useCallback(
    (conceptId: string) => {
      setSelectedId((current) => (current === conceptId ? null : conceptId))
      graphRef.current?.scrollIntoView({
        block: "center",
        behavior: reduceMotion ? "auto" : "smooth",
      })
    },
    [reduceMotion],
  )

  const handleReviewMistakes = useCallback((conceptId: string) => {
    setFocusRequest({ conceptId, nonce: Date.now() })
  }, [])

  return (
    <div className="space-y-12 lg:space-y-14">
      <RootGapCards diagnose={diagnose} onSelectConcept={selectFromOutside} />

      <section ref={graphRef}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Root-gap dependency map
          </h2>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Drag to pan · scroll to zoom · click a concept
          </p>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-[460px] overflow-hidden rounded-md border border-border bg-card shadow-sm sm:h-[560px] xl:h-[640px]">
            <KnowledgeGraph
              diagnose={diagnose}
              model={model}
              hoveredId={hoveredId}
              selectedId={selectedId}
              onHover={setHoveredId}
              onSelect={setSelectedId}
            />
          </div>

          <NodeDetailPanel
            node={selectedNode}
            diagnose={diagnose}
            reviewItems={reviewItems}
            onReviewMistakes={handleReviewMistakes}
          />
        </div>
      </section>

      <ConceptMasteryPanel
        diagnose={diagnose}
        activeConceptId={selectedId}
        onHoverConcept={setHoveredId}
        onSelectConcept={selectFromOutside}
      />

      <ReviewAnswers
        reviewItems={reviewItems}
        diagnose={diagnose}
        onSelectConcept={selectFromOutside}
        focusRequest={focusRequest}
      />
    </div>
  )
}
