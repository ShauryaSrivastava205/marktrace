"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LogOut } from "lucide-react"

import { diagnoseResult as sampleDiagnose, reviewItems as sampleReview } from "@/lib/mockDiagnose"
import type { DiagnoseResult, ReviewItem } from "@/lib/mockDiagnose"
import { buildReviewItems, readSession } from "@/lib/session"
import { LoadingState, FallbackNotice } from "@/components/api-state"
import { DiagnosticHero } from "./diagnostic-hero"
import { DiagnosisWorkspace } from "./diagnosis-workspace"

interface Resolved {
  diagnose: DiagnoseResult
  reviewItems: ReviewItem[]
  /** True when this is bundled sample data rather than a real diagnosis. */
  isSample: boolean
}

/**
 * Renders the diagnosis the quiz stored. sessionStorage is not readable while
 * the server renders, so the real payload can only be picked up after mount;
 * until then this shows a waiting state rather than flashing sample data that
 * would then be replaced.
 */
export function ResultsView() {
  const [resolved, setResolved] = useState<Resolved | null>(null)

  useEffect(() => {
    const session = readSession()
    setResolved(
      session
        ? {
            diagnose: session.diagnose,
            reviewItems: buildReviewItems(session.picks),
            isSample: false,
          }
        : { diagnose: sampleDiagnose, reviewItems: sampleReview, isSample: true },
    )
  }, [])

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
          {resolved && (
            <span className="ml-3 hidden border-l border-border pl-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground sm:inline">
              {resolved.diagnose.student_id}
            </span>
          )}
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/verify"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Verify
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

      <div className="mx-auto max-w-6xl space-y-12 px-6 py-10 sm:px-8 lg:space-y-14 lg:py-12">
        {!resolved ? (
          <LoadingState title="Loading your diagnosis…" />
        ) : (
          <>
            {resolved.isSample && (
              <FallbackNotice message="Showing sample data — take the diagnostic quiz to see your own diagnosis." />
            )}

            <DiagnosticHero diagnose={resolved.diagnose} />

            <DiagnosisWorkspace
              diagnose={resolved.diagnose}
              reviewItems={resolved.reviewItems}
            />
          </>
        )}
      </div>
    </main>
  )
}
