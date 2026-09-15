"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowRight } from "lucide-react"
import { CONCEPT_NODES, getDependencyLabels } from "./data"

interface InfoPanelProps {
  nodeId: string | null
  /** Skip the hover delay — used when the node was locked in by a click. */
  instant: boolean
  getAnchorEl: (id: string) => HTMLElement | null
}

const HOVER_DELAY = 180
const GAP = 10
const VIEWPORT_MARGIN = 8

type Position = { top: number; left: number }

export function InfoPanel({ nodeId, instant, getAnchorEl }: InfoPanelProps) {
  const [mounted, setMounted] = useState(false)
  const [visibleNodeId, setVisibleNodeId] = useState<string | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setMounted(true), [])

  // Reveal (after a short hover delay) or dismiss immediately on leave.
  useEffect(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }

    if (!nodeId) {
      setVisibleNodeId(null)
      setPosition(null)
      return
    }

    if (instant) {
      setVisibleNodeId(nodeId)
      return
    }

    showTimeoutRef.current = setTimeout(() => {
      setVisibleNodeId(nodeId)
      showTimeoutRef.current = null
    }, HOVER_DELAY)

    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current)
        showTimeoutRef.current = null
      }
    }
  }, [nodeId, instant])

  const meta = visibleNodeId ? CONCEPT_NODES.find((n) => n.id === visibleNodeId) : null
  const dependsOn = meta && !meta.isRoot ? getDependencyLabels(meta.id) : []

  // Measure the tooltip's real size once it is in the DOM, then place it
  // above the node (or below, if there isn't room) so it never overlaps it.
  useLayoutEffect(() => {
    if (!visibleNodeId) return
    const anchor = getAnchorEl(visibleNodeId)
    const tooltipEl = tooltipRef.current
    if (!anchor || !tooltipEl) return

    const anchorRect = anchor.getBoundingClientRect()
    const { width, height } = tooltipEl.getBoundingClientRect()

    const placement: "top" | "bottom" =
      anchorRect.top - GAP - height >= VIEWPORT_MARGIN ? "top" : "bottom"

    let left = anchorRect.left + anchorRect.width / 2 - width / 2
    left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN),
    )

    const top =
      placement === "top" ? anchorRect.top - height - GAP : anchorRect.bottom + GAP

    setPosition({ top, left })
  }, [visibleNodeId, getAnchorEl])

  if (!mounted || !meta) return null

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      aria-live="polite"
      className="pointer-events-none fixed z-[9999] w-64 rounded-md border border-border bg-popover/95 px-3.5 py-3 shadow-lg backdrop-blur-sm transition-opacity duration-150 ease-out"
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        opacity: position ? 1 : 0,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-xs font-semibold tracking-wide text-foreground">
          {meta.label}
        </span>
        <span
          className={
            meta.isRoot
              ? "font-sans text-[11px] font-medium text-destructive"
              : "font-sans text-[11px] font-medium text-muted-foreground"
          }
        >
          {meta.isRoot ? "Root Gap" : `${meta.mastery}% mastery`}
        </span>
      </div>

      {meta.isRoot ? (
        <div className="mt-1.5 space-y-1">
          <p className="font-sans text-[12px] text-muted-foreground">
            Mastery: <span className="text-foreground">{meta.mastery}%</span>
          </p>
          <p className="font-sans text-[12px] text-muted-foreground">
            Exam exposure: <span className="text-foreground">{meta.examMarks} marks</span>
          </p>
          <p className="font-sans text-[12px] leading-snug text-muted-foreground">
            Likely misconception:{" "}
            <span className="text-foreground">&ldquo;{meta.misconception}&rdquo;</span>
          </p>
        </div>
      ) : (
        <div className="mt-1.5 space-y-1">
          {dependsOn.length > 0 && (
            <p className="font-sans text-[12px] text-muted-foreground">
              Depends on: <span className="text-foreground">{dependsOn.join(", ")}</span>
            </p>
          )}
          <p className="font-sans text-[12px] leading-snug text-muted-foreground">
            Why affected: {meta.summary}
          </p>
        </div>
      )}

      <button
        type="button"
        tabIndex={-1}
        className="pointer-events-none mt-2 inline-flex items-center gap-1 font-sans text-[11px] font-medium text-primary"
      >
        {meta.isRoot ? "Understand this topic" : "Explore topic"}
        <ArrowRight className="size-3" aria-hidden="true" />
      </button>
    </div>,
    document.body,
  )
}
