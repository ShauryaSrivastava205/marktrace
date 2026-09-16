"use client"

import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { RootGapConfidence } from "@/lib/mockDiagnose"
import { isUpgrade } from "@/lib/verify"

interface TierStyle {
  chip: string
  dot: string
}

/** HIGH reads positive (teal), MEDIUM cautious (amber), LOW plain — never a colour that scolds. */
const TIER_STYLE: Record<RootGapConfidence, TierStyle> = {
  LOW: { chip: "border-border bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" },
  MEDIUM: { chip: "border-amber-500/45 bg-amber-500/[0.08] text-amber-700", dot: "bg-amber-500" },
  HIGH: { chip: "border-accent/45 bg-accent/[0.08] text-accent", dot: "bg-accent" },
}

interface ConfidenceBadgeProps {
  /** The tier the diagnosis carried before this probe. */
  previous: RootGapConfidence
  current: RootGapConfidence
  delay?: number
}

/**
 * Confidence is a tier word, not a score. This shows the move from the tier the
 * diagnosis arrived with to the one the probe leaves it at.
 */
export function ConfidenceBadge({ previous, current, delay = 0 }: ConfidenceBadgeProps) {
  const reduceMotion = useReducedMotion()
  const upgraded = isUpgrade(previous, current)

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Diagnosis confidence
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2.5">
        <motion.span
          initial={reduceMotion ? undefined : { opacity: 1 }}
          animate={{ opacity: upgraded ? 0.45 : 0.7 }}
          transition={{ duration: 0.3, delay: reduceMotion ? 0 : delay, ease: "easeOut" }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
            TIER_STYLE[previous].chip,
          )}
        >
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", TIER_STYLE[previous].dot)} />
          {previous}
          <span className="sr-only">confidence before this probe</span>
        </motion.span>

        <motion.span
          aria-hidden="true"
          initial={reduceMotion ? undefined : { opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, delay: reduceMotion ? 0 : delay + 0.1, ease: "easeOut" }}
          className="flex text-muted-foreground"
        >
          <ArrowRight className="size-4" />
        </motion.span>

        <motion.span
          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 420, damping: 26, delay: delay + 0.18 }
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.1em]",
            TIER_STYLE[current].chip,
          )}
        >
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", TIER_STYLE[current].dot)} />
          {current}
          <span className="sr-only">confidence after this probe</span>
        </motion.span>

        <motion.span
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: reduceMotion ? 0 : delay + 0.32, ease: "easeOut" }}
          className="text-[12px] text-muted-foreground"
        >
          {upgraded ? "upgraded by this probe" : "unchanged by this probe"}
        </motion.span>
      </div>
    </div>
  )
}
