"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Circle,
  Crown,
  Flame,
  Footprints,
  LockKeyhole,
  Sparkles,
  Target,
  Trophy,
  Brain,
} from "lucide-react"

import {
  createInitialProfile,
  getAchievements,
  getLearningStreak,
  getPlayerLevel,
  recordMilestoneCompletion,
  recordTaskCompletion,
  type GamificationProfile,
} from "@/lib/gamification"

import {
  generateRoadmap,
  type RoadmapInput,
  type RoadmapMilestone,
} from "@/lib/roadmap"

const PROFILE_KEY = "marktrace-gamification-v1"
const ROADMAP_KEY = "marktrace-roadmap-v1"

const achievementIcons = {
  Footprints,
  Trophy,
  Crown,
  CalendarCheck,
  Brain,
}

export default function PlayPage() {
  const [profile, setProfile] =
    useState<GamificationProfile>(createInitialProfile())
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([])
  const [completed, setCompleted] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY)
      const savedRoadmap = localStorage.getItem(ROADMAP_KEY)

      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)

        if (
          typeof parsed.totalXP === "number" &&
          Array.isArray(parsed.completedMilestones) &&
          Array.isArray(parsed.claimedRewards) &&
          Array.isArray(parsed.completedTasks) &&
          Array.isArray(parsed.activityDates)
        ) {
          setProfile(parsed)
        }
      }

      if (savedRoadmap) {
        const parsed = JSON.parse(savedRoadmap)

        if (
          parsed.input &&
          Array.isArray(parsed.completed) &&
          parsed.input.goal &&
          parsed.input.level
        ) {
          const input = parsed.input as RoadmapInput
          setMilestones(generateRoadmap(input))
          setCompleted(parsed.completed)
        }
      }
    } catch {
      // Keep the page usable if browser storage contains invalid data.
    }

    setReady(true)
  }, [])

  function saveProfile(next: GamificationProfile) {
    setProfile(next)

    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    } catch {
      // Current-session progress still works without storage.
    }
  }

  function completeMilestone(milestone: RoadmapMilestone) {
    if (completed.includes(milestone.id)) return

    const nextCompleted = [...completed, milestone.id]
    setCompleted(nextCompleted)

    try {
      const savedRoadmap = localStorage.getItem(ROADMAP_KEY)

      if (savedRoadmap) {
        const parsed = JSON.parse(savedRoadmap)

        localStorage.setItem(
          ROADMAP_KEY,
          JSON.stringify({
            ...parsed,
            completed: nextCompleted,
          }),
        )
      }
    } catch {
      // Keep the current session usable.
    }

    const nextProfile = recordMilestoneCompletion(profile, milestone.id)
    saveProfile(nextProfile)
  }

  function completeTask(milestoneId: string, taskIndex: number) {
    const taskId = `${milestoneId}:task:${taskIndex}`
    const nextProfile = recordTaskCompletion(profile, taskId)
    saveProfile(nextProfile)
  }

  const level = getPlayerLevel(profile.totalXP)
  const achievements = getAchievements(profile, milestones.length)
  const streak = getLearningStreak(profile.activityDates)
  const completedCount = completed.length
  const progress =
    milestones.length > 0
      ? Math.round((completedCount / milestones.length) * 100)
      : 0

  const nextMilestone = milestones.find(
    (milestone) => !completed.includes(milestone.id),
  )

  const nextAction = nextMilestone
    ? nextMilestone.title
    : milestones.length > 0
      ? "Roadmap completed!"
      : "Create your first roadmap"

  if (!ready) {
    return (
      <main className="min-h-screen bg-background bg-grid-paper p-8">
        <p className="text-sm text-muted-foreground">
          Loading your learning progress...
        </p>
      </main>
    )
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

      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:py-14">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Your learning journey
          </p>
        </div>

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Don't just learn. Level up.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every concept you understand and every milestone you complete
              moves you forward. Build skills, earn XP and keep your momentum.
            </p>
          </div>

          <Link
            href="/roadmap"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {milestones.length ? "View roadmap" : "Build my roadmap"}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Player overview */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total XP</span>
              <Sparkles className="size-5 text-primary" />
            </div>
            <p className="mt-3 font-serif text-3xl font-semibold text-foreground">
              {profile.totalXP.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Earned through learning
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Player level</span>
              <Trophy className="size-5 text-primary" />
            </div>
            <p className="mt-3 font-serif text-2xl font-semibold text-foreground">
              {level.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Level {level.level} of 10
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Learning streak</span>
              <Flame className="size-5 text-primary" />
            </div>
            <p className="mt-3 font-serif text-3xl font-semibold text-foreground">
              {streak} {streak === 1 ? "day" : "days"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Keep showing up
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Milestones</span>
              <Target className="size-5 text-primary" />
            </div>
            <p className="mt-3 font-serif text-3xl font-semibold text-foreground">
              {completedCount}/{milestones.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {progress}% of your roadmap
            </p>
          </div>
        </section>

        {/* Level progress */}
        <section className="mt-5 rounded-lg border border-primary/25 bg-card p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Trophy className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Current rank
                </p>
                <h2 className="mt-1 font-serif text-xl font-semibold text-foreground">
                  Level {level.level} · {level.name}
                </h2>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {level.nextLevel
                ? `${level.xpForNextLevel} XP to ${level.nextLevel.name}`
                : "You've reached the highest level!"}
            </p>
          </div>

          <div
            className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Progress to next player level"
            aria-valuenow={level.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${level.progress}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{profile.totalXP.toLocaleString()} XP earned</span>
            <span>
              {level.nextLevel
                ? `${level.nextLevel.xpRequired.toLocaleString()} XP required`
                : "MAX LEVEL"}
            </span>
          </div>
        </section>

        {/* Next action */}
        <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Your next step
              </p>
            </div>

            <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
              {nextAction}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {nextMilestone
                ? nextMilestone.objective
                : milestones.length
                  ? "You have marked every roadmap milestone complete. Review your learning and choose your next goal."
                  : "Start with a learning roadmap. MarkTrace will organise your goal into milestones you can work through."}
            </p>

            <Link
              href="/roadmap"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {milestones.length ? "Open learning roadmap" : "Create a roadmap"}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Roadmap progress
              </p>
            </div>

            <p className="mt-4 font-serif text-4xl font-semibold text-foreground">
              {progress}%
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              {completedCount} completed · {milestones.length - completedCount} remaining
            </p>
          </div>
        </section>

        {/* Learning path */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Learn · Practise · Progress
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                Your learning path
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              +50 XP per milestone
            </span>
          </div>

          {milestones.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <BookOpen className="mx-auto size-8 text-primary" />
              <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">
                Your journey starts here
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Build a roadmap first. Your milestones will appear here so you
                can track progress and earn learning XP.
              </p>
              <Link
                href="/roadmap"
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Build my roadmap <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {milestones.map((milestone, index) => {
                const isCompleted = completed.includes(milestone.id)
                const previousCompleted =
                  index === 0 || completed.includes(milestones[index - 1].id)
                const isAvailable = isCompleted || previousCompleted

                return (
                  <article
                    key={milestone.id}
                    className={`rounded-lg border bg-card p-5 shadow-sm transition-colors sm:p-6 ${
                      isCompleted
                        ? "border-primary/40"
                        : isAvailable
                          ? "border-border"
                          : "border-border/60 opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : isAvailable
                              ? "border border-primary/40 text-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-5" />
                        ) : isAvailable ? (
                          <Circle className="size-5" />
                        ) : (
                          <LockKeyhole className="size-4" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Milestone {String(index + 1).padStart(2, "0")}
                          </span>
                          {isCompleted && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              Completed
                            </span>
                          )}
                          {!isCompleted && !isAvailable && (
                            <span className="text-[10px] text-muted-foreground">
                              Locked · Finish the previous milestone first
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 font-serif text-lg font-semibold text-foreground sm:text-xl">
                          {milestone.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {milestone.objective}
                        </p>

                        {isAvailable && !isCompleted && (
                          <>
                            <div className="mt-4">
                              <p className="text-xs font-semibold text-foreground">
                                Topics to explore
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {milestone.topics.slice(0, 5).map((topic) => (
                                  <span
                                    key={topic}
                                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-4">
                              <p className="text-xs font-semibold text-foreground">
                                Practice checklist
                              </p>
                              <ul className="mt-2 space-y-3">
                                {milestone.tasks.map((task, taskIndex) => {
                                  const taskId = `${milestone.id}:task:${taskIndex}`
                                  const taskDone = profile.completedTasks.includes(taskId)

                                  return (
                                    <li
                                      key={taskId}
                                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                                    >
                                      <button
                                        type="button"
                                        aria-label={
                                          taskDone
                                            ? "Task reward already claimed"
                                            : "Mark task complete and earn 10 XP"
                                        }
                                        disabled={taskDone}
                                        onClick={() =>
                                          completeTask(milestone.id, taskIndex)
                                        }
                                        className="mt-0.5 shrink-0 text-primary disabled:cursor-default disabled:opacity-60"
                                      >
                                        {taskDone ? (
                                          <CheckCircle2 className="size-4" />
                                        ) : (
                                          <Circle className="size-4" />
                                        )}
                                      </button>
                                      <span
                                        className={
                                          taskDone ? "line-through opacity-60" : ""
                                        }
                                      >
                                        {task}
                                      </span>
                                      <span className="ml-auto shrink-0 text-[10px] text-primary">
                                        {taskDone ? "Claimed" : "+10 XP"}
                                      </span>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          </>
                        )}

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">
                            {milestone.estimatedHours} estimated hours
                          </span>

                          {isAvailable && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => completeMilestone(milestone)}
                              className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                              Complete milestone · +50 XP
                              <CheckCircle2 className="size-4" />
                            </button>
                          )}

                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                              <CheckCircle2 className="size-4" />
                              XP reward claimed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* Achievements */}
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Small wins matter
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                Achievements
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {achievements.filter((item) => item.unlocked).length} of {achievements.length} unlocked
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => {
              const Icon =
                achievementIcons[
                  achievement.icon as keyof typeof achievementIcons
                ]

              return (
                <article
                  key={achievement.id}
                  className={`rounded-lg border bg-card p-5 ${
                    achievement.unlocked
                      ? "border-primary/40"
                      : "border-border opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex size-10 items-center justify-center rounded-md ${
                        achievement.unlocked
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-5" />
                    </span>
                    {achievement.unlocked ? (
                      <CheckCircle2 className="size-4 text-primary" />
                    ) : (
                      <LockKeyhole className="size-4 text-muted-foreground" />
                    )}
                  </div>

                  <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                    {achievement.name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {achievement.description}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {achievement.unlocked ? "Achievement unlocked" : achievement.requirement}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <p className="mt-12 border-t border-border pt-6 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Learn · Practise · Verify · Level up
        </p>
      </div>
    </main>
  )
}