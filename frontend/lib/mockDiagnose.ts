// Types for the POST /diagnose response, plus a dev fallback copy of one.
//
// The types are the real contract: they were checked against the deployed
// API (backend/app/engine/diagnose.py) and are what lib/api.ts returns.
// `diagnoseResult` and `reviewItems` below are a stand-in used only when no
// live response has been stored - see lib/api.ts and app/results/page.tsx.

export type ConceptStatus = "ok" | "weak" | "insufficient"

export interface ConceptMasteryItem {
  concept_id: string
  name: string
  /** 0-1 mastery score, or null when there wasn't enough evidence to score it. */
  mastery: number | null
  status: ConceptStatus
}

/** Stage 5 emits INSUFFICIENT when a root has too little supporting evidence. */
export type RootGapConfidence = "INSUFFICIENT" | "LOW" | "MEDIUM" | "HIGH"

export interface RootGap {
  concept_id: string
  name: string
  confidence: RootGapConfidence
  marks_associated: number
  affected_questions: number
  downstream_affected: string[]
}

export interface BlastRadius {
  root_concept_id: string
  unlocked_concepts: string[]
}

export interface DiagnoseResult {
  student_id: string
  evidence_sufficient: boolean
  concept_mastery: ConceptMasteryItem[]
  root_gaps: RootGap[]
  /** null when the engine found no root gap to measure a blast radius from. */
  blast_radius: BlastRadius | null
  explanation: string
  forecast: unknown | null
}

export type ErrorType = "conceptual" | "procedural" | "implementation" | "careless" | null

export type OptionKey = "A" | "B" | "C" | "D"

export interface ReviewItem {
  concept_id: string
  prompt: string
  options: Record<OptionKey, string>
  correct: OptionKey
  student_pick: OptionKey
  error_type: ErrorType
  /** Not every item has one — the UI must degrade gracefully when it's absent. */
  explanation?: string
}

export const diagnoseResult: DiagnoseResult = {
  student_id: "demo_student_01",
  evidence_sufficient: true,
  concept_mastery: [
    { concept_id: "arrays", name: "Arrays", mastery: 1, status: "ok" },
    { concept_id: "recursion", name: "Recursion", mastery: 0, status: "weak" },
    { concept_id: "dp", name: "Dynamic Programming", mastery: 0, status: "weak" },
    { concept_id: "graph", name: "Graphs (representation)", mastery: 0, status: "weak" },
    { concept_id: "bfs", name: "Breadth-First Search", mastery: 0, status: "weak" },
    { concept_id: "binary_search", name: "Binary Search", mastery: null, status: "insufficient" },
    { concept_id: "linked_list", name: "Linked Lists", mastery: null, status: "insufficient" },
  ],
  root_gaps: [
    {
      concept_id: "recursion",
      name: "Recursion",
      confidence: "LOW",
      marks_associated: 15,
      affected_questions: 2,
      downstream_affected: ["dp", "recursion"],
    },
    {
      concept_id: "graph",
      name: "Graphs (representation)",
      confidence: "LOW",
      marks_associated: 8,
      affected_questions: 1,
      downstream_affected: ["bfs", "graph"],
    },
  ],
  blast_radius: {
    root_concept_id: "recursion",
    unlocked_concepts: [
      "backtracking",
      "dfs",
      "divide_conquer",
      "dp",
      "dp_patterns",
      "merge_sort",
      "quick_sort",
      "tree_traversal",
    ],
  },
  explanation:
    "Recursion is associated with 15 marks lost across 2 questions, which also explains gaps in Dynamic Programming. Graphs is associated with 8 marks across 1 question, which also explains gaps in BFS.",
  forecast: null,
}

export const reviewItems: ReviewItem[] = [
  {
    concept_id: "recursion",
    prompt:
      "What does mystery(3) return?  int mystery(int n){ if(n==0) return 0; return n + mystery(n-1); }",
    options: { A: "6", B: "5", C: "3", D: "0" },
    correct: "A",
    student_pick: "C",
    error_type: "conceptual",
    explanation:
      "It adds n each step down to 0: 3+2+1+0=6. Picking 3 assumes it just returns n, missing that recursion accumulates each level.",
  },
  {
    concept_id: "dp",
    prompt: "With fib(0)=0, fib(1)=1, what is fib(5)?",
    options: { A: "5", B: "8", C: "4", D: "6" },
    correct: "A",
    student_pick: "B",
    error_type: "procedural",
    explanation: "Sequence 0,1,1,2,3,5 -> fib(5)=5. 8 is fib(6), one step too far.",
  },
  {
    concept_id: "graph",
    prompt: "A graph consists of...?",
    options: {
      A: "Vertices and edges connecting them",
      B: "Only a root and leaves",
      C: "Key-value pairs",
      D: "A sorted list of numbers",
    },
    correct: "A",
    student_pick: "B",
    error_type: "conceptual",
    explanation:
      "A graph is vertices joined by edges. 'Root and leaves' describes a tree - a restricted special case.",
  },
  {
    concept_id: "binary_search",
    prompt: "mid=(low+high)/2 with very large low+high can...?",
    options: {
      A: "Overflow the integer range",
      B: "Always return the wrong element",
      C: "Make the array unsorted",
      D: "Nothing, it's always fine",
    },
    correct: "A",
    student_pick: "D",
    error_type: "careless",
  },
  {
    concept_id: "arrays",
    prompt: "int a[5]={10,20,30,40,50}; what is a[2]?",
    options: { A: "30", B: "20", C: "40", D: "50" },
    correct: "A",
    student_pick: "A",
    error_type: null,
    explanation: "Arrays are 0-indexed: a[0]=10, a[1]=20, a[2]=30. Correct.",
  },
]
