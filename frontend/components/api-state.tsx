"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { AlertTriangle, RotateCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { COLD_START_HINT_MS } from "@/lib/api"

/**
 * A waiting state that keeps explaining itself. The backend sleeps on Render's
 * free tier, so a first request can sit for most of a minute; silence for that
 * long reads as a broken page, and a spinner alone does not tell the user that
 * waiting is the right thing to do.
 */
export function LoadingState({
  title,
  detail,
  className,
}: {
  title: string
  detail?: string
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), COLD_START_HINT_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      className={cn("py-10", className)}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-2">
        <motion.span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-primary"
          animate={reduceMotion ? undefined : { opacity: [1, 0.25, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Working
        </p>
      </div>

      <h1 className="mt-2 max-w-3xl font-serif text-[1.75rem] font-semibold leading-[1.15] text-foreground sm:text-3xl">
        {title}
      </h1>

      {detail && (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {detail}
        </p>
      )}

      {/* An indeterminate track: there is no progress to report, only motion. */}
      <div className="mt-6 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full w-1/3 rounded-full bg-primary"
          animate={reduceMotion ? { x: 0 } : { x: ["-100%", "300%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <AnimatePresence>
        {slow && (
          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-4 max-w-2xl text-[13px] leading-relaxed text-muted-foreground"
          >
            Still going. The server sleeps when it is idle, so the first request
            of a session has to wake it — this can take up to a minute.
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  )
}

/** A failure the user can do something about. */
export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = "Try again",
  children,
  className,
}: {
  title: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  children?: React.ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-card shadow-sm",
        className,
      )}
      role="alert"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-amber-500/70" />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-3.5 text-amber-600" aria-hidden="true" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
            Could not load
          </p>
        </div>

        <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight text-foreground">
          {title}
        </h2>

        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-foreground">{message}</p>

        {(onRetry || children) && (
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <RotateCw className="size-4" aria-hidden="true" />
                {retryLabel}
              </button>
            )}
            {children}
          </div>
        )}
      </div>
    </motion.section>
  )
}

/** Marks a screen that is showing bundled sample data instead of a live answer. */
export function FallbackNotice({ message }: { message: string }) {
  return (
    <p className="mb-6 inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/[0.06] px-3 py-1.5 text-[13px] text-amber-700">
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}
