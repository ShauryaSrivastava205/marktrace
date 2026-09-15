"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import { ReactFlow, type Edge, type Node } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { GraphInteractionContext } from "./graph-context"
import { ConceptNode } from "./concept-node"
import { ConceptEdge } from "./concept-edge"
import { InfoPanel } from "./info-panel"
import { BlastRadiusControl } from "./blast-radius-control"
import {
  BLAST_RADIUS_TIMELINE,
  CONCEPT_EDGES,
  CONCEPT_NODES,
  getConnectedEdgeIds,
  type BlastRadiusStep,
  type ConceptEdgeMeta,
  type ConceptMeta,
} from "./data"

const nodeTypes = { concept: ConceptNode }
const edgeTypes = { concept: ConceptEdge }

const BLAST_SETTLE_BUFFER = 350

interface ConceptGraphProps {
  /** Defaults to the login page's demo dataset when omitted. */
  nodes?: ConceptMeta[]
  edges?: ConceptEdgeMeta[]
  /** Concept ids treated as root gaps — supports more than one. */
  rootConceptIds?: string[]
  /** Staggered reveal timeline for "Show Blast Radius". */
  blastTimeline?: BlastRadiusStep[]
  /** Play the blast radius once automatically when the graph mounts. */
  autoTriggerBlastRadius?: boolean
}

export function ConceptGraph({
  nodes = CONCEPT_NODES,
  edges = CONCEPT_EDGES,
  rootConceptIds = ["recursion"],
  blastTimeline = BLAST_RADIUS_TIMELINE,
  autoTriggerBlastRadius = false,
}: ConceptGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [lockedNodeId, setLockedNodeId] = useState<string | null>(null)
  const [blastActive, setBlastActive] = useState(false)
  const [blastComplete, setBlastComplete] = useState(false)
  const [affectedNodeIds, setAffectedNodeIds] = useState<Set<string>>(new Set())
  const [activeBlastEdgeIds, setActiveBlastEdgeIds] = useState<Set<string>>(new Set())
  const [reducedMotion, setReducedMotion] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const blastTimeouts = useRef<ReturnType<typeof setTimeout>[]>([])
  const nodeElementsRef = useRef<Map<string, HTMLElement>>(new Map())

  const registerNodeElement = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      nodeElementsRef.current.set(id, el)
    } else {
      nodeElementsRef.current.delete(id)
    }
  }, [])

  const getNodeElement = useCallback((id: string) => nodeElementsRef.current.get(id) ?? null, [])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    return () => {
      blastTimeouts.current.forEach(clearTimeout)
    }
  }, [])

  const activeNodeId = lockedNodeId ?? hoveredNodeId

  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((meta, index) => ({
        id: meta.id,
        type: "concept",
        position: { x: meta.x, y: meta.y },
        data: { meta, index },
        draggable: false,
        selectable: false,
      })),
    [nodes],
  )

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e, index) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "concept",
        selectable: false,
        data: { index },
      })),
    [edges],
  )

  const blastNodeIds = useMemo(() => {
    if (!blastActive) return new Set<string>()
    return new Set([...rootConceptIds, ...affectedNodeIds])
  }, [blastActive, affectedNodeIds, rootConceptIds])

  const highlightedNodeIds = useMemo(() => {
    if (blastActive) return blastNodeIds
    if (activeNodeId) {
      const connected = edges
        .filter((e) => e.source === activeNodeId || e.target === activeNodeId)
        .flatMap((e) => [e.source, e.target])
      return new Set([activeNodeId, ...connected])
    }
    return new Set<string>()
  }, [activeNodeId, blastActive, blastNodeIds, edges])

  const highlightedEdgeIds = useMemo(() => {
    if (blastActive) return activeBlastEdgeIds
    if (activeNodeId) {
      return new Set(getConnectedEdgeIds(activeNodeId, edges))
    }
    return new Set<string>()
  }, [activeNodeId, blastActive, activeBlastEdgeIds, edges])

  const triggerBlastRadius = useCallback(() => {
    blastTimeouts.current.forEach(clearTimeout)
    blastTimeouts.current = []

    setLockedNodeId(null)
    setBlastActive(true)
    setBlastComplete(false)
    setAffectedNodeIds(new Set())
    setActiveBlastEdgeIds(new Set())

    if (reducedMotion) {
      setAffectedNodeIds(new Set(blastTimeline.map((s) => s.nodeId)))
      setActiveBlastEdgeIds(new Set(blastTimeline.map((s) => s.edgeId)))
      setBlastComplete(true)
      return
    }

    blastTimeline.forEach((step) => {
      blastTimeouts.current.push(
        setTimeout(() => {
          setActiveBlastEdgeIds((prev) => new Set(prev).add(step.edgeId))
          setAffectedNodeIds((prev) => new Set(prev).add(step.nodeId))
        }, step.delay),
      )
    })

    const lastDelay = blastTimeline[blastTimeline.length - 1]?.delay ?? 0
    blastTimeouts.current.push(
      setTimeout(() => setBlastComplete(true), lastDelay + BLAST_SETTLE_BUFFER),
    )
  }, [reducedMotion, blastTimeline])

  useEffect(() => {
    if (!autoTriggerBlastRadius) return
    triggerBlastRadius()
  }, [autoTriggerBlastRadius, triggerBlastRadius])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      setTilt({ x: py * -2.5, y: px * 2.5 })
    },
    [reducedMotion],
  )

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
  }, [])

  const revealedCount = affectedNodeIds.size
  const affectedConceptCount = nodes.length - rootConceptIds.length

  return (
    <GraphInteractionContext.Provider
      value={{
        activeNodeId,
        lockedNodeId,
        setHoveredNodeId,
        setLockedNodeId,
        highlightedNodeIds,
        highlightedEdgeIds,
        blastActive,
        reducedMotion,
        registerNodeElement,
        nodes,
        edges,
      }}
    >
      <div className="flex h-full w-full flex-col">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <BlastRadiusControl
            active={blastActive}
            complete={blastComplete}
            revealedCount={revealedCount}
            rootCount={rootConceptIds.length}
            targetCount={affectedConceptCount}
            onTrigger={triggerBlastRadius}
          />
        </motion.div>

        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            if (e.target === containerRef.current) setLockedNodeId(null)
          }}
          className="relative mt-2 min-h-0 flex-1 w-full overflow-hidden [perspective:1200px]"
        >
          <div
            className="concept-flow h-full w-full transition-transform duration-200 ease-out"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.1 }}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={false}
              panOnScroll={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              preventScrolling
              autoPanOnNodeDrag={false}
              autoPanOnConnect={false}
              autoPanOnSelection={false}
              autoPanOnNodeFocus={false}
              minZoom={0.9}
              maxZoom={1.5}
            />
          </div>

          <InfoPanel
            nodeId={lockedNodeId ?? hoveredNodeId}
            instant={lockedNodeId !== null}
            getAnchorEl={getNodeElement}
          />
        </div>
      </div>
    </GraphInteractionContext.Provider>
  )
}
