import type { Metadata } from "next"

import { DashboardView } from "@/components/dashboard/dashboard-view"

export const metadata: Metadata = {
  title: "Dashboard — MarkTrace",
  description: "Start a diagnostic and find the concept behind your scattered mistakes.",
}

export default function DashboardPage() {
  return <DashboardView />
}
