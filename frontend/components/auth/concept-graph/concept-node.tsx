"use client"

import { memo, useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { useGraphInteraction } from "./graph-context"
import type { ConceptMeta } from "./data"

type ConceptNodeData = {
  meta: ConceptMeta
  index: number
}

function ConceptNodeImpl({ data, id }: NodeProps & { data: ConceptNodeData }) {
  const { meta, index } = data
  const {
    activeNodeId,
    lockedNodeId,
    setHoveredNodeId,
    setLockedNodeId,
    highlightedNodeIds,
    blastActive,
    reducedMotion,
  } = useGraphInteraction()

  const isActive = activeNodeId === id
  const isLocked = lockedNodeId === id
  const isEmphasized = isActive || isLocked
  const isDimmed = highlightedNodeIds.size > 0 && !highlightedNodeIds.has(id)
  const isHighlighted = highlightedNodeIds.has(id) && highlightedNodeIds.size > 0

  const tierElevation = meta.tier === 2 ? 0 : meta.tier === 1 ? 10 : 20
  const isWeak = meta.mastery < 45

  // Plays a short pulse the instant a node is swept into the blast radius,
  // then it settles into the steady "affected" highlight below.
  const wasHighlightedRef = useRef(false)
  const [pulseKey, setPulseKey] = useState(0)
  useEffect(() => {
    if (blastActive && isHighlighted && !wasHighlightedRef.current) {
      setPulseKey((k) => k + 1)
    }
    wasHighlightedRef.current = isHighlighted
  }, [isHighlighted, blastActive])

  // CONCEPT_NODES always lists the root gap first, so index 0 is Recursion.
  const entranceDelay = meta.isRoot ? 0.04 : 0.18 + (index - 1) * 0.07

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: entranceDelay, ease: "easeOut" }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isLocked}
        onMouseEnter={() => setHoveredNodeId(id)}
        onMouseLeave={() => setHoveredNodeId(null)}
        onFocus={() => setHoveredNodeId(id)}
        onBlur={() => setHoveredNodeId(null)}
        onClick={() => setLockedNodeId(isLocked ? null : id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setLockedNodeId(isLocked ? null : id)
          }
        }}
        className={cn(
          "group relative flex cursor-pointer select-none rounded-md border bg-card text-left shadow-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          meta.isRoot
            ? "min-h-[56px] min-w-[140px] flex-col justify-center gap-1 px-5 py-3 border-destructive/50 bg-destructive/[0.04] shadow-md"
            : "min-h-[38px] min-w-32 items-center gap-2.5 px-4 py-2 border-border",
          isHighlighted && !isEmphasized && "border-primary/40",
          isEmphasized && "border-primary/70 shadow-lg",
          isDimmed && "opacity-35 blur-[0.3px]",
        )}
        style={{
          transform: `translateY(-${tierElevation + (isEmphasized ? 4 : 0)}px) scale(${
            isEmphasized ? 1.03 : 1
          })`,
          zIndex: isEmphasized ? 20 : meta.tier + 1,
          transition:
            "transform 220ms ease-out, box-shadow 220ms ease-out, opacity 220ms ease-out, border-color 220ms ease-out",
        }}
      >
        <Handle type="target" position={Position.Top} className="!opacity-0" />
        <Handle type="source" position={Position.Bottom} className="!opacity-0" />

        {meta.isRoot && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2.5 -z-10 rounded-lg border border-destructive/30"
            animate={
              reducedMotion
                ? { opacity: 0.3, scale: 1 }
                : { opacity: [0.3, 0.12, 0.3], scale: [1, 1.05, 1] }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
            }
          />
        )}

        {meta.isRoot ? (
          <>
            <span className="flex items-center gap-2.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
              <span className="font-sans text-[16px] font-semibold leading-tight whitespace-nowrap text-foreground">
                {meta.label}
              </span>
            </span>
            <span className="pl-[18px] font-sans text-[11px] font-semibold uppercase tracking-wider text-destructive/70">
              Root gap
            </span>
          </>
        ) : (
          <>
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full", isWeak ? "bg-chart-4" : "bg-accent")}
              aria-hidden="true"
            />
            <span className="font-sans text-[14px] font-medium leading-tight whitespace-nowrap text-foreground">
              {meta.label}
            </span>
          </>
        )}

        {pulseKey > 0 && !reducedMotion && (
          <motion.span
            key={pulseKey}
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1.5 -z-10 rounded-md bg-primary/20"
            initial={{ opacity: 0.55, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.25 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        )}
      </div>
    </motion.div>
  )
}

export const ConceptNode = memo(ConceptNodeImpl)
