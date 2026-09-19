"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { LogOut } from "lucide-react"

import { diagnoseResult as sampleDiagnose } from "@/lib/mockDiagnose"
import type { DiagnoseResult } from "@/lib/mockDiagnose"
import { readSession } from "@/lib/session"
import { chooseVerifyTarget, targetFromParams, type VerifyTarget } from "@/lib/verify"
import { resolveConceptName } from "@/lib/conceptNames"
import { LoadingState, ErrorState, FallbackNotice } from "@/components/api-state"
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
