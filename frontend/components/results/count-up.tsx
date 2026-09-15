"use client"

import { useEffect, useState } from "react"
import { animate, useReducedMotion } from "motion/react"

interface CountUpProps {
  value: number
  duration?: number
  delay?: number
}

/** Counts from 0 to the real value. Reduced motion jumps straight to it. */
export function CountUp({ value, duration = 0.85, delay = 0 }: CountUpProps) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value)
      return
    }

    setDisplay(0)
    const controls = animate(0, value, {
      duration,
      delay,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    })

    // The tween runs on animation frames, which a backgrounded tab may never
    // get. The real figure must not depend on that, so settle it regardless.
    const settle = setTimeout(
      () => setDisplay(value),
      (delay + duration) * 1000 + 300,
    )

    return () => {
      controls.stop()
      clearTimeout(settle)
    }
  }, [value, duration, delay, reduceMotion])

  return <>{display}</>
}
