"use client"

import { getBezierPath, Position, type EdgeProps } from "@xyflow/react"
import { useGraphInteraction } from "./graph-context"

/**
 * Dependency link. Three states: resting, related (a connected node has
 * focus) and blast (revealed by the blast-radius sequence).
 */
export function ConceptEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps) {
  const { relatedEdgeIds, hasFocus, blastEdgeIds, blastActive, reduceMotion } =
    useGraphInteraction()

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Bottom,
    targetX,
    targetY,
    targetPosition: Position.Top,
    curvature: 0.35,
  })

  const isRelated = relatedEdgeIds.has(id)
  const inBlast = blastActive && blastEdgeIds.has(id)
  const dimmed = hasFocus && !isRelated
  const active = isRelated || inBlast

  return (
    <g>
      <path
        d={path}
        fill="none"
        className="react-flow__edge-path"
        style={{
          stroke: active ? "var(--primary)" : "var(--foreground)",
          strokeOpacity: dimmed ? 0.12 : active ? 0.9 : 0.22,
          strokeWidth: active ? 2 : 1.4,
          transition: reduceMotion
            ? "none"
            : "stroke 220ms ease-out, stroke-opacity 220ms ease-out, stroke-width 220ms ease-out",
        }}
      />
      {inBlast && !reduceMotion && (
        <circle r={3} fill="var(--primary)">
          <animateMotion dur="1.05s" repeatCount="1" fill="freeze" path={path} />
        </circle>
      )}
    </g>
  )
}
