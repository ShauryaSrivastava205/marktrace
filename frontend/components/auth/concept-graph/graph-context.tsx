"use client"

import { createContext, useContext } from "react"
import type { ConceptEdgeMeta, ConceptMeta } from "./data"

export interface GraphInteractionState {
  activeNodeId: string | null
  lockedNodeId: string | null
  setHoveredNodeId: (id: string | null) => void
  setLockedNodeId: (id: string | null) => void
  highlightedNodeIds: Set<string>
  highlightedEdgeIds: Set<string>
  blastActive: boolean
  reducedMotion: boolean
  /** Lets a node register its rendered DOM element so the tooltip can anchor beside it. */
  registerNodeElement: (id: string, el: HTMLElement | null) => void
  /** The dataset currently rendered, so the tooltip can look up metadata/dependencies generically. */
  nodes: ConceptMeta[]
  edges: ConceptEdgeMeta[]
}

export const GraphInteractionContext = createContext<GraphInteractionState | null>(null)

export function useGraphInteraction() {
  const ctx = useContext(GraphInteractionContext)
  if (!ctx) {
    throw new Error("useGraphInteraction must be used within GraphInteractionContext")
  }
  return ctx
}
