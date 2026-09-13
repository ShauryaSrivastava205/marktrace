"use client"

import { createContext, useContext } from "react"

export interface GraphInteractionState {
  activeNodeId: string | null
  lockedNodeId: string | null
  setHoveredNodeId: (id: string | null) => void
  setLockedNodeId: (id: string | null) => void
  highlightedNodeIds: Set<string>
  highlightedEdgeIds: Set<string>
  blastActive: boolean
  reducedMotion: boolean
}

export const GraphInteractionContext = createContext<GraphInteractionState | null>(null)

export function useGraphInteraction() {
  const ctx = useContext(GraphInteractionContext)
  if (!ctx) {
    throw new Error("useGraphInteraction must be used within GraphInteractionContext")
  }
  return ctx
}
