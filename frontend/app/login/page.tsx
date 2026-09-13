import type { Metadata } from "next"
import { LogoMark } from "@/components/auth/logo-mark"
import { Headline } from "@/components/auth/headline"
import { GraphCard } from "@/components/auth/graph-card"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign in — MarkTrace",
  description:
    "Sign in to MarkTrace to trace mistakes back to the concept behind them.",
}

const TAGLINE = "Diagnostic analytics for engineering students — DSA · DBMS · Mathematics"

export default function LoginPage() {
  return (
    <main className="min-h-svh bg-background bg-grid-paper lg:h-svh lg:overflow-hidden">
      {/* Mobile / tablet: stacked layout — brand, headline, form, compact graph */}
      <div className="flex flex-col gap-8 px-6 py-8 lg:hidden">
        <LogoMark />
        <Headline />
        <div className="flex justify-center">
          <LoginForm />
        </div>
        <GraphCard />
        <p className="text-center text-xs text-muted-foreground">{TAGLINE}</p>
      </div>

      {/* Desktop: split layout, graph as the hero on the left */}
      <div className="hidden lg:flex lg:h-svh">
        <section className="flex w-[52%] flex-col justify-center gap-[3vh] border-r border-border px-10 py-[3vh] xl:px-16">
          <div>
            <LogoMark />
            <Headline className="mt-5" />
            <GraphCard className="mt-6" />
          </div>
          <p className="text-xs text-muted-foreground">{TAGLINE}</p>
        </section>

        <section className="flex w-[48%] items-center justify-center px-10 py-[3vh] xl:px-16">
          <LoginForm />
        </section>
      </div>
    </main>
  )
}
