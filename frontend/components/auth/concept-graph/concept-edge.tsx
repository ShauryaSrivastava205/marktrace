"use client"

import { motion } from "motion/react"
import { getStraightPath, type EdgeProps } from "@xyflow/react"
import { useGraphInteraction } from "./graph-context"

type ConceptEdgeData = {
  index?: number
}

export function ConceptEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps & { data?: ConceptEdgeData }) {
  const { highlightedEdgeIds, reducedMotion } = useGraphInteraction()
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  const isActive = highlightedEdgeIds.has(id)
  const isDimmed = highlightedEdgeIds.size > 0 && !isActive
  const entranceDelay = 0.12 + (data?.index ?? 0) * 0.05

  return (
    <>
      <motion.path
        className="react-flow__edge-path"
        d={path}
        fill="none"
        initial={reducedMotion ? undefined : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: entranceDelay, ease: "easeOut" }}
        style={{
          stroke: isActive ? "var(--primary)" : "var(--foreground)",
          strokeOpacity: isActive ? 1 : 0.3,
          strokeWidth: isActive ? 1.75 : 1.4,
          opacity: isDimmed ? 0.25 : 1,
          transition: "stroke 200ms ease-out, opacity 200ms ease-out, stroke-width 200ms ease-out",
        }}
      />
      {isActive && !reducedMotion && (
        <circle r={2.5} fill="var(--primary)">
          <animateMotion dur="1.1s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </>
  )
}
