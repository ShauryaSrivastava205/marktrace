import type { Metadata } from "next"

import { ResultsView } from "@/components/results/results-view"

export const metadata: Metadata = {
  title: "Diagnosis — MarkTrace",
  description: "Root-cause diagnosis of the concept gaps behind a student's exam mistakes.",
}

export default function ResultsPage() {
  return <ResultsView />
}
