"use client"

import { useEffect, useState } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import { motion, useReducedMotion } from "motion/react"
import { Sparkles } from "lucide-react"

import type { DiagnoseResult } from "@/lib/mockDiagnose"
import { COLD_START_HINT_MS, coachRequestFrom, postCoach } from "@/lib/api"

type CoachState =
  | { kind: "thinking" }
  | { kind: "ready"; markdown: string }
  | { kind: "hidden" }

/**
 * Coach output is markdown from a model, so every element is styled here
 * rather than inheriting browser defaults. react-markdown does not render raw
 * HTML, which is what keeps model output from injecting markup.
 */
const MARKDOWN: Components = {
  p: ({ children }) => (
    <p className="text-[14px] leading-relaxed text-foreground [&:not(:first-child)]:mt-3">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-primary/60">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 marker:font-mono marker:text-[12px] marker:text-primary/70">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-[14px] leading-relaxed text-foreground">{children}</li>,
  h1: ({ children }) => <p className="mt-4 font-serif text-base font-semibold text-foreground first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mt-4 font-serif text-base font-semibold text-foreground first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mt-4 font-serif text-[15px] font-semibold text-foreground first:mt-0">{children}</p>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="font-medium text-primary underline underline-offset-4"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-muted/70 px-1 py-0.5 font-mono text-[12.5px]">{children}</code>
  ),
}

/**
 * Plain-language coaching for a diagnosis, from POST /coach.
 *
 * This is interpretation layered over a result that is already on screen, so
 * it must never stand in the diagnosis's way: it fetches on its own, and if
 * anything goes wrong - a failed request, an unconfigured coach, an empty
 * answer - the card removes itself instead of showing an error.
 */
export function CoachCard({ diagnose }: { diagnose: DiagnoseResult }) {
  const reduceMotion = useReducedMotion()
  const [state, setState] = useState<CoachState>({ kind: "thinking" })
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    let cancelled = false
    setState({ kind: "thinking" })
    setSlow(false)

    const hint = setTimeout(() => {
      if (!cancelled) setSlow(true)
    }, COLD_START_HINT_MS)

    postCoach(coachRequestFrom(diagnose))
      .then((response) => {
        if (cancelled) return
        const markdown = typeof response?.coaching === "string" ? response.coaching.trim() : ""
        setState(markdown ? { kind: "ready", markdown } : { kind: "hidden" })
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "hidden" })
      })
      .finally(() => clearTimeout(hint))

    return () => {
      cancelled = true
      clearTimeout(hint)
    }
  }, [diagnose])

  // Removed outright rather than animated out: an exit that fails to finish
  // would leave "thinking" on screen with nothing coming.
  if (state.kind === "hidden") return null

  const thinking = state.kind === "thinking"

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      aria-live="polite"
      aria-busy={thinking}
      className="relative overflow-hidden rounded-md border border-primary/30 bg-card shadow-sm"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-primary/70" />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <motion.span
            aria-hidden="true"
            className="flex text-primary"
            animate={thinking && !reduceMotion ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
            transition={thinking ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
          >
            <Sparkles className="size-3.5" />
          </motion.span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            AI Coach
          </p>
        </div>

        {thinking ? (
          <div>
            <h2 className="mt-2 font-serif text-xl font-semibold text-foreground">
              Coach is thinking…
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Reading your diagnosis to suggest what to work on first.
            </p>

            {/* Placeholder lines: something is being written, not stuck. */}
            <div className="mt-5 space-y-2.5" aria-hidden="true">
              {[92, 100, 78, 96, 60].map((width, i) => (
                <motion.div
                  key={i}
                  className="h-2.5 rounded-full bg-muted"
                  style={{ width: `${width}%` }}
                  animate={reduceMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>

            {slow && (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mt-5 border-t border-border pt-4 text-[13px] leading-relaxed text-muted-foreground"
              >
                Still thinking. The coach sleeps when idle, so a first request can take up
                to a minute — your diagnosis is complete and ready in the meantime.
              </motion.p>
            )}
          </div>
        ) : (
          <div>
            <h2 className="mt-2 font-serif text-xl font-semibold text-foreground">
              What to work on first
            </h2>

            <div className="mt-3 max-w-3xl">
              <ReactMarkdown components={MARKDOWN}>{state.markdown}</ReactMarkdown>
            </div>

            <p className="mt-5 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
              Written by AI from your diagnosis. It can be wrong — the diagnosis itself is the
              source of truth.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  )
}
