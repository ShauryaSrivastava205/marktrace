"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Mail, ArrowRight } from "lucide-react"
import { motion, useReducedMotion, AnimatePresence } from "motion/react"

import { mockLogin, storeLoggedInUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function LoginForm() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await mockLogin({ email, password, rememberMe })

    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    storeLoggedInUser(email)
    router.push("/dashboard")
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={reduceMotion ? undefined : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      className="w-full max-w-sm space-y-5 lg:space-y-[clamp(1.1rem,3vh,1.75rem)]"
    >
      <div className="space-y-1.5">
        <h1 className="text-2xl font-serif font-semibold text-foreground lg:text-[clamp(1.375rem,2.6vh,1.5rem)]">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Continue tracing what is holding your learning back.
        </p>
      </div>

      <div className="space-y-4 lg:space-y-[clamp(0.875rem,2.2vh,1.25rem)]">
        <div className="space-y-1.5">
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
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-muted-foreground transition-colors has-focus-within:text-primary"
            >
              Password
            </Label>
            <a
              href="#"
              className="text-xs text-primary underline-offset-4 decoration-transparent transition-colors hover:decoration-primary/70 hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <div className="focus-glow flex items-center gap-2 rounded-lg border border-input bg-transparent pl-2.5 transition-colors hover:border-foreground/30">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
            />
            <div className="group/tooltip relative shrink-0">
              <motion.button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                whileTap={{ scale: 0.85 }}
                className="m-1 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
              <span
                role="tooltip"
                className="pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground opacity-0 shadow-sm transition-opacity delay-300 group-hover/tooltip:opacity-100"
              >
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label
            htmlFor="remember-me"
            className="text-sm font-normal text-muted-foreground"
          >
            Remember me
          </Label>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <motion.div
        whileHover={reduceMotion ? undefined : { y: -2 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <Button
          type="submit"
          disabled={isSubmitting}
          className="group h-10 w-full bg-primary text-sm font-medium shadow-sm transition-shadow hover:bg-primary/90 hover:shadow-md"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isSubmitting ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Signing in...
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                Sign in
                <ArrowRight
                  className="size-4 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <p className="text-center text-sm text-muted-foreground">
        New to MarkTrace?{" "}
        <a
          href="/signup"
          className="text-primary underline-offset-4 decoration-transparent transition-colors hover:decoration-primary/70 hover:underline"
        >
          Create account
        </a>
      </p>
    </motion.form>
  )
}
