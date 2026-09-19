"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, LogOut, Network } from "lucide-react"

import { readAuthUser } from "@/lib/auth"

/** "ada@example.com" -> "ada" - a usable greeting when no name was given. */
function greetingFor(name: string | undefined, email: string): string {
  if (name) return name
  const local = email.split("@")[0] ?? ""
  return local.length > 0 ? local : email
}

/**
 * The launcher users land on after logging in. Deliberately thin: it names the
 * product, points at the diagnostic, and gets out of the way.
 */
export function DashboardView() {
  const reduceMotion = useReducedMotion()
  // localStorage is not readable while the server renders, so the greeting can
  // only appear after mount. Until then the heading simply carries no name.
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    const user = readAuthUser()
    if (user) setGreeting(greetingFor(user.name, user.email))
  }, [])

  const step = (delay: number) => ({
    initial: reduceMotion ? undefined : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.42, delay: reduceMotion ? 0 : delay, ease: "easeOut" as const },
  })

  return (
    <main className="min-h-screen bg-background bg-grid-paper">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur-sm sm:px-8">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground"
          >
            M
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            MarkTrace
          </span>
        </div>

        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-14 sm:px-8 lg:py-20">
        <motion.div {...step(0)} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            {greeting ? `Welcome back, ${greeting}` : "Student workspace"}
          </p>
        </motion.div>

        <motion.h1
          {...step(0.08)}
          className="mt-2 max-w-2xl font-serif text-[1.75rem] font-semibold leading-[1.15] text-foreground sm:text-4xl"
        >
          Find the one concept behind your scattered mistakes
        </motion.h1>

        <motion.p
          {...step(0.12)}
          className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground"
        >
          A short diagnostic traces what you got wrong back through the concept graph,
          so you repair the cause instead of the symptoms.
        </motion.p>

        <motion.div {...step(0.18)} className="mt-8">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Start DSA Diagnostic
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>

          <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            9 questions · no time limit
          </p>
        </motion.div>

        <motion.div {...step(0.26)} className="mt-12 border-t border-border pt-6">
          <Link
            href="/results"
            className="group flex items-start gap-3 rounded-md border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary"
            >
              <Network className="size-4" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 font-serif text-base font-semibold text-foreground">
                Explore the concept map
                <ArrowRight
                  className="size-3.5 text-primary transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                See how the concepts depend on each other. Opens a sample diagnosis until
                you have taken the diagnostic.
              </span>
            </span>
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
