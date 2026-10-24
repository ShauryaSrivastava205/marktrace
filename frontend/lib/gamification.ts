export type AchievementId =
  | "first-steps"
  | "level-up"
  | "roadmap-finisher"
  | "consistent-learner"
  | "problem-solver"

export type Achievement = {
  id: AchievementId
  name: string
  description: string
  icon: string
  requirement: string
  unlocked: boolean
}

export type GamificationProfile = {
  totalXP: number
  completedMilestones: string[]
  claimedRewards: string[]
  completedTasks: string[]
  activityDates: string[]
}

export const XP_REWARDS = {
  learningTask: 10,
  milestone: 50,
  correctPractice: 20,
} as const

export const PLAYER_LEVELS = [
  { level: 1, name: "Curious Beginner", xpRequired: 0 },
  { level: 2, name: "Focused Learner", xpRequired: 100 },
  { level: 3, name: "Problem Solver", xpRequired: 250 },
  { level: 4, name: "Rising Thinker", xpRequired: 500 },
  { level: 5, name: "Knowledge Seeker", xpRequired: 850 },
  { level: 6, name: "Skill Builder", xpRequired: 1300 },
  { level: 7, name: "Concept Explorer", xpRequired: 1900 },
  { level: 8, name: "Learning Strategist", xpRequired: 2700 },
  { level: 9, name: "Mastermind", xpRequired: 3700 },
  { level: 10, name: "MarkTrace Legend", xpRequired: 5000 },
] as const

export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Complete your first learning milestone.",
    icon: "Footprints",
    requirement: "Complete 1 milestone",
  },
  {
    id: "level-up",
    name: "Level Up",
    description: "Complete three learning milestones.",
    icon: "Trophy",
    requirement: "Complete 3 milestones",
  },
  {
    id: "roadmap-finisher",
    name: "Roadmap Finisher",
    description: "Complete every milestone in your roadmap.",
    icon: "Crown",
    requirement: "Complete the entire roadmap",
  },
  {
    id: "consistent-learner",
    name: "Consistent Learner",
    description: "Learn on three different calendar days.",
    icon: "CalendarCheck",
    requirement: "Record activity on 3 different days",
  },
  {
    id: "problem-solver",
    name: "Problem Solver",
    description: "Complete five learning tasks.",
    icon: "Brain",
    requirement: "Complete 5 learning tasks",
  },
] as const

export function createInitialProfile(): GamificationProfile {
  return {
    totalXP: 0,
    completedMilestones: [],
    claimedRewards: [],
    completedTasks: [],
    activityDates: [],
  }
}

export function getPlayerLevel(totalXP: number) {
  const xp = Math.max(0, totalXP)

let current: (typeof PLAYER_LEVELS)[number] = PLAYER_LEVELS[0]
let next: (typeof PLAYER_LEVELS)[number] | null = PLAYER_LEVELS[1] ?? null
  for (let i = 0; i < PLAYER_LEVELS.length; i++) {
    if (xp >= PLAYER_LEVELS[i].xpRequired) {
      current = PLAYER_LEVELS[i]
      next = PLAYER_LEVELS[i + 1] ?? null
    } else {
      break
    }
  }

  const progress = next
    ? Math.min(
        100,
        Math.round(
          ((xp - current.xpRequired) /
            (next.xpRequired - current.xpRequired)) *
            100,
        ),
      )
    : 100

  return {
    ...current,
    nextLevel: next,
    progress,
    xpIntoLevel: xp - current.xpRequired,
    xpForNextLevel: next ? next.xpRequired - xp : 0,
  }
}

export function recordMilestoneCompletion(
  profile: GamificationProfile,
  milestoneId: string,
): GamificationProfile {
  if (profile.completedMilestones.includes(milestoneId)) {
    return profile
  }

  const today = new Date().toISOString().slice(0, 10)

  return {
    ...profile,
    totalXP: profile.totalXP + XP_REWARDS.milestone,
    completedMilestones: [
      ...profile.completedMilestones,
      milestoneId,
    ],
    claimedRewards: [
      ...profile.claimedRewards,
      `milestone:${milestoneId}`,
    ],
    activityDates: profile.activityDates.includes(today)
      ? profile.activityDates
      : [...profile.activityDates, today],
  }
}

export function recordTaskCompletion(
  profile: GamificationProfile,
  taskId: string,
): GamificationProfile {
  if (profile.completedTasks.includes(taskId)) {
    return profile
  }

  const today = new Date().toISOString().slice(0, 10)

  return {
    ...profile,
    totalXP: profile.totalXP + XP_REWARDS.learningTask,
    completedTasks: [...profile.completedTasks, taskId],
    claimedRewards: [...profile.claimedRewards, `task:${taskId}`],
    activityDates: profile.activityDates.includes(today)
      ? profile.activityDates
      : [...profile.activityDates, today],
  }
}

export function getAchievements(
  profile: GamificationProfile,
  totalMilestones: number,
): Achievement[] {
  const milestoneCount = profile.completedMilestones.length
  const taskCount = profile.completedTasks.length

  return ACHIEVEMENT_DEFINITIONS.map((achievement) => {
    let unlocked = false

    switch (achievement.id) {
      case "first-steps":
        unlocked = milestoneCount >= 1
        break
      case "level-up":
        unlocked = milestoneCount >= 3
        break
      case "roadmap-finisher":
        unlocked =
          totalMilestones > 0 && milestoneCount >= totalMilestones
        break
      case "consistent-learner":
        unlocked = profile.activityDates.length >= 3
        break
      case "problem-solver":
        unlocked = taskCount >= 5
        break
    }

    return { ...achievement, unlocked }
  })
}

export function getLearningStreak(activityDates: string[]): number {
  const dates = new Set(activityDates)
  if (dates.size === 0) return 0

  const today = new Date()
  const toKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (!dates.has(toKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0

  while (dates.has(toKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}