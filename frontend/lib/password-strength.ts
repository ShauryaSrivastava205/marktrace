export type PasswordStrength = {
  score: 0 | 1 | 2 | 3
  label: "Too short" | "Weak" | "Medium" | "Strong"
}

/**
 * Simple heuristic scorer: rewards length and character-class variety.
 * Intentionally conservative — "Strong" requires real length, not just
 * one of every character class packed into 8 characters.
 */
export function scorePasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { score: 0, label: "Too short" }
  if (password.length < 8) return { score: 0, label: "Too short" }

  let variety = 0
  if (/[a-z]/.test(password)) variety++
  if (/[A-Z]/.test(password)) variety++
  if (/[0-9]/.test(password)) variety++
  if (/[^A-Za-z0-9]/.test(password)) variety++

  if (password.length >= 12 && variety >= 3) {
    return { score: 3, label: "Strong" }
  }

  if (password.length >= 10 && variety >= 2) {
    return { score: 2, label: "Medium" }
  }

  if (variety >= 2) {
    return { score: 2, label: "Medium" }
  }

  return { score: 1, label: "Weak" }
}
