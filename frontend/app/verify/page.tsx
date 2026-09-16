import type { Metadata } from "next"
import Link from "next/link"
import { LogOut } from "lucide-react"

import { resolveConceptName } from "@/lib/conceptNames"
import { diagnoseResult } from "@/lib/mockDiagnose"
import { gradeOutcomes, verifyProbe } from "@/lib/mockVerify"
import { VerifyFlow } from "@/components/verify/verify-flow"

export const metadata: Metadata = {
  title: "Verify — MarkTrace",
  description: "A three-question probe that tests whether the diagnosed root gap is the real cause.",
}

/** Every concept id the probe or any verdict can name, resolved once on the server. */
function conceptNameMap(): Record<string, string> {
  const ids = new Set<string>([
    verifyProbe.root_concept_id,
    ...verifyProbe.questions.map((q) => q.concept_id),
    ...Object.values(gradeOutcomes).flatMap((outcome) => [
      outcome.root_concept_id,
      ...(outcome.rediagnose ? [outcome.rediagnose.focus_concept_id] : []),
    ]),
  ])

  return Object.fromEntries([...ids].map((id) => [id, resolveConceptName(id, diagnoseResult)]))
}

export default function VerifyPage() {
  const rootGap = diagnoseResult.root_gaps.find(
    (gap) => gap.concept_id === verifyProbe.root_concept_id,
  )

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

        <div className="flex items-center gap-5">
          <Link
            href="/results"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Diagnosis
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 lg:py-12">
        <VerifyFlow
          probe={verifyProbe}
          conceptNames={conceptNameMap()}
          previousConfidence={rootGap?.confidence ?? "LOW"}
        />
      </div>
    </main>
  )
}
