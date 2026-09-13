"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion, animate } from "motion/react"

/**
 * Root-gap / blast-radius readout shown beneath the concept graph. The
 * dependent-concept count animates from 0 on load to reinforce that this is
 * a live diagnostic reading, not a static stat card.
 */
export function RootGapMetrics() {
  const reduceMotion = useReducedMotion()
  const [count, setCount] = useState(reduceMotion ? 4 : 0)

  useEffect(() => {
    if (reduceMotion) return
    const controls = animate(0, 4, {
      duration: 0.8,
      delay: 0.85,
      ease: "easeOut",
      onUpdate: (value) => setCount(Math.round(value)),
    })
    return () => controls.stop()
  }, [reduceMotion])

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
      className="mt-3 grid grid-cols-2 gap-6 border-t border-border pt-3 lg:mt-2.5 lg:pt-2.5"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-medium uppercase tracking-wider text-muted-foreground">
            Root gap
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            Detected
          </span>
        </div>
        <p className="mt-1 font-serif text-[22px] font-semibold text-primary">
          Recursion
        </p>
      </div>
      <div>
        <p className="text-[14px] font-medium uppercase tracking-wider text-muted-foreground">
          Blast radius
        </p>
        <p className="mt-1 flex items-baseline gap-1.5 font-serif text-[20px] font-semibold text-foreground">
          {count}
          <span className="font-sans text-[16px] font-normal text-muted-foreground">
            dependent concepts
          </span>
        </p>
      </div>
    </motion.div>
  )
}
