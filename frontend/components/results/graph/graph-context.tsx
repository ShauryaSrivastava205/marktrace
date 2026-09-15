"use client"

import { createContext, useContext } from "react"

export interface GraphInteractionState {
  /** Hover wins over selection while the pointer is on a node. */
  focusId: string | null
  selectedId: string | null
  /** focusId plus its direct neighbours — everything else dims. */
  relatedIds: Set<string>
  relatedEdgeIds: Set<string>
  hasFocus: boolean
  setHovered: (id: string | null) => void
  setSelected: (id: string | null) => void
  blastNodeIds: Set<string>
  blastEdgeIds: Set<string>
  blastActive: boolean
  reduceMotion: boolean
  registerNodeEl: (id: string, el: HTMLElement | null) => void
}

export const GraphInteractionContext = createContext<GraphInteractionState | null>(null)

export function useGraphInteraction() {
  const ctx = useContext(GraphInteractionContext)
  if (!ctx) {
    throw new Error("useGraphInteraction must be used inside GraphInteractionContext")
  }
  return ctx
}
