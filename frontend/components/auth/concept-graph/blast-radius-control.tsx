"use client"

import { useEffect, useState } from "react"
import { motion, animate } from "motion/react"
import { RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { AFFECTED_CONCEPT_COUNT } from "./data"
import { useGraphInteraction } from "./graph-context"

interface BlastRadiusControlProps {
  active: boolean
  complete: boolean
  revealedCount: number
  onTrigger: () => void
}

export function BlastRadiusControl({ active, complete, revealedCount, onTrigger }: BlastRadiusControlProps) {
  const { reducedMotion } = useGraphInteraction()
  const [wasTriggered, setWasTriggered] = useState(false)
  const [displayCount, setDisplayCount] = useState(0)

  useEffect(() => {
    if (!complete) {
      setDisplayCount(0)
      return
    }
    if (reducedMotion) {
      setDisplayCount(AFFECTED_CONCEPT_COUNT)
      return
    }
    const controls = animate(0, AFFECTED_CONCEPT_COUNT, {
      duration: 0.4,
      ease: "easeOut",
      onUpdate: (value) => setDisplayCount(Math.round(value)),
    })
    return () => controls.stop()
  }, [complete, reducedMotion])

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <motion.button
        type="button"
        onClick={() => {
          setWasTriggered(true)
          onTrigger()
        }}
        whileHover={reducedMotion ? undefined : { y: -1.5 }}
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "group/blast font-sans text-[15px] font-medium tracking-wide rounded-md border border-border bg-card px-3.5 py-2 text-muted-foreground shadow-sm transition-colors duration-150 hover:border-primary/40 hover:text-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active && "border-primary/50 text-foreground",
        )}
      >
        <span className="inline-flex items-center gap-2">
          {complete && (
            <RotateCcw
              className="size-3.5 transition-transform duration-150 ease-out group-hover/blast:-rotate-45"
              aria-hidden="true"
            />
          )}
          {complete ? "Replay Blast Radius" : "Show Blast Radius"}
        </span>
      </motion.button>
      {wasTriggered && (
        <span
          className="font-sans text-[13px] font-medium text-muted-foreground transition-opacity duration-200"
          style={{ opacity: revealedCount > 0 ? 1 : 0 }}
          aria-live="polite"
        >
          {complete
            ? `1 root gap → ${displayCount} affected concepts`
            : "Tracing dependencies…"}
        </span>
      )}
    </div>
  )
}
