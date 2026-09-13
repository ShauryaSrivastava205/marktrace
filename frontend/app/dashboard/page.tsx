import type { Metadata } from "next"
import Link from "next/link"
import { LogOut } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard — MarkTrace",
}

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-8 py-5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground"
          >
            M
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            MarkTrace
          </span>
        </div>

        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Student workspace
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Dashboard development starts here.
        </p>
      </div>
    </main>
  )
}
