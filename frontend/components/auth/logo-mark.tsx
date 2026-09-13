"use client"

import { motion, useReducedMotion } from "motion/react"

/**
 * MarkTrace wordmark with a small traced-graph symbol: three nodes joined by
 * paths, echoing the concept dependency graph that is the product's core
 * visual identity.
 */
export function LogoMark() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        role="img"
        aria-label="MarkTrace logo"
      >
        <motion.path
          d="M7 21 L15 9 L23 21"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={1.6}
          strokeLinecap="round"
          initial={reduceMotion ? undefined : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.line
          x1="15"
          y1="9"
          x2="15"
          y2="21"
          stroke="var(--color-accent)"
          strokeWidth={1.6}
          strokeLinecap="round"
          initial={reduceMotion ? undefined : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
        />
        {[
          [15, 9],
          [7, 21],
          [23, 21],
          [15, 21],
        ].map(([cx, cy], i) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={i === 0 ? 3.4 : 2.4}
            className={i === 0 ? "fill-primary" : "fill-accent"}
            initial={reduceMotion ? undefined : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.35,
              delay: 0.15 + i * 0.1,
              ease: "backOut",
            }}
            style={{ originX: "center", originY: "center" }}
          />
        ))}
      </svg>
      <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
        MarkTrace
      </span>
    </div>
  )
}
