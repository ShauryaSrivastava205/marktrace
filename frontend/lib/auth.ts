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

export type SignupCredentials = {
  fullName: string
  email: string
  password: string
}

export type SignupResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Mock registration for the frontend-only phase of MarkTrace. Mirrors
 * `mockLogin` so it can later be swapped for a call to the FastAPI backend
 * (`POST /api/auth/signup`) without touching any presentation code.
 */
export async function mockSignup(
  credentials: SignupCredentials,
): Promise<SignupResult> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (credentials.fullName.trim().length === 0) {
    return { success: false, error: "Enter your full name." }
  }

  if (!EMAIL_PATTERN.test(credentials.email)) {
    return { success: false, error: "Enter a valid email address." }
  }

  if (credentials.password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." }
  }

  return { success: true }
}

/**
 * Who is signed in, for greeting purposes only.
 *
 * Auth is still mock, so there is no session and nothing here is a credential
 * or a claim of identity - it is the name the person typed at signup, kept so
 * the dashboard can greet them. It lives in localStorage because there is no
 * server to ask. Replace this with the real session when auth lands.
 */
export type AuthUser = {
  /** Only known when the person signed up in this browser. */
  name?: string
  email: string
}

const USER_STORAGE_KEY = "marktrace.user"

export function readAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    return typeof parsed?.email === "string" ? parsed : null
  } catch {
    return null
  }
}

export function storeAuthUser(user: AuthUser): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } catch {
    // Blocked storage just means no greeting; never worth failing a login over.
  }
}

/**
 * Records a login. Signing in only proves an email, so a name from an earlier
 * signup is kept when it belongs to that same email and dropped when it does
 * not - better no greeting than someone else's name.
 */
export function storeLoggedInUser(email: string): void {
  const existing = readAuthUser()
  storeAuthUser(
    existing && existing.email === email && existing.name
      ? { name: existing.name, email }
      : { email },
  )
}
