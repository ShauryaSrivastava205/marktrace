"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { rootGapAffecting, type DiagnosisGraphNode } from "@/lib/diagnosis"
import type { DiagnoseResult } from "@/lib/mockDiagnose"
import { STATUS_STYLE, masteryLabel, statusLabel } from "../status"

interface HoverCardProps {
  node: DiagnosisGraphNode | null
  diagnose: DiagnoseResult
  getAnchorEl: (id: string) => HTMLElement | null
}

const DELAY = 140
const GAP = 12
const MARGIN = 8

/**
 * Relationship read-out for the hovered node. Rendered in a portal and
 * placed beside the node so it never covers the thing it describes.
 */
export function HoverCard({ node, diagnose, getAnchorEl }: HoverCardProps) {
  const [mounted, setMounted] = useState(false)
  const [visibleId, setVisibleId] = useState<string | null>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (!node) {
      setVisibleId(null)
      setPosition(null)
      return
    }
    timer.current = setTimeout(() => {
      setVisibleId(node.id)
      timer.current = null
    }, DELAY)

    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [node])

  const shown = node && visibleId === node.id ? node : null

  useLayoutEffect(() => {
    if (!shown) return
    const anchor = getAnchorEl(shown.id)
    const card = cardRef.current
    if (!anchor || !card) return

    const a = anchor.getBoundingClientRect()
    const { width, height } = card.getBoundingClientRect()

    // Prefer the right side, flip left, then fall back to above/below.
    let left = a.right + GAP
    if (left + width > window.innerWidth - MARGIN) left = a.left - width - GAP
    if (left < MARGIN) left = Math.min(Math.max(a.left, MARGIN), window.innerWidth - width - MARGIN)

    let top = a.top + a.height / 2 - height / 2
    top = Math.max(MARGIN, Math.min(top, window.innerHeight - height - MARGIN))

    setPosition({ top, left })
  }, [shown, getAnchorEl])

  if (!mounted || !shown) return null

  const gap = rootGapAffecting(shown.id, diagnose)
  const ownGap = diagnose.root_gaps.find((g) => g.concept_id === shown.id) ?? null
  const style = STATUS_STYLE[shown.status]

  return createPortal(
    <div
      ref={cardRef}
      role="tooltip"
      className="pointer-events-none fixed z-[9999] w-60 rounded-md border border-border bg-popover/97 p-3 shadow-lg backdrop-blur-sm transition-opacity duration-150"
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        opacity: position ? 1 : 0,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-sans text-[13px] font-semibold leading-tight text-foreground">
          {shown.name}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]",
            style.chip,
          )}
        >
          {statusLabel(shown.status, shown.evidence)}
        </span>
      </div>

      <p className="mt-1 font-sans text-[12px] tabular-nums text-muted-foreground">
        {masteryLabel(shown.masteryPct, shown.evidence)}
      </p>

      <dl className="mt-2.5 space-y-1.5 border-t border-border pt-2.5 text-[12px]">
        {gap && (
          <>
            <Row label="Depends on">{gap.name}</Row>
            <Row label="Why affected">
              Its prerequisite {gap.name} is a root gap.
            </Row>
          </>
        )}
        {ownGap && (
          <>
            <Row label="Evidence">
              {ownGap.affected_questions} incorrect question
              {ownGap.affected_questions === 1 ? "" : "s"}
            </Row>
            <Row label="Exam exposure">{ownGap.marks_associated} marks</Row>
          </>
        )}
        {!gap && !ownGap && (
          <p className="text-muted-foreground">Not linked to a root gap.</p>
        )}
      </dl>
    </div>,
    document.body,
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-2">
      <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </dt>
      <dd className="leading-snug text-foreground">{children}</dd>
    </div>
  )
}
