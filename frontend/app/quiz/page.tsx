import type { Metadata } from "next"
import Link from "next/link"
import { LogOut } from "lucide-react"

import { resolveConceptName } from "@/lib/conceptNames"
import { diagnoseResult } from "@/lib/mockDiagnose"
import { diagnosticQuestions, questionBank } from "@/lib/questionBank"
import { QuizFlow } from "@/components/quiz/quiz-flow"

export const metadata: Metadata = {
  title: "Diagnostic quiz — MarkTrace",
  description:
    "A short diagnostic across the core DSA concepts, used to trace mistakes back to their root cause.",
}

/** Display names for every concept the diagnostic touches. */
function conceptNameMap(): Record<string, string> {
  const ids = new Set(diagnosticQuestions.map((q) => q.concept_id))
  return Object.fromEntries([...ids].map((id) => [id, resolveConceptName(id, diagnoseResult)]))
}

export default function QuizPage() {
  const totalMarks = diagnosticQuestions.reduce((sum, q) => sum + q.marks, 0)
  const conceptCount = new Set(diagnosticQuestions.map((q) => q.concept_id)).size

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
          <span className="ml-3 hidden border-l border-border pl-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground sm:inline">
            {questionBank.subject} · bank v{questionBank.bank_version}
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

      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8 lg:py-12">
        <section className="mb-8">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Diagnostic quiz
            </p>
          </div>

          <h1 className="mt-2 font-serif text-[1.75rem] font-semibold leading-[1.15] text-foreground sm:text-4xl">
            {diagnosticQuestions.length} questions across {conceptCount} concepts
          </h1>

          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Answer as best you can — this is not scored for a grade. What each wrong answer
            has in common is what the diagnosis traces back to a root cause.
          </p>

          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {totalMarks} marks total · no time limit
          </p>
        </section>

        <QuizFlow questions={diagnosticQuestions} conceptNames={conceptNameMap()} />
      </div>
    </main>
  )
}
