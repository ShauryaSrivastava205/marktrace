export type LearningGoal =
  | "dsa"
  | "competitive-programming"
  | "web-development"
  | "ai-ml"
  | "internship"

export type SkillLevel = "beginner" | "intermediate" | "advanced"

export type RoadmapInput = {
  goal: LearningGoal
  level: SkillLevel
  hoursPerDay: number
  weeks: number
}

export type RoadmapMilestone = {
  id: string
  title: string
  objective: string
  topics: string[]
  tasks: string[]
  resources: { label: string; url: string }[]
  completionCriteria: string[]
  estimatedHours: number
}

type MilestoneTemplate = Omit<RoadmapMilestone, "id" | "estimatedHours">

const resource = {
  striver: {
    label: "takeUforward — A2Z DSA Course",
    url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2",
  },
  leetcode: {
    label: "LeetCode — Practice Problems",
    url: "https://leetcode.com/problemset/",
  },
  cp: {
    label: "Codeforces — Problemset",
    url: "https://codeforces.com/problemset",
  },
  mdn: {
    label: "MDN — Web Development",
    url: "https://developer.mozilla.org/en-US/docs/Learn_web_development",
  },
  react: {
    label: "React — Official Learn Guide",
    url: "https://react.dev/learn",
  },
  javascript: {
    label: "JavaScript — MDN Guide",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
  },
  python: {
    label: "Python — Official Tutorial",
    url: "https://docs.python.org/3/tutorial/",
  },
  kaggle: {
    label: "Kaggle — Learn",
    url: "https://www.kaggle.com/learn",
  },
  sklearn: {
    label: "Scikit-learn — Tutorials",
    url: "https://scikit-learn.org/stable/tutorial/index.html",
  },
}

const roadmaps: Record<LearningGoal, MilestoneTemplate[]> = {
  dsa: [
    {
      title: "Programming Foundations",
      objective: "Build confidence with complexity, basic programming patterns and problem decomposition.",
      topics: ["Time and space complexity", "Arrays and strings", "Basic sorting", "Frequency counting"],
      tasks: [
        "Explain the difference between O(n) and O(n²) using examples.",
        "Solve 5 introductory array and string problems.",
        "Compare a brute-force solution with an improved solution.",
      ],
      resources: [resource.striver, resource.leetcode],
      completionCriteria: [
        "Solve 4 out of 5 introductory problems independently.",
        "Explain the time complexity of your solutions.",
      ],
    },
    {
      title: "Hashing, Two Pointers and Sliding Windows",
      objective: "Recognise repeated-work patterns and solve common array and string problems efficiently.",
      topics: ["HashMap and HashSet", "Two pointers", "Fixed sliding window", "Variable sliding window", "Prefix sums"],
      tasks: [
        "Solve 3 frequency-counting problems.",
        "Solve 3 two-pointer problems.",
        "Solve 4 sliding-window or prefix-sum problems.",
      ],
      resources: [resource.striver, resource.leetcode],
      completionCriteria: [
        "Identify the appropriate pattern in a new problem.",
        "Solve at least 8 of the 10 assigned problems.",
      ],
    },
    {
      title: "Binary Search and Recursion",
      objective: "Search efficiently in ordered spaces and develop recursive reasoning.",
      topics: ["Binary search", "Binary search on answers", "Recursion trees", "Backtracking basics"],
      tasks: [
        "Implement binary search and explain its invariant.",
        "Solve 3 binary-search-on-answer problems.",
        "Solve 3 recursion or backtracking problems.",
      ],
      resources: [resource.striver, resource.leetcode],
      completionCriteria: [
        "Solve a binary-search problem without copying a template blindly.",
        "Explain the base case and recursive transition of a solution.",
      ],
    },
    {
      title: "Trees, Graphs and Dynamic Programming",
      objective: "Build a foundation in traversals, graph exploration and overlapping subproblems.",
      topics: ["Tree traversals", "BFS and DFS", "Graph representations", "Memoization", "Tabulation"],
      tasks: [
        "Implement tree traversals.",
        "Solve 4 basic tree or graph problems.",
        "Convert a small recursive solution into memoization or tabulation.",
      ],
      resources: [resource.striver, resource.leetcode],
      completionCriteria: [
        "Explain when BFS and DFS are useful.",
        "Identify the state and transition in a basic DP problem.",
      ],
    },
    {
      title: "Consolidation and Interview Practice",
      objective: "Apply patterns to unfamiliar problems and communicate solutions clearly.",
      topics: ["Mixed-pattern practice", "Complexity analysis", "Edge cases", "Solution explanation"],
      tasks: [
        "Complete 3 timed mixed-problem sessions.",
        "Re-solve previously difficult problems without notes.",
        "Explain 5 solutions aloud, including trade-offs and edge cases.",
      ],
      resources: [resource.leetcode, resource.striver],
      completionCriteria: [
        "Solve unfamiliar problems with a clear approach.",
        "Explain correctness, complexity and important edge cases.",
      ],
    },
  ],

  "competitive-programming": [
    {
      title: "Contest Foundations",
      objective: "Build speed and accuracy with implementation, complexity and common patterns.",
      topics: ["Complexity constraints", "Implementation", "Sorting", "Frequency counting", "Prefix sums"],
      tasks: [
        "Solve 8 introductory contest problems.",
        "Practise translating constraints into an expected complexity.",
        "Review every wrong answer and classify its cause.",
      ],
      resources: [resource.cp, resource.leetcode],
      completionCriteria: [
        "Solve introductory problems independently.",
        "Explain why your approach fits the input constraints.",
      ],
    },
    {
      title: "Core Contest Patterns",
      objective: "Recognise common techniques and apply them under time pressure.",
      topics: ["Binary search", "Two pointers", "Greedy reasoning", "Number theory basics"],
      tasks: [
        "Solve 3 problems for each core pattern.",
        "Write down the key observation before coding.",
        "Test boundary cases and integer limits.",
      ],
      resources: [resource.cp],
      completionCriteria: [
        "Identify a viable approach before implementation.",
        "Explain why a greedy choice or binary-search condition works.",
      ],
    },
    {
      title: "Recursion and Dynamic Programming",
      objective: "Model states and transitions for problems that require systematic exploration.",
      topics: ["Recursion", "Backtracking", "DP states", "Memoization", "Tabulation"],
      tasks: [
        "Solve 3 recursion or backtracking problems.",
        "Solve 4 introductory DP problems.",
        "Compare recursive and iterative solutions.",
      ],
      resources: [resource.cp, resource.leetcode],
      completionCriteria: [
        "Define the state and transition for a basic DP problem.",
        "Explain the time and space complexity.",
      ],
    },
    {
      title: "Contest Simulation and Review",
      objective: "Improve decision-making, implementation reliability and post-contest learning.",
      topics: ["Timed contests", "Problem selection", "Debugging", "Editorial analysis"],
      tasks: [
        "Complete 2 timed practice contests.",
        "Upsolve at least 3 problems you could not solve during practice.",
        "Create a short mistake log and revisit it.",
      ],
      resources: [resource.cp],
      completionCriteria: [
        "Complete a contest review.",
        "Explain the key insight behind each upsolved problem.",
      ],
    },
  ],

  "web-development": [
    {
      title: "Web Foundations",
      objective: "Understand how webpages are structured, styled and made interactive.",
      topics: ["HTML semantics", "CSS layout", "Responsive design", "JavaScript fundamentals"],
      tasks: [
        "Build a responsive personal webpage.",
        "Add form validation and simple interactive behaviour.",
        "Explain how HTML, CSS and JavaScript work together.",
      ],
      resources: [resource.mdn, resource.javascript],
      completionCriteria: [
        "Build a usable responsive page without following a full tutorial step by step.",
        "Use semantic HTML and basic accessibility practices.",
      ],
    },
    {
      title: "Modern JavaScript and APIs",
      objective: "Write maintainable JavaScript and integrate external data.",
      topics: ["Modules", "Promises", "Async and await", "Fetch", "Error handling"],
      tasks: [
        "Build a small application using a public API.",
        "Handle loading, empty and error states.",
        "Separate reusable logic from UI code.",
      ],
      resources: [resource.javascript, resource.mdn],
      completionCriteria: [
        "Explain the request lifecycle.",
        "Handle failed requests without breaking the interface.",
      ],
    },
    {
      title: "React and Component Design",
      objective: "Build interfaces from reusable components and predictable state.",
      topics: ["Components", "Props", "State", "Effects", "Forms"],
      tasks: [
        "Build a multi-component task tracker.",
        "Implement form input and state updates.",
        "Add empty and loading states.",
      ],
      resources: [resource.react],
      completionCriteria: [
        "Explain data flow between components.",
        "Use state appropriately without unnecessary effects.",
      ],
    },
    {
      title: "Full-Stack Project",
      objective: "Connect a frontend to a backend and deliver a reliable, demonstrable application.",
      topics: ["HTTP and REST", "Backend routes", "Validation", "Persistence", "Deployment"],
      tasks: [
        "Build a small full-stack application.",
        "Validate incoming data and handle API errors.",
        "Deploy the project and document how to run it.",
      ],
      resources: [resource.mdn, resource.react],
      completionCriteria: [
        "Demonstrate the deployed application.",
        "Explain the request flow and important design decisions.",
      ],
    },
  ],

  "ai-ml": [
    {
      title: "Python and Data Foundations",
      objective: "Become comfortable manipulating data and writing reproducible experiments.",
      topics: ["Python", "NumPy", "Pandas", "Data cleaning", "Visualisation"],
      tasks: [
        "Load and inspect a real dataset.",
        "Handle missing values and inconsistent data.",
        "Write a short notebook explaining the dataset.",
      ],
      resources: [resource.python, resource.kaggle],
      completionCriteria: [
        "Clean a dataset and justify the transformations.",
        "Explain the purpose of each major processing step.",
      ],
    },
    {
      title: "Machine Learning Fundamentals",
      objective: "Understand how models learn and how to evaluate them honestly.",
      topics: ["Supervised learning", "Train-test split", "Regression", "Classification", "Evaluation metrics"],
      tasks: [
        "Train a baseline regression or classification model.",
        "Compare two appropriate evaluation metrics.",
        "Check for data leakage and explain the split strategy.",
      ],
      resources: [resource.kaggle, resource.sklearn],
      completionCriteria: [
        "Explain the difference between training and testing.",
        "Interpret model metrics and identify at least one limitation.",
      ],
    },
    {
      title: "Model Comparison and Improvement",
      objective: "Compare models systematically and understand where performance changes come from.",
      topics: ["Decision trees", "Nearest neighbours", "Linear models", "Feature engineering", "Cross-validation"],
      tasks: [
        "Train and compare at least two suitable models.",
        "Record results in a comparison table.",
        "Investigate one improvement and one failure case.",
      ],
      resources: [resource.sklearn, resource.kaggle],
      completionCriteria: [
        "Justify the selected metric and model.",
        "Explain why a result might not generalise to unseen data.",
      ],
    },
    {
      title: "End-to-End ML Project",
      objective: "Build a reproducible project that communicates its results and limitations.",
      topics: ["Pipelines", "Reproducibility", "Error analysis", "Model serving", "Documentation"],
      tasks: [
        "Create a clean training and evaluation pipeline.",
        "Document data sources, metrics and limitations.",
        "Build a small interface or API to demonstrate the model.",
      ],
      resources: [resource.sklearn, resource.kaggle],
      completionCriteria: [
        "Reproduce the reported evaluation.",
        "Demonstrate the model and explain its limitations.",
      ],
    },
  ],

  internship: [
    {
      title: "Assess Your Starting Point",
      objective: "Establish a realistic baseline across coding, computer science fundamentals and project experience.",
      topics: ["DSA baseline", "Language fundamentals", "Core CS concepts", "Project inventory"],
      tasks: [
        "Attempt a short set of coding problems without assistance.",
        "List your strongest and weakest technical topics.",
        "Choose one existing project to improve or explain in depth.",
      ],
      resources: [resource.leetcode, resource.striver],
      completionCriteria: [
        "Record baseline results and recurring mistakes.",
        "Identify the three highest-priority improvement areas.",
      ],
    },
    {
      title: "Build Technical Problem-Solving",
      objective: "Develop reliable problem-solving skills and communicate the reasoning behind solutions.",
      topics: ["Arrays and strings", "Hashing", "Binary search", "Trees", "Complexity analysis"],
      tasks: [
        "Follow a sequenced DSA practice plan.",
        "Keep a log of failed approaches and corrections.",
        "Practise explaining solutions before coding.",
      ],
      resources: [resource.striver, resource.leetcode],
      completionCriteria: [
        "Solve representative problems independently.",
        "Explain complexity and edge cases clearly.",
      ],
    },
    {
      title: "Strengthen Projects and CS Fundamentals",
      objective: "Demonstrate that you can build, understand and explain software.",
      topics: ["DBMS", "Operating systems", "Computer networks", "Project architecture", "Testing"],
      tasks: [
        "Review one core CS subject at a time.",
        "Improve one project with meaningful functionality and tests.",
        "Prepare an architecture explanation and trade-off discussion.",
      ],
      resources: [resource.leetcode, resource.mdn],
      completionCriteria: [
        "Explain your project's architecture and design decisions.",
        "Answer foundational questions with examples.",
      ],
    },
    {
      title: "Interview and Application Readiness",
      objective: "Turn preparation into a consistent, evidence-based interview routine.",
      topics: ["Mock interviews", "Resume", "Project storytelling", "Behavioural questions"],
      tasks: [
        "Complete mock technical interviews.",
        "Write concise explanations of your project contributions.",
        "Review your mistake log and repeat weak areas.",
      ],
      resources: [resource.leetcode],
      completionCriteria: [
        "Complete a mock interview and review the feedback.",
        "Explain your projects, contributions and trade-offs clearly.",
      ],
    },
  ],
}

export function generateRoadmap(input: RoadmapInput): RoadmapMilestone[] {
  const templates = roadmaps[input.goal]

  // This MVP scales the plan to available study time.
  // It does not claim that a particular skill can be mastered in a fixed period.
  const totalHours = input.hoursPerDay * 7 * input.weeks
  const levelMultiplier = {
    beginner: 1.2,
    intermediate: 1,
    advanced: 0.8,
  }[input.level]

  const hoursPerMilestone =
    (totalHours / templates.length) * levelMultiplier

  return templates.map((template, index) => ({
    ...template,
    id: `${input.goal}-${index + 1}`,
    estimatedHours: Math.max(2, Math.round(hoursPerMilestone)),
  }))
}