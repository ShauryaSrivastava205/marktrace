"use client"

import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

export function Headline({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={cn(className)}>
      <motion.h2
        initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="max-w-md font-serif text-2xl font-semibold leading-tight text-foreground lg:text-[clamp(1.5rem,2.6vh,2.25rem)]"
      >
        Find the concept behind the mistake.
      </motion.h2>
      <motion.p
        initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.22, ease: "easeOut" }}
        className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground lg:mt-1.5"
      >
        One hidden gap can explain many visible failures.
      </motion.p>
    </div>
  )
}
