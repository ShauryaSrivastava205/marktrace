"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { diagnoseResult as sampleDiagnose } from "@/lib/mockDiagnose"
import type { DiagnoseResult } from "@/lib/mockDiagnose"
import { readSession } from "@/lib/session"
import { chooseVerifyTarget, targetFromParams, type VerifyTarget } from "@/lib/verify"
import { resolveConceptName } from "@/lib/conceptNames"
import { LoadingState, ErrorState, FallbackNotice } from "@/components/api-state"
import { AppHeader } from "@/components/app-header"
import { VerifyFlow } from "./verify-flow"
import { VerificationComingSoon } from "./coming-soon"

interface Resolved {
  diagnose: DiagnoseResult
  target: VerifyTarget | null
  /** The concept the link asked about, even when no target could be built. */
  requestedConceptId: string | null
  isSample: boolean
}

/**
 * Decides what this session has to verify, then hands it to VerifyFlow.
 *
 * A "Verify this gap" link names the pair in the query string; without one the
 * leading root gap is used. Either way both concepts trace back to the stored
 * diagnosis, so the probe tests the claim this student actually received.
 */
export function VerifyView() {
  const searchParams = useSearchParams()
  const requestedRoot = searchParams.get("root")
  const requestedDownstream = searchParams.get("downstream")
  const [resolved, setResolved] = useState<Resolved | null>(null)

  useEffect(() => {
    const session = readSession()
    const diagnose = session?.diagnose ?? sampleDiagnose
    setResolved({
      diagnose,
      target: requestedRoot
        ? targetFromParams(diagnose, requestedRoot, requestedDownstream)
        : chooseVerifyTarget(diagnose),
      requestedConceptId: requestedRoot,
      isSample: !session,
    })
  }, [requestedRoot, requestedDownstream])

  return (
    <main className="min-h-screen bg-background bg-grid-paper">
      <AppHeader
        context={resolved?.diagnose.student_id}
        links={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/results", label: "Diagnosis" },
        ]}
      />

      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 lg:py-12">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to Dashboard
        </Link>

        {!resolved ? (
          <LoadingState title="Loading your diagnosis…" />
        ) : (
          <>
            {resolved.isSample && (
              <FallbackNotice message="No diagnosis in this session — verifying the sample one. Take the quiz to verify your own." />
            )}

            {resolved.target ? (
              <VerifyFlow
                diagnose={resolved.diagnose}
                target={resolved.target}
                studentId={resolved.diagnose.student_id}
              />
            ) : resolved.requestedConceptId ? (
              <VerificationComingSoon
                conceptName={resolveConceptName(resolved.requestedConceptId, resolved.diagnose)}
              />
            ) : (
              <ErrorState
                title="There is nothing to verify yet"
                message="This diagnosis does not name a root gap that explains another concept, so there is no causal claim for a probe to test."
              >
                <Link
                  href="/quiz"
                  className="text-[13px] font-medium text-primary underline-offset-4 transition-colors hover:underline"
                >
                  Take the diagnostic quiz
                </Link>
              </ErrorState>
            )}
          </>
        )}
      </div>
    </main>
  )
}
