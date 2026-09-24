import Link from "next/link"
import { LogOut } from "lucide-react"

export interface HeaderLink {
  href: string
  label: string
}

/**
 * The sticky header shared by the results and verify screens. The wordmark
 * leads back to the dashboard, which is where every session starts.
 *
 * The quiz keeps its own header on purpose: its answers live only in memory,
 * so a wordmark that navigates away would be one misclick from losing them.
 */
export function AppHeader({
  context,
  links = [],
}: {
  /** A small mono tag beside the wordmark, e.g. the student id. */
  context?: string | null
  links?: HeaderLink[]
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur-sm sm:px-8">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          aria-label="MarkTrace — go to dashboard"
          className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground"
          >
            M
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            MarkTrace
          </span>
        </Link>
        {context && (
          <span className="ml-3 hidden border-l border-border pl-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground sm:inline">
            {context}
          </span>
        )}
      </div>

      <nav className="flex items-center gap-5" aria-label="Main">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </Link>
      </nav>
    </header>
  )
}
