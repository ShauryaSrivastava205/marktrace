"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  User,
  Check,
  X,
  ArrowRight,
} from "lucide-react"
import { motion, useAnimation, useReducedMotion, AnimatePresence } from "motion/react"

import { mockSignup, storeAuthUser } from "@/lib/auth"
import { scorePasswordStrength } from "@/lib/password-strength"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

const STRENGTH_COLOR = [
  "bg-border",
  "bg-destructive",
  "bg-amber-500",
  "bg-accent",
] as const

function ValidityIcon({ show, valid }: { show: boolean; valid: boolean }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {show && (
        <motion.span
          key={valid ? "valid" : "invalid"}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={
            valid
              ? "flex shrink-0 items-center justify-center text-accent"
              : "flex shrink-0 items-center justify-center text-destructive"
          }
        >
          {valid ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <X className="size-4" aria-hidden="true" />
          )}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

export function SignupForm() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const shakeControls = useAnimation()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameValid = fullName.trim().length > 0
  const emailValid = EMAIL_PATTERN.test(email)
  const passwordValid = password.length >= MIN_PASSWORD_LENGTH
  const confirmValid = confirmPassword.length > 0 && confirmPassword === password

  const strength = useMemo(() => scorePasswordStrength(password), [password])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!nameValid || !emailValid || !passwordValid || !confirmValid) {
      setError(
        !confirmValid && password.length > 0 && passwordValid
          ? "Passwords do not match."
          : "Fill in every field correctly before continuing.",
      )
      if (!reduceMotion) {
        shakeControls.start({
          x: [0, -8, 8, -6, 6, -3, 3, 0],
          transition: { duration: 0.45, ease: "easeInOut" },
        })
      }
      return
    }

    setIsSubmitting(true)

    const result = await mockSignup({ fullName, email, password })

    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      if (!reduceMotion) {
        shakeControls.start({
          x: [0, -8, 8, -6, 6, -3, 3, 0],
          transition: { duration: 0.45, ease: "easeInOut" },
        })
      }
      return
    }

    storeAuthUser({ name: fullName.trim(), email })
    setIsSuccess(true)
    setTimeout(() => router.push("/dashboard"), reduceMotion ? 200 : 650)
  }

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
    <motion.form
      onSubmit={handleSubmit}
      animate={shakeControls}
      className="space-y-5 lg:space-y-[clamp(1rem,2.6vh,1.5rem)]"
    >
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="space-y-1.5"
      >
        <h1 className="text-2xl font-serif font-semibold text-foreground lg:text-[clamp(1.375rem,2.6vh,1.5rem)]">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start tracing mistakes back to the concept behind them.
        </p>
      </motion.div>

      <div className="space-y-4 lg:space-y-[clamp(0.75rem,1.9vh,1.1rem)]">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="space-y-1.5"
        >
          <Label
            htmlFor="fullName"
            className="text-sm font-medium text-muted-foreground transition-colors has-focus-within:text-primary"
          >
            Full name
          </Label>
          <div className="focus-glow flex items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 transition-colors hover:border-foreground/30">
            <User
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
            />
            <ValidityIcon show={fullName.length > 0} valid={nameValid} />
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
          className="space-y-1.5"
        >
          <Label
            htmlFor="email"
            className="text-sm font-medium text-muted-foreground transition-colors has-focus-within:text-primary"
          >
            Email
          </Label>
          <div className="focus-glow flex items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 transition-colors hover:border-foreground/30">
            <Mail
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
            />
            <ValidityIcon show={email.length > 0} valid={emailValid} />
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          className="space-y-1.5"
        >
          <Label
            htmlFor="password"
            className="text-sm font-medium text-muted-foreground transition-colors has-focus-within:text-primary"
          >
            Password
          </Label>
          <div className="focus-glow flex items-center gap-2 rounded-lg border border-input bg-transparent pl-2.5 transition-colors hover:border-foreground/30">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
            />
            <ValidityIcon show={password.length > 0} valid={passwordValid} />
            <motion.button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              whileTap={{ scale: 0.85 }}
              className="m-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {showPassword ? (
                  <motion.span
                    key="eye-off"
                    initial={{ opacity: 0, rotate: -12, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 12, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    className="flex"
                  >
                    <EyeOff className="size-4" aria-hidden="true" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="eye"
                    initial={{ opacity: 0, rotate: 12, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -12, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    className="flex"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          <AnimatePresence initial={false}>
            {password.length > 0 && (
              <motion.div
                initial={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 pt-1.5">
                  <div className="flex h-1.5 flex-1 gap-1 overflow-hidden rounded-full bg-muted">
                    {[0, 1, 2].map((segment) => (
                      <div
                        key={segment}
                        className="h-full flex-1 overflow-hidden rounded-full bg-muted"
                      >
                        <motion.div
                          className={`h-full rounded-full ${STRENGTH_COLOR[strength.score]}`}
                          initial={false}
                          animate={{
                            scaleX: strength.score > segment ? 1 : 0,
                          }}
                          style={{ originX: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        />
                      </div>
                    ))}
                  </div>
                  <motion.span
                    key={strength.label}
                    initial={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={
                      strength.score >= 3
                        ? "w-14 shrink-0 text-right text-xs font-medium text-accent"
                        : strength.score === 2
                          ? "w-14 shrink-0 text-right text-xs font-medium text-amber-600"
                          : "w-14 shrink-0 text-right text-xs font-medium text-muted-foreground"
                    }
                  >
                    {strength.label}
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
          className="space-y-1.5"
        >
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-muted-foreground transition-colors has-focus-within:text-primary"
          >
            Confirm password
          </Label>
          <div className="focus-glow flex items-center gap-2 rounded-lg border border-input bg-transparent pl-2.5 transition-colors hover:border-foreground/30">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
            />
            <ValidityIcon
              show={confirmPassword.length > 0}
              valid={confirmValid}
            />
            <motion.button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              whileTap={{ scale: 0.85 }}
              className="m-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                {showConfirmPassword ? (
                  <motion.span
                    key="eye-off"
                    initial={{ opacity: 0, rotate: -12, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 12, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    className="flex"
                  >
                    <EyeOff className="size-4" aria-hidden="true" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="eye"
                    initial={{ opacity: 0, rotate: 12, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -12, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    className="flex"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
        whileHover={reduceMotion || isSubmitting ? undefined : { y: -2 }}
        whileTap={reduceMotion || isSubmitting ? undefined : { scale: 0.98 }}
      >
        <Button
          type="submit"
          disabled={isSubmitting || isSuccess}
          className="group h-10 w-full bg-primary text-sm font-medium shadow-sm transition-shadow hover:bg-primary/90 hover:shadow-md"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isSuccess ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "backOut" }}
                className="flex items-center gap-1.5"
              >
                <Check className="size-4" aria-hidden="true" />
                Account created
              </motion.span>
            ) : isSubmitting ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Creating account...
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                Create account
                <ArrowRight
                  className="size-4 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <motion.p
        initial={reduceMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
        className="text-center text-sm text-muted-foreground"
      >
        Already have an account?{" "}
        <a
          href="/login"
          className="text-primary underline-offset-4 decoration-transparent transition-colors hover:decoration-primary/70 hover:underline"
        >
          Log in
        </a>
      </motion.p>
    </motion.form>
    </motion.div>
  )
}
