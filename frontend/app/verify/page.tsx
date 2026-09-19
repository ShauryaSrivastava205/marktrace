import type { Metadata } from "next"
import { Suspense } from "react"

import { LoadingState } from "@/components/api-state"
import { VerifyView } from "@/components/verify/verify-view"

export const metadata: Metadata = {
  title: "Verify — MarkTrace",
  description: "A three-question probe that tests whether the diagnosed root gap is the real cause.",
}

export default function VerifyPage() {
  return (
    // VerifyView reads the root/downstream pair from the query string, which
    // Next requires a Suspense boundary for.
    <Suspense
      fallback={
        <main className="min-h-screen bg-background bg-grid-paper">
          <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 lg:py-12">
            <LoadingState title="Loading your diagnosis…" />
          </div>
        </main>
      }
    >
      <VerifyView />
    </Suspense>
  )
}
