"use client"

import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { ConceptGraph } from "@/components/auth/concept-graph/concept-graph"
import { RootGapMetrics } from "@/components/auth/root-gap-metrics"

export function GraphCard({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      className={cn(
        "rounded-md border border-border bg-card p-4 shadow-sm lg:p-5",
        className,
      )}
    >
      <div className="relative h-72 overflow-hidden rounded-md bg-grid-paper sm:h-80 lg:h-[clamp(280px,36vh,360px)]">
        <ConceptGraph />
      </div>
      <RootGapMetrics />
    </motion.div>
  )
}
