"use client"

import { motion, useReducedMotion } from "motion/react"

/**
 * Low-contrast floating gradient blobs behind the sign-up card. Purely
 * decorative — kept subtle so it never competes with the form, and disabled
 * for reduced-motion users (a static version still renders).
 */
export function AuroraBackground() {
  const reduceMotion = useReducedMotion()

  const blobs = [
    {
      className: "left-[-10%] top-[-15%] size-[32rem] bg-primary/10",
      animate: reduceMotion
        ? undefined
        : { x: [0, 30, -10, 0], y: [0, 20, 40, 0] },
      duration: 26,
    },
    {
      className: "right-[-15%] top-[10%] size-[26rem] bg-accent/10",
      animate: reduceMotion
        ? undefined
        : { x: [0, -25, 15, 0], y: [0, 30, -15, 0] },
      duration: 30,
    },
    {
      className: "bottom-[-20%] left-[20%] size-[28rem] bg-primary/[0.07]",
      animate: reduceMotion
        ? undefined
        : { x: [0, 20, -20, 0], y: [0, -25, 10, 0] },
      duration: 34,
    },
  ]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
          animate={blob.animate}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
