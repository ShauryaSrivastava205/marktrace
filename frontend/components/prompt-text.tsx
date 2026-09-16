import { Fragment } from "react"

import { cn } from "@/lib/utils"

/**
 * Presentation-only: pulls code-looking spans out of a prompt so they can be
 * set in mono. The prompt string itself is never altered.
 */
const CODE_SPAN_SOURCE =
  "(?:[A-Za-z_]\\w*\\s+)?[A-Za-z_]\\w*\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}|[A-Za-z_]\\w*\\s+\\w+\\[[^\\]]*\\]\\s*=\\s*\\{[^}]*\\};?"

export function PromptText({ prompt, className }: { prompt: string; className?: string }) {
  // Fresh regexes per render: a /g instance is stateful and would desync .test().
  const splitter = new RegExp(`(${CODE_SPAN_SOURCE})`, "g")
  const isCode = new RegExp(`^(?:${CODE_SPAN_SOURCE})$`)
  const parts = prompt.split(splitter).filter((part) => part.trim().length > 0)

  return (
    <p className={cn("font-sans text-[15px] font-medium leading-relaxed text-foreground", className)}>
      {parts.map((part, i) =>
        isCode.test(part.trim()) ? (
          <Fragment key={i}>
            <code className="mt-2 block overflow-x-auto rounded-md border border-border bg-muted/60 px-3 py-2 font-mono text-[12.5px] font-normal leading-relaxed text-foreground">
              {part.trim()}
            </code>
          </Fragment>
        ) : (
          <Fragment key={i}>{part.trim()} </Fragment>
        ),
      )}
    </p>
  )
}
