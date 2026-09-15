"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Maximize2, Minus, Plus, RotateCcw, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DiagnosisGraphEdge, DiagnosisGraphNode } from "@/lib/diagnosis"
import type { DiagnoseResult } from "@/lib/mockDiagnose"
import { ConceptNode } from "./concept-node"
import { ConceptEdge } from "./concept-edge"
import { HoverCard } from "./hover-card"
import { GraphInteractionContext } from "./graph-context"

const nodeTypes = { concept: ConceptNode }
const edgeTypes = { concept: ConceptEdge }

const STEP_MS = 140
const SETTLE_MS = 320

export interface KnowledgeGraphProps {
  diagnose: DiagnoseResult
  model: { nodes: DiagnosisGraphNode[]; edges: DiagnosisGraphEdge[] }
  hoveredId: string | null
  selectedId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string | null) => void
}

export function KnowledgeGraph(props: KnowledgeGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvas {...props} />
    </ReactFlowProvider>
  )
}

function GraphCanvas({
  diagnose,
  model,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: KnowledgeGraphProps) {
  const reduceMotion = useReducedMotion() ?? false
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const nodeEls = useRef<Map<string, HTMLElement>>(new Map())
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  const [blastEdgeIds, setBlastEdgeIds] = useState<Set<string>>(new Set())
  const [blastNodeIds, setBlastNodeIds] = useState<Set<string>>(new Set())
  const [blastComplete, setBlastComplete] = useState(false)
  const [blastActive, setBlastActive] = useState(false)

  const rfNodes = useMemo<Node[]>(
    () =>
      model.nodes.map((m) => ({
        id: m.id,
        type: "concept",
        position: { x: m.x, y: m.y },
        data: { model: m },
        draggable: true,
        selectable: false,
      })),
    [model],
  )

  const [nodes, , onNodesChange] = useNodesState(rfNodes)

  const edges = useMemo<Edge[]>(
    () =>
      model.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "concept",
        selectable: false,
      })),
    [model],
  )

  const focusId = hoveredId ?? selectedId

  const { relatedIds, relatedEdgeIds } = useMemo(() => {
    const ids = new Set<string>()
    const edgeIds = new Set<string>()
    if (!focusId) return { relatedIds: ids, relatedEdgeIds: edgeIds }
    ids.add(focusId)
    for (const e of model.edges) {
      if (e.source === focusId) {
        ids.add(e.target)
        edgeIds.add(e.id)
      } else if (e.target === focusId) {
        ids.add(e.source)
        edgeIds.add(e.id)
      }
    }
    return { relatedIds: ids, relatedEdgeIds: edgeIds }
  }, [focusId, model.edges])

  const registerNodeEl = useCallback((id: string, el: HTMLElement | null) => {
    if (el) nodeEls.current.set(id, el)
    else nodeEls.current.delete(id)
  }, [])

  const getAnchorEl = useCallback((id: string) => nodeEls.current.get(id) ?? null, [])

  useEffect(() => {
    const pending = timeouts.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const blastRootId = diagnose.blast_radius.root_concept_id
  const blastSequence = useMemo(
    () => model.edges.filter((e) => e.source === blastRootId),
    [model.edges, blastRootId],
  )
  const blastTotal = diagnose.blast_radius.unlocked_concepts.length

  const runBlast = useCallback(() => {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []

    onSelect(null)
    setBlastActive(true)
    setBlastComplete(false)
    setBlastEdgeIds(new Set())
    setBlastNodeIds(new Set([blastRootId]))

    if (reduceMotion) {
      setBlastEdgeIds(new Set(blastSequence.map((e) => e.id)))
      setBlastNodeIds(new Set([blastRootId, ...blastSequence.map((e) => e.target)]))
      setBlastComplete(true)
      return
    }

    blastSequence.forEach((edge, i) => {
      timeouts.current.push(
        setTimeout(() => {
          setBlastEdgeIds((prev) => new Set(prev).add(edge.id))
          setBlastNodeIds((prev) => new Set(prev).add(edge.target))
        }, STEP_MS * (i + 1)),
      )
    })

    timeouts.current.push(
      setTimeout(
        () => setBlastComplete(true),
        STEP_MS * (blastSequence.length + 1) + SETTLE_MS,
      ),
    )
  }, [blastRootId, blastSequence, onSelect, reduceMotion])

  const hoveredNode = useMemo(
    () => model.nodes.find((n) => n.id === hoveredId) ?? null,
    [model.nodes, hoveredId],
  )

  return (
    <GraphInteractionContext.Provider
      value={{
        focusId,
        selectedId,
        relatedIds,
        relatedEdgeIds,
        hasFocus: focusId !== null,
        setHovered: onHover,
        setSelected: onSelect,
        blastNodeIds,
        blastEdgeIds,
        blastActive,
        reduceMotion,
        registerNodeEl,
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runBlast}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] font-medium shadow-sm transition-all duration-150",
                blastActive
                  ? "border-primary/50 bg-primary/[0.06] text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground hover:shadow-md",
              )}
            >
              {blastComplete ? (
                <RotateCcw className="size-3.5" aria-hidden="true" />
              ) : (
                <Zap className="size-3.5" aria-hidden="true" />
              )}
              {blastComplete ? "Replay blast radius" : "Show blast radius"}
            </button>

            {blastActive && (
              <span
                aria-live="polite"
                className="font-sans text-[13px] font-medium text-muted-foreground"
              >
                {blastComplete
                  ? `1 root gap → ${blastTotal} affected concept${blastTotal === 1 ? "" : "s"}`
                  : "Tracing dependencies…"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <ToolButton label="Zoom out" onClick={() => zoomOut({ duration: 160 })}>
              <Minus className="size-3.5" aria-hidden="true" />
            </ToolButton>
            <ToolButton label="Zoom in" onClick={() => zoomIn({ duration: 160 })}>
              <Plus className="size-3.5" aria-hidden="true" />
            </ToolButton>
            <ToolButton
              label="Fit graph to view"
              onClick={() => fitView({ padding: 0.14, duration: 260 })}
            >
              <Maximize2 className="size-3.5" aria-hidden="true" />
            </ToolButton>
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onDoubleClick={() => fitView({ padding: 0.14, duration: 260 })}
          className="diagnosis-flow relative min-h-0 flex-1 bg-grid-paper"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.14 }}
            minZoom={0.35}
            maxZoom={1.75}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnDoubleClick={false}
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            preventScrolling
            onPaneClick={() => onSelect(null)}
          />
        </motion.div>
      </div>

      <HoverCard node={hoveredNode} diagnose={diagnose} getAnchorEl={getAnchorEl} />
    </GraphInteractionContext.Provider>
  )
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  )
}
