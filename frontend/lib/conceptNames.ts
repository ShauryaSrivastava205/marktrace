import type { DiagnoseResult } from "./mockDiagnose"

/** "divide_conquer" -> "Divide Conquer" — fallback for ids with no known display name. */
export function humanizeConceptId(id: string): string {
  return id
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/** Looks up a concept's display name from concept_mastery, falling back to a humanized id. */
export function resolveConceptName(id: string, diagnose: DiagnoseResult): string {
  return diagnose.concept_mastery.find((c) => c.concept_id === id)?.name ?? humanizeConceptId(id)
}
