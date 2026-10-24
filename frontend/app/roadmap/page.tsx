"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  ExternalLink,
  Flag,
  GraduationCap,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react"

import {
  generateRoadmap,
  type LearningGoal,
  type RoadmapInput,
  type SkillLevel,
} from "@/lib/roadmap"

const goalOptions: {
  id: LearningGoal
  title: string
  description: string
}[] = [
  {
    id: "dsa",
    title: "Data Structures & Algorithms",
    description: "Build problem-solving skills and algorithmic foundations.",
  },
  {
    id: "competitive-programming",
    title: "Competitive Programming",
    description: "Solve contest problems with speed, accuracy and strategy.",
  },
  {
    id: "web-development",
    title: "Web Development",
    description: "Build responsive websites and full-stack applications.",
  },
  {
    id: "ai-ml",
    title: "AI & Machine Learning",
    description: "Work with data, train models and build ML projects.",
  },
  {
    id: "internship",
    title: "Internship Preparation",
    description: "Prepare your coding, CS fundamentals and project portfolio.",
  },
]

const levelOptions: {
  id: SkillLevel
  title: string
  description: string
}[] = [
  {
    id: "beginner",
    title: "Beginner",
    description: "I need to establish my foundations.",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "I know the basics and want to improve.",
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "I want to strengthen and apply my skills.",
  },
]

const STORAGE_KEY = "marktrace-roadmap-v1"

export default function RoadmapPage() {
  const [goal, setGoal] = useState<LearningGoal>("dsa")
  const [level, setLevel] = useState<SkillLevel>("beginner")
  const [hoursPerDay, setHoursPerDay] = useState(2)
  const [weeks, setWeeks] = useState(8)
  const [generatedInput, setGeneratedInput] = useState<RoadmapInput | null>(null)
  const [completed, setCompleted] = useState<string[]>([])
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)

    if (!stored) return

    const parsed = JSON.parse(stored)

    if (
      !parsed.input ||
      !Array.isArray(parsed.completed) ||
      !parsed.input.goal ||
      !parsed.input.level ||
      typeof parsed.input.hoursPerDay !== "number" ||
      typeof parsed.input.weeks !== "number"
    ) {
      return
    }

    setGoal(parsed.input.goal)
    setLevel(parsed.input.level)
    setHoursPerDay(parsed.input.hoursPerDay)
    setWeeks(parsed.input.weeks)
    setGeneratedInput(parsed.input)
    setCompleted(parsed.completed)
    setShowRoadmap(true)
    setSaved(true)
  } catch {
    // Ignore invalid or unavailable browser storage.
  }
}, [])

  const milestones = useMemo(
    () => (generatedInput ? generateRoadmap(generatedInput) : []),
    [generatedInput],
  )

  const totalHours = hoursPerDay * 7 * weeks
  const completedCount = completed.length
  const progress =
    milestones.length > 0
      ? Math.round((completedCount / milestones.length) * 100)
      : 0

  function buildRoadmap() {
    const input: RoadmapInput = { goal, level, hoursPerDay, weeks }
    const nextMilestones = generateRoadmap(input)

    setGeneratedInput(input)
    setCompleted([])
    setShowRoadmap(true)
    setSaved(false)

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          input,
          completed: [],
          createdAt: new Date().toISOString(),
        }),
      )
    } catch {
      // The roadmap remains usable even when browser storage is unavailable.
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function toggleMilestone(id: string) {
    setCompleted((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            input: generatedInput,
            completed: next,
            createdAt: new Date().toISOString(),
          }),
        )
        setSaved(true)
      } catch {
        setSaved(false)
      }

      return next
    })
  }

  function resetRoadmap() {
    setShowRoadmap(false)
    setGeneratedInput(null)
    setCompleted([])
    setSaved(false)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Reset still works in the current session.
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <main className="min-h-screen bg-background bg-grid-paper">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur-sm sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground">
            M
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            MarkTrace
          </span>
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 lg:py-14">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Guided learning · Roadmap builder
          </p>
        </div>

        <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
          Turn your goal into a plan you can actually follow.
        </h1>

        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          Tell us where you're headed, where you're starting from and how much
          time you can commit. MarkTrace will organise your learning into
          actionable milestones.
        </p>

        {!showRoadmap ? (
          <section className="mt-9 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-8">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Compass className="size-5" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Design your learning journey
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Four quick choices. A clearer next step.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <label className="text-sm font-semibold text-foreground">
                01 · What do you want to achieve?
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {goalOptions.map((option) => {
                  const selected = goal === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setGoal(option.id)}
                      aria-pressed={selected}
                      className={`rounded-md border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-foreground">
                          {option.title}
                        </span>
                        {selected && (
                          <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        )}
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                        {option.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-8">
              <label className="text-sm font-semibold text-foreground">
                02 · Where are you starting from?
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {levelOptions.map((option) => {
                  const selected = level === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setLevel(option.id)}
                      aria-pressed={selected}
                      className={`rounded-md border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {option.title}
                        </span>
                        {selected && (
                          <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        )}
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                        {option.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="daily-hours"
                  className="text-sm font-semibold text-foreground"
                >
                  03 · Daily study time
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose a schedule you can sustain.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Clock3 className="size-5 text-primary" />
                  <select
                    id="daily-hours"
                    value={hoursPerDay}
                    onChange={(event) =>
                      setHoursPerDay(Number(event.target.value))
                    }
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value={0.5}>30 minutes per day</option>
                    <option value={1}>1 hour per day</option>
                    <option value={2}>2 hours per day</option>
                    <option value={3}>3 hours per day</option>
                    <option value={4}>4 hours per day</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="timeline"
                  className="text-sm font-semibold text-foreground"
                >
                  04 · Your timeline
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your plan will be organised around this window.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Flag className="size-5 text-primary" />
                  <select
                    id="timeline"
                    value={weeks}
                    onChange={(event) => setWeeks(Number(event.target.value))}
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value={2}>2 weeks</option>
                    <option value={4}>4 weeks</option>
                    <option value={6}>6 weeks</option>
                    <option value={8}>8 weeks</option>
                    <option value={12}>12 weeks</option>
                    <option value={16}>16 weeks</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-md border border-border bg-background p-4">
              <Target className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Your available learning time
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Approximately{" "}
                  <strong className="text-foreground">
                    {Number(totalHours.toFixed(1))} hours
                  </strong>{" "}
                  over {weeks} weeks, assuming you study every day. We'll use
                  this to shape your plan; it is not a guarantee of mastery.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={buildRoadmap}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Sparkles className="size-4" />
              Generate My Learning Roadmap
              <ArrowRight className="size-4" />
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Built around curated learning sequences. You can adjust your plan
              as you progress.
            </p>
          </section>
        ) : (
          <section className="mt-9">
            <div className="rounded-lg border border-primary/25 bg-card p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-primary">
                    <GraduationCap className="size-5" />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
                      Your learning roadmap
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                    {goalOptions.find((option) => option.id === goal)?.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {levelOptions.find((option) => option.id === level)?.title}{" "}
                    · {hoursPerDay} {hoursPerDay === 1 ? "hour" : "hours"} per
                    day · {weeks} weeks
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetRoadmap}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  Change plan
                </button>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-border bg-background p-4">
                  <BookOpen className="size-4 text-primary" />
                  <p className="mt-3 font-serif text-2xl font-semibold text-foreground">
                    {milestones.length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Learning milestones
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background p-4">
                  <Clock3 className="size-4 text-primary" />
                  <p className="mt-3 font-serif text-2xl font-semibold text-foreground">
                    {totalHours}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Available study hours
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background p-4">
                  <CheckCircle2 className="size-4 text-primary" />
                  <p className="mt-3 font-serif text-2xl font-semibold text-foreground">
                    {progress}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Milestones completed
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    Overall progress
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {completedCount}/{milestones.length} complete
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-label="Roadmap progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-4">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                  Your learning sequence
                </p>
                <h3 className="mt-2 font-serif text-xl font-semibold text-foreground sm:text-2xl">
                  One milestone at a time
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Work through each milestone in sequence. Read, practise and
                  check your understanding before moving on.
                </p>
              </div>

              <div className="space-y-4">
                {milestones.map((milestone, index) => {
                  const isComplete = completed.includes(milestone.id)
                  const isLocked =
                    index > 0 &&
                    !completed.includes(milestones[index - 1].id)

                  return (
                    <article
                      key={milestone.id}
                      className={`rounded-lg border bg-card p-5 shadow-sm transition-colors sm:p-6 ${
                        isComplete
                          ? "border-primary/40"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${
                            isComplete
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="size-5" />
                          ) : (
                            String(index + 1).padStart(2, "0")
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-serif text-lg font-semibold text-foreground">
                              {milestone.title}
                            </h4>
                            {isComplete && (
                              <span className="rounded-sm bg-primary/10 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-primary">
                                Complete
                              </span>
                            )}
                            {isLocked && (
                              <span className="rounded-sm bg-secondary px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                                Suggested sequence
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {milestone.objective}
                          </p>

                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                              Concepts to learn
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {milestone.topics.map((topic) => (
                                <span
                                  key={topic}
                                  className="rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs text-foreground/80"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                              Your action list
                            </p>
                            <ol className="mt-2 space-y-2.5">
                              {milestone.tasks.map((task, taskIndex) => (
                                <li
                                  key={task}
                                  className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                                >
                                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[10px] text-foreground">
                                    {taskIndex + 1}
                                  </span>
                                  {task}
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="mt-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                              Recommended resources
                            </p>
                            <div className="mt-2 flex flex-col gap-2">
                              {milestone.resources.map((resource) => (
                                <a
                                  key={resource.url}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                                >
                                  <BookOpen className="size-4 shrink-0" />
                                  {resource.label}
                                  <ExternalLink className="size-3.5 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>

                          <div className="mt-5 rounded-md border border-border bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                              Completion criteria
                            </p>
                            <ul className="mt-2 space-y-2">
                              {milestone.completionCriteria.map((criterion) => (
                                <li
                                  key={criterion}
                                  className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                                >
                                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                                  {criterion}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleMilestone(milestone.id)}
                            disabled={isLocked}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                          >
                            {isComplete
                              ? "Mark as incomplete"
                              : "Mark milestone complete"}
                            <ArrowRight className="size-4" />
                          </button>

                          {isLocked && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Complete the previous milestone to unlock this
                              step in the suggested sequence.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-primary/25 bg-card p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    Your next step is simple
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Start with the first incomplete milestone. Work through its
                    action list, use the linked resources and check each
                    completion criterion honestly. If a task feels difficult,
                    revisit the underlying concept before continuing.
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {saved
                      ? "Progress saved in this browser."
                      : "Progress is tracked for this session and saved when browser storage is available."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}