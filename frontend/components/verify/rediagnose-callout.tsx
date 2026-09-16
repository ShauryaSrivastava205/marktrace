"use client"

import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, Compass } from "lucide-react"

import type { Rediagnose } from "@/lib/mockVerify"

interface RediagnoseCalloutProps {
  rediagnose: Rediagnose
  focusName: string
  delay?: number
}

/**
 * Shown when the probe rules the root cause out. It is a next step in academic
 * blue, deliberately not the coral of a gap — nothing here is the student's failure.
 */
export function RediagnoseCallout({ rediagnose, focusName, delay = 0 }: RediagnoseCalloutProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: reduceMotion ? 0 : delay, ease: "easeOut" }}
      className="relative overflow-hidden rounded-md border border-primary/40 bg-primary/[0.04] shadow-sm"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-primary/70" />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Compass className="size-3.5 text-primary" aria-hidden="true" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Next step
          </p>
        </div>

        <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight text-foreground">
          Re-diagnose {focusName}
        </h2>

        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-foreground">
          This probe did its job: it ruled one cause out. {focusName} still has a gap, so the next
          diagnostic narrows in on it directly instead of assuming what sits underneath.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-primary/20 pt-4">
          <button
            type="button"
            disabled
            aria-describedby={`rediagnose-note-${rediagnose.focus_concept_id}`}
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-primary/45 bg-primary/10 px-4 py-2 text-sm font-medium text-primary opacity-70"
          >
            Re-diagnose {focusName}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <p
            id={`rediagnose-note-${rediagnose.focus_concept_id}`}
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
          >
            Coming next
          </p>
        </div>
      </div>
    </motion.section>
  )
}
