// The live MarkTrace backend.
//
// Every endpoint is POST + JSON. The shapes here were checked against the
// deployed API, not assumed: see backend/app/main.py for the routes and
// backend/app/engine/models.py for the request bodies.
//
// The backend runs on Render's free tier, which sleeps after inactivity. The
// first request of a session therefore has to wake it, which has been measured
// at ~23s and can reach about a minute, so callers must show a loading state
// rather than appear frozen. COLD_START_HINT_MS is when a caller should start
// saying so; REQUEST_TIMEOUT_MS is when waiting stops being reasonable.

import type { DiagnoseResult } from "./mockDiagnose"
import type { GradeResult, TaskType, VerifyProbe } from "./mockVerify"
import type { Attempt } from "./attempt"

const API = process.env.NEXT_PUBLIC_API_URL || "https://marktrace.onrender.com"

/** Tell the user the server is waking once a request passes this. */
export const COLD_START_HINT_MS = 6_000

/** Generous enough for a cold start, short enough to fail before the tab does. */
export const REQUEST_TIMEOUT_MS = 90_000

export interface VerifyProbeRequest {
  root_concept_id: string
  downstream_concept_id: string
}

export interface VerifyAnswerInput {
  question_id: string
  task_type: TaskType
  selected: string
}

export interface VerifyGradeRequest {
  student_id: string
  root_concept_id: string
  downstream_concept_id: string
  answers: VerifyAnswerInput[]
}

/**
 * A failed call. `reachable` is the distinction the UI cares about: a 404 or a
 * 422 means the server answered and its answer stands, while a network failure
 * or a timeout means we never heard back and a dev fallback is defensible.
 */
export class ApiError extends Error {
  readonly status: number | null
  readonly reachable: boolean

  constructor(message: string, status: number | null, reachable: boolean) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.reachable = reachable
  }
}

function timeoutSignal(ms: number): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, done: () => clearTimeout(timer) }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const { signal, done } = timeoutSignal(REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    // Aborts, DNS failures, refused connections and CORS rejections all land
    // here, and none of them mean the server rendered a verdict.
    const timedOut = error instanceof DOMException && error.name === "AbortError"
    throw new ApiError(
      timedOut
        ? "The server took too long to respond."
        : "Could not reach the server. Check your connection and try again.",
      null,
      false,
    )
  } finally {
    done()
  }

  if (!response.ok) {
    // FastAPI puts the reason in `detail`; fall back to the status line.
    let detail: string | null = null
    try {
      const payload = (await response.json()) as { detail?: unknown }
      if (typeof payload.detail === "string") detail = payload.detail
    } catch {
      // A non-JSON error body tells us nothing extra.
    }
    throw new ApiError(
      detail ?? `The server returned ${response.status}.`,
      response.status,
      true,
    )
  }

  return (await response.json()) as T
}

/** POST /diagnose - the root-cause diagnosis for one attempt. */
export function postDiagnose(attempt: Attempt): Promise<DiagnoseResult> {
  return postJson<DiagnoseResult>("/diagnose", attempt)
}

/**
 * POST /verify/probe - the three probes for one root/downstream pair.
 * Named `get` because it reads; the endpoint takes its arguments in a body.
 * Responds 404 when no probe connects that pair.
 */
export function getVerifyProbe(request: VerifyProbeRequest): Promise<VerifyProbe> {
  return postJson<VerifyProbe>("/verify/probe", request)
}

/** POST /verify/grade - the verdict. Responds 422 if the answers are malformed. */
export function postVerifyGrade(request: VerifyGradeRequest): Promise<GradeResult> {
  return postJson<GradeResult>("/verify/grade", request)
}

export const API_BASE_URL = API
