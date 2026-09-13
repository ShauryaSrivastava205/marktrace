"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

type Node = {
  id: string
  label: string
  x: number
  y: number
  root?: boolean
}

const nodes: Node[] = [
  { id: "recursion", label: "Recursion", x: 240, y: 34, root: true },
  { id: "backtracking", label: "Backtracking", x: 76, y: 146 },
  { id: "trees", label: "Trees", x: 240, y: 146 },
  { id: "dp", label: "DP", x: 404, y: 146 },
  { id: "combinations", label: "Combinations", x: 76, y: 246 },
]

const edges: [string, string][] = [
  ["recursion", "backtracking"],
  ["recursion", "trees"],
  ["recursion", "dp"],
  ["backtracking", "combinations"],
]

function findNode(id: string) {
  return nodes.find((n) => n.id === id)!
}

/**
 * The hero concept-dependency diagram for MarkTrace. Purely presentational —
 * the real graph will be data-driven once the FastAPI backend exists.
 */
export function ConceptPreview() {
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  const isEdgeActive = (fromId: string, toId: string) =>
    hovered === fromId || hovered === toId

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 480 274"
        className="w-full max-w-lg"
        role="img"
        aria-label="Concept dependency diagram showing Recursion as the detected root gap, connected to Backtracking, Trees, and DP, with Combinations depending on Backtracking"
      >
        <title>Concept dependency diagram</title>

        {/* edges */}
        {edges.map(([fromId, toId], i) => {
          const from = findNode(fromId)
          const to = findNode(toId)
          const active = isEdgeActive(fromId, toId)
          return (
            <g key={`${fromId}-${toId}`}>
              <motion.line
                x1={from.x}
                y1={from.y + 17}
                x2={to.x}
                y2={to.y - 17}
                stroke={active ? "var(--color-primary)" : "currentColor"}
                className={active ? "" : "text-border"}
                strokeWidth={active ? 1.5 : 1}
                initial={reduceMotion ? undefined : { pathLength: 0, opacity: 0 }}
                animate={ready ? { pathLength: 1, opacity: 1 } : undefined}
                transition={{
                  duration: 0.5,
                  delay: 0.35 + i * 0.12,
                  ease: "easeOut",
                }}
              />
              {/* ambient particle traveling along the edge */}
              {!reduceMotion && (
                <motion.circle
                  r={2.2}
                  className="fill-accent"
                  initial={{
                    cx: from.x,
                    cy: from.y + 17,
                    opacity: 0,
                  }}
                  animate={{
                    cx: [from.x, to.x],
                    cy: [from.y + 17, to.y - 17],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 1.6,
                    delay: 2 + i * 1.1,
                    repeat: Infinity,
                    repeatDelay: 4.5,
                    ease: "easeInOut",
                  }}
                />
              )}
            </g>
          )
        })}

        {/* root pulse ring */}
        {ready && !reduceMotion && (
          <motion.circle
            cx={nodes[0].x}
            cy={nodes[0].y}
            r={26}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={1}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.25, 1.5] }}
            transition={{
              duration: 2,
              delay: 0.9,
              repeat: Infinity,
              repeatDelay: 2.5,
              ease: "easeOut",
            }}
            style={{ originX: "center", originY: "center" }}
          />
        )}

        {/* nodes */}
        {nodes.map((node, i) => {
          const width = node.label.length * 7.4 + 28
          const isHovered = hovered === node.id
          return (
            <motion.g
              key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer", originX: "center", originY: "center" }}
              initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={ready ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: 0.45,
                delay: node.root ? 0.05 : 0.55 + i * 0.15,
                ease: "easeOut",
              }}
              whileHover={{ y: -3 }}
            >
              {isHovered && (
                <rect
                  x={node.x - width / 2 - 3}
                  y={node.y - 17 - 3}
                  width={width + 6}
                  height={34 + 6}
                  rx={6}
                  className="fill-none"
                  stroke="var(--color-accent)"
                  strokeWidth={1}
                  opacity={0.35}
                />
              )}
              <rect
                x={node.x - width / 2}
                y={node.y - 17}
                width={width}
                height={34}
                rx={5}
                className={
                  node.root
                    ? "fill-primary stroke-primary"
                    : "fill-card stroke-border"
                }
                strokeWidth={isHovered ? 1.5 : 1}
                style={{
                  filter: isHovered
                    ? "drop-shadow(0 6px 10px rgb(0 0 0 / 0.12))"
                    : undefined,
                  transition: "filter 150ms ease",
                }}
              />
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                className={node.root ? "fill-primary-foreground" : "fill-foreground"}
                style={{
                  fontSize: 12.5,
                  fontFamily: "var(--font-sans)",
                  fontWeight: node.root ? 600 : 500,
                  letterSpacing: "0.01em",
                }}
              >
                {node.label}
              </text>
              {node.root && (
                <circle
                  cx={node.x + width / 2 - 3}
                  cy={node.y - 17}
                  r={4}
                  className="fill-accent"
                />
              )}
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
