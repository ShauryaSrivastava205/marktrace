"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Compass,
  LogOut,
  Network,
  Sparkles,
  Target,
} from "lucide-react"

import { readAuthUser } from "@/lib/auth"

function greetingFor(name: string | undefined, email: string): string {
  if (name) return name
  const local = email.split("@")[0] ?? ""
  return local.length > 0 ? local : email
}

export function DashboardView() {
  const reduceMotion = useReducedMotion()
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    const user = readAuthUser()
    if (user) setGreeting(greetingFor(user.name, user.email))
  }, [])

  const step = (delay: number) => ({
    initial: reduceMotion ? undefined : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.42,
      delay: reduceMotion ? 0 : delay,
      ease: "easeOut" as const,
    },
  })

  return (
    <main className="min-h-screen bg-background bg-grid-paper">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur-sm sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground"
          >
            M
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            MarkTrace
          </span>
        </Link>

        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8 lg:py-16">
        <motion.div {...step(0)} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            {greeting ? `Welcome back, ${greeting}` : "Your learning workspace"}
          </p>
        </motion.div>

        <motion.h1
          {...step(0.06)}
          className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl"
        >
          Every learning goal deserves a clear path.
        </motion.h1>

        <motion.p
          {...step(0.12)}
          className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base"
        >
          Find the concepts behind your mistakes, or build a guided roadmap
          that turns what you want to achieve into what you should do next.
        </motion.p>

        <motion.div
          {...step(0.18)}
          className="mt-10 grid gap-5 md:grid-cols-2"
        >
          <section className="group flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md sm:p-7">
            <div className="flex items-start justify-between">
              <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <BrainCircuit className="size-5" aria-hidden="true" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Path 01
              </span>
            </div>

            <h2 className="mt-6 font-serif text-xl font-semibold text-foreground sm:text-2xl">
              Diagnose My Knowledge
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Stop guessing what went wrong. Trace incorrect answers to
              potential prerequisite gaps and discover which concepts deserve
              your attention.
            </p>

            <ul className="mt-5 space-y-2.5 text-sm text-foreground/80">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                Identify potential conceptual gaps
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                Explore relationships between concepts
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                Focus revision on the underlying cause
              </li>
            </ul>

            <div className="mt-auto pt-7">
              <Link
                href="/quiz"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Start DSA Diagnostic
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                9 questions · No time limit
              </p>
            </div>
          </section>

          <section className="group relative flex flex-col overflow-hidden rounded-lg border border-primary/30 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-md sm:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/5 blur-3xl"
            />

            <div className="relative flex items-start justify-between">
              <span className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Compass className="size-5" aria-hidden="true" />
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-primary">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Path 02
              </span>
            </div>

            <h2 className="relative mt-6 font-serif text-xl font-semibold text-foreground sm:text-2xl">
              Build My Learning Roadmap
            </h2>

            <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
              Turn your goal into a structured learning journey with ordered
              milestones, curated resources, hands-on practice and clear
              completion criteria.
            </p>

            <ul className="relative mt-5 space-y-2.5 text-sm text-foreground/80">
              <li className="flex items-start gap-2">
                <Target className="mt-0.5 size-4 shrink-0 text-primary" />
                Start from your current level and target
              </li>
              <li className="flex items-start gap-2">
                <Target className="mt-0.5 size-4 shrink-0 text-primary" />
                Know what to study and practise next
              </li>
              <li className="flex items-start gap-2">
                <Target className="mt-0.5 size-4 shrink-0 text-primary" />
                Track milestones as you make progress
              </li>
            </ul>

            <div className="relative mt-auto pt-7">
              <Link
                href="/roadmap"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Build My Roadmap
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                Personalised · Milestone-driven
              </p>
            </div>
          </section>
        </motion.div>

        <motion.div
          {...step(0.26)}
          className="mt-8 border-t border-border pt-6"
        >
          <Link
            href="/results"
            className="group flex items-start gap-3 rounded-md border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 sm:p-5"
          >
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Network className="size-4" aria-hidden="true" />
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
                Explore how concepts connect. Until you complete a diagnostic,
                this opens the sample diagnosis.
              </span>
            </span>
          </Link>
        </motion.div>

        <motion.p
          {...step(0.3)}
          className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
        >
          Understand · Plan · Practise · Verify · Progress
        </motion.p>
      </div>
    </main>
  )
}