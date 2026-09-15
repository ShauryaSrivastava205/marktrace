import type { DiagnoseResult } from "./mockDiagnose"

/** Casing only — these are how the ids are written, not new information. */
const ACRONYMS = new Set(["dfs", "bfs", "dp"])

/** "divide_conquer" -> "Divide Conquer" — fallback for ids with no known display name. */
export function humanizeConceptId(id: string): string {
  return id
    .split("_")
    .map((part) =>
      ACRONYMS.has(part) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ")
}

/** Looks up a concept's display name from concept_mastery, falling back to a humanized id. */
export function resolveConceptName(id: string, diagnose: DiagnoseResult): string {
  return diagnose.concept_mastery.find((c) => c.concept_id === id)?.name ?? humanizeConceptId(id)
}
