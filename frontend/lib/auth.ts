export type LoginCredentials = {
  email: string
  password: string
  rememberMe: boolean
}

export type LoginResult =
  | { success: true }
  | { success: false; error: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Mock authentication for the frontend-only phase of MarkTrace.
 *
 * This function intentionally mirrors the shape of a real network call so it
 * can be swapped for a call to the FastAPI backend (`POST /api/auth/login`)
 * without touching any presentation code:
 *
 *   const response = await fetch("/api/auth/login", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(credentials),
 *   })
 */
export async function mockLogin(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  // Simulate network latency so the UI's loading state is exercised.
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (!EMAIL_PATTERN.test(credentials.email)) {
    return { success: false, error: "Enter a valid email address." }
  }

  if (credentials.password.length === 0) {
    return { success: false, error: "Password cannot be empty." }
  }

  return { success: true }
}
