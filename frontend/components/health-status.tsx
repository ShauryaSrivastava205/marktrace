"use client"

import { useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

type HealthState =
  | { status: "loading" }
  | { status: "ok"; data: unknown }
  | { status: "error"; message: string }

export function HealthStatus() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" })

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`)
        return res.json()
      })
      .then((data) => setHealth({ status: "ok", data }))
      .catch((err: Error) => setHealth({ status: "error", message: err.message }))
  }, [])

  return (
    <p className="mt-6 text-xs text-muted-foreground">
      Backend ({API_URL}):{" "}
      {health.status === "loading" && "checking…"}
      {health.status === "ok" && (
        <span className="text-green-600 dark:text-green-400">
          {JSON.stringify(health.data)}
        </span>
      )}
      {health.status === "error" && (
        <span className="text-destructive">unreachable ({health.message})</span>
      )}
    </p>
  )
}
