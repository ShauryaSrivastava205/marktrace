"use client"

import { useEffect, useState } from "react"

import { diagnoseResult as sampleDiagnose, reviewItems as sampleReview } from "@/lib/mockDiagnose"
import type { DiagnoseResult, ReviewItem } from "@/lib/mockDiagnose"
import { buildReviewItems, readSession } from "@/lib/session"
import { LoadingState, FallbackNotice } from "@/components/api-state"
import { AppHeader } from "@/components/app-header"
import { DiagnosticHero } from "./diagnostic-hero"
import { DiagnosisWorkspace } from "./diagnosis-workspace"
import { CoachCard } from "./coach-card"

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
      <AppHeader
        context={resolved?.diagnose.student_id}
        links={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/verify", label: "Verify" },
        ]}
      />

      <div className="mx-auto max-w-6xl space-y-12 px-6 py-10 sm:px-8 lg:space-y-14 lg:py-12">
        {!resolved ? (
          <LoadingState title="Loading your diagnosis…" />
        ) : (
          <>
            {resolved.isSample && (
              <FallbackNotice message="Showing sample data — take the diagnostic quiz to see your own diagnosis." />
            )}

            <DiagnosticHero diagnose={resolved.diagnose} />

            {/* Only a real diagnosis is coached: coaching the sample would
                congratulate someone on answers they never gave. */}
            {!resolved.isSample && <CoachCard diagnose={resolved.diagnose} />}

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
