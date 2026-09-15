import type { Metadata } from "next"
import Link from "next/link"
import { LogOut } from "lucide-react"

import { diagnoseResult, reviewItems } from "@/lib/mockDiagnose"
import { DiagnosticHero } from "@/components/results/diagnostic-hero"
import { DiagnosisWorkspace } from "@/components/results/diagnosis-workspace"

export const metadata: Metadata = {
  title: "Diagnosis — MarkTrace",
  description: "Root-cause diagnosis of the concept gaps behind a student's exam mistakes.",
}

export default function ResultsPage() {
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
            {diagnoseResult.student_id}
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

      <div className="mx-auto max-w-6xl space-y-12 px-6 py-10 sm:px-8 lg:space-y-14 lg:py-12">
        <DiagnosticHero diagnose={diagnoseResult} />

        <DiagnosisWorkspace diagnose={diagnoseResult} reviewItems={reviewItems} />
      </div>
    </main>
  )
}
