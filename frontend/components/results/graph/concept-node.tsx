"use client"

import { memo } from "react"
import { motion } from "motion/react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { NODE_WIDTH, type DiagnosisGraphNode } from "@/lib/diagnosis"
import { STATUS_STYLE, masteryLabel, statusLabel } from "../status"
import { useGraphInteraction } from "./graph-context"

export type ConceptNodeData = { model: DiagnosisGraphNode }

/** Apparent height above the board — root gaps sit highest. */
const ELEVATION: Record<0 | 1 | 2, number> = { 0: 14, 1: 6, 2: 0 }
const SHADOW: Record<0 | 1 | 2, string> = {
  0: "shadow-[0_10px_24px_-10px_rgba(20,35,60,0.35)]",
  1: "shadow-[0_6px_16px_-8px_rgba(20,35,60,0.3)]",
  2: "shadow-sm",
}

function ConceptNodeImpl({ id, data }: NodeProps & { data: ConceptNodeData }) {
  const model = data.model
  const {
    focusId,
    selectedId,
    relatedIds,
    hasFocus,
    setHovered,
    setSelected,
    blastNodeIds,
    blastActive,
    reduceMotion,
    registerNodeEl,
  } = useGraphInteraction()

  const style = STATUS_STYLE[model.status]
  const isSelected = selectedId === id
  const isFocused = focusId === id
  const dimmed = hasFocus && !relatedIds.has(id)
  const inBlast = blastActive && blastNodeIds.has(id)
  const lift = ELEVATION[model.layer] + (isFocused ? 5 : 0)

  return (
    <div
      ref={(el) => registerNodeEl(id, el)}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${model.name}, ${statusLabel(model.status, model.evidence)}, ${masteryLabel(
        model.masteryPct,
        model.evidence,
      )}`}
      onMouseEnter={() => setHovered(id)}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(id)}
      onBlur={() => setHovered(null)}
      onClick={() => setSelected(isSelected ? null : id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setSelected(isSelected ? null : id)
        }
      }}
      style={{
        width: NODE_WIDTH,
        transform: `translateY(-${lift}px) scale(${isFocused ? 1.03 : 1})`,
        transition: reduceMotion
          ? "none"
          : "transform 200ms ease-out, opacity 200ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out",
        opacity: dimmed ? 0.45 : 1,
        zIndex: isFocused || isSelected ? 30 : 10 - model.layer,
      }}
      className={cn(
        "group relative cursor-grab select-none rounded-lg border bg-card px-3.5 py-3 text-left active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        SHADOW[model.layer],
        style.border,
        model.isRootGap && "bg-destructive/[0.05]",
        inBlast && !isSelected && "border-primary/60",
        isSelected && "border-primary ring-2 ring-primary/35",
      )}
    >
      <Handle type="target" position={Position.Top} className="!size-1 !border-0 !bg-transparent" />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-1 !border-0 !bg-transparent"
      />

      {model.isRootGap && !reduceMotion && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1.5 -z-10 rounded-xl border border-destructive/35"
          animate={{ opacity: [0.35, 0.1, 0.35], scale: [1, 1.035, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <p className="font-sans text-[13.5px] font-semibold leading-snug text-foreground">
          {model.name}
        </p>
        <span className={cn("mt-1 size-2 shrink-0 rounded-full", style.fill)} aria-hidden="true" />
      </div>

      <p
        className={cn(
          "mt-1.5 font-sans text-[12px] tabular-nums",
          model.masteryPct === null ? "italic text-muted-foreground" : "text-muted-foreground",
        )}
      >
        {masteryLabel(model.masteryPct, model.evidence)}
      </p>

      <span
        className={cn(
          "mt-2 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]",
          style.chip,
        )}
      >
        {statusLabel(model.status, model.evidence)}
      </span>
    </div>
  )
}

export const ConceptNode = memo(ConceptNodeImpl)
