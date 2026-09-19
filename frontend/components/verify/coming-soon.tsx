"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowLeft, Compass } from "lucide-react"

/**
 * Shown when the bank has no probe for this concept yet.
 *
 * Only some concepts have verification probes, and asking for one that does
 * not exist is a gap in the content, not a fault of the student or a failure
 * of the app. It is framed as something still to come, not as an error.
 */
export function VerificationComingSoon({ conceptName }: { conceptName: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      className="relative overflow-hidden rounded-md border border-primary/40 bg-primary/[0.04] shadow-sm"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-primary/70" />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Compass className="size-3.5 text-primary" aria-hidden="true" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Coming soon
          </p>
        </div>

        <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight text-foreground">
          Verification for {conceptName} is coming soon
        </h2>

        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-foreground">
          Verification probes exist for some concepts so far. {conceptName} is not one of them
          yet — the diagnosis above still stands, it just has not been re-tested.
        </p>

        <div className="mt-5 border-t border-primary/20 pt-4">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 rounded-md border border-primary/45 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to the diagnosis
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
