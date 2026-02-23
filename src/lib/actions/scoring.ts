"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// Default Scoring Configuration
const DEFAULT_WEIGHTS = {
  activity: 25,      // 25% - Activity count & duration
  pillar: 20,        // 20% - Distribution across 5 pillars
  task: 20,          // 20% - Task completion rate
  consistency: 15,   // 15% - Streak & daily regularity
  evaluation: 20     // 20% - Evaluation 360° results
}

interface ScoringWeights {
  activity: number
  pillar: number
  task: number
  consistency: number
  evaluation: number
}

interface ScoreBreakdown {
  activityScore: number
  pillarBalanceScore: number
  taskScore: number
  consistencyScore: number
  evaluationScore: number
  totalScore: number
  rank?: string
  weights: ScoringWeights
}

// Helper: Check if scoringConfig model is available on Prisma client
function hasScoringConfigModel(): boolean {
  return typeof (prisma as any).scoringConfig?.findFirst === 'function'
}

// Get scoring configuration from database (or use defaults)
async function getScoringWeights(): Promise<ScoringWeights> {
  try {
    if (hasScoringConfigModel()) {
      const config = await (prisma as any).scoringConfig.findFirst({
        where: { name: "default" }
      })
      if (config) {
        return {
          activity: config.activityWeight ?? config.activity_weight,
          pillar: config.pillarWeight ?? config.pillar_weight,
          task: config.taskWeight ?? config.task_weight,
          consistency: config.consistencyWeight ?? config.consistency_weight,
          evaluation: config.evaluationWeight ?? config.evaluation_weight
        }
      }
    } else {
      // Fallback: raw SQL
      const rows = await prisma.$queryRaw<any[]>`
        SELECT * FROM scoring_configs WHERE name = 'default' LIMIT 1
      `
      if (rows.length > 0) {
        const row = rows[0]
        return {
          activity: row.activity_weight ?? DEFAULT_WEIGHTS.activity,
          pillar: row.pillar_weight ?? DEFAULT_WEIGHTS.pillar,
          task: row.task_weight ?? DEFAULT_WEIGHTS.task,
          consistency: row.consistency_weight ?? DEFAULT_WEIGHTS.consistency,
          evaluation: row.evaluation_weight ?? DEFAULT_WEIGHTS.evaluation
        }
      }
    }
  } catch {
    // Table might not exist yet, use defaults
  }

  return DEFAULT_WEIGHTS
}

// Get or create scoring config (public for admin)
export async function getScoringConfig() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    if (hasScoringConfigModel()) {
      let config = await (prisma as any).scoringConfig.findFirst({
        where: { name: "default" }
      })

      if (!config) {
        config = await (prisma as any).scoringConfig.create({
          data: {
            name: "default",
            activityWeight: DEFAULT_WEIGHTS.activity,
            pillarWeight: DEFAULT_WEIGHTS.pillar,
            taskWeight: DEFAULT_WEIGHTS.task,
            consistencyWeight: DEFAULT_WEIGHTS.consistency,
            evaluationWeight: DEFAULT_WEIGHTS.evaluation
          }
        })
      }

      return {
        id: config.id,
        activityWeight: config.activityWeight ?? config.activity_weight,
        pillarWeight: config.pillarWeight ?? config.pillar_weight,
        taskWeight: config.taskWeight ?? config.task_weight,
        consistencyWeight: config.consistencyWeight ?? config.consistency_weight,
        evaluationWeight: config.evaluationWeight ?? config.evaluation_weight,
        total: (config.activityWeight ?? config.activity_weight) + 
               (config.pillarWeight ?? config.pillar_weight) + 
               (config.taskWeight ?? config.task_weight) + 
               (config.consistencyWeight ?? config.consistency_weight) + 
               (config.evaluationWeight ?? config.evaluation_weight)
      }
    } else {
      // Fallback: raw SQL
      const rows = await prisma.$queryRaw<any[]>`
        SELECT * FROM scoring_configs WHERE name = 'default' LIMIT 1
      `
      if (rows.length > 0) {
        const row = rows[0]
        return {
          id: row.id,
          activityWeight: row.activity_weight,
          pillarWeight: row.pillar_weight,
          taskWeight: row.task_weight,
          consistencyWeight: row.consistency_weight,
          evaluationWeight: row.evaluation_weight,
          total: row.activity_weight + row.pillar_weight + row.task_weight +
                 row.consistency_weight + row.evaluation_weight
        }
      } else {
        // Create default via raw SQL
        await prisma.$executeRaw`
          INSERT INTO scoring_configs (id, name, activity_weight, pillar_weight, task_weight, consistency_weight, evaluation_weight, created_at, updated_at)
          VALUES (gen_random_uuid(), 'default', ${DEFAULT_WEIGHTS.activity}, ${DEFAULT_WEIGHTS.pillar}, ${DEFAULT_WEIGHTS.task}, ${DEFAULT_WEIGHTS.consistency}, ${DEFAULT_WEIGHTS.evaluation}, NOW(), NOW())
          ON CONFLICT (name) DO NOTHING
        `
        return {
          id: null,
          activityWeight: DEFAULT_WEIGHTS.activity,
          pillarWeight: DEFAULT_WEIGHTS.pillar,
          taskWeight: DEFAULT_WEIGHTS.task,
          consistencyWeight: DEFAULT_WEIGHTS.consistency,
          evaluationWeight: DEFAULT_WEIGHTS.evaluation,
          total: 100
        }
      }
    }
  } catch (error) {
    console.error("Error getting scoring config:", error)
    return {
      id: null,
      activityWeight: DEFAULT_WEIGHTS.activity,
      pillarWeight: DEFAULT_WEIGHTS.pillar,
      taskWeight: DEFAULT_WEIGHTS.task,
      consistencyWeight: DEFAULT_WEIGHTS.consistency,
      evaluationWeight: DEFAULT_WEIGHTS.evaluation,
      total: 100
    }
  }
}

// Update scoring config (Admin only)
export async function updateScoringConfig(data: {
  activityWeight: number
  pillarWeight: number
  taskWeight: number
  consistencyWeight: number
  evaluationWeight: number
}) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  // Validate total = 100
  const total = data.activityWeight + data.pillarWeight + data.taskWeight + 
                data.consistencyWeight + data.evaluationWeight
  if (total !== 100) {
    throw new Error(`Total bobot harus 100%, saat ini: ${total}%`)
  }

  // Validate each weight between 0-100
  const weights = Object.values(data)
  if (weights.some(w => w < 0 || w > 100)) {
    throw new Error("Setiap bobot harus antara 0-100%")
  }

  try {
    if (hasScoringConfigModel()) {
      const config = await (prisma as any).scoringConfig.upsert({
        where: { name: "default" },
        update: {
          activityWeight: data.activityWeight,
          pillarWeight: data.pillarWeight,
          taskWeight: data.taskWeight,
          consistencyWeight: data.consistencyWeight,
          evaluationWeight: data.evaluationWeight
        },
        create: {
          name: "default",
          activityWeight: data.activityWeight,
          pillarWeight: data.pillarWeight,
          taskWeight: data.taskWeight,
          consistencyWeight: data.consistencyWeight,
          evaluationWeight: data.evaluationWeight
        }
      })
      return { success: true, config }
    } else {
      // Fallback: raw SQL upsert
      await prisma.$executeRaw`
        INSERT INTO scoring_configs (id, name, activity_weight, pillar_weight, task_weight, consistency_weight, evaluation_weight, created_at, updated_at)
        VALUES (gen_random_uuid(), 'default', ${data.activityWeight}, ${data.pillarWeight}, ${data.taskWeight}, ${data.consistencyWeight}, ${data.evaluationWeight}, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
          activity_weight = ${data.activityWeight},
          pillar_weight = ${data.pillarWeight},
          task_weight = ${data.taskWeight},
          consistency_weight = ${data.consistencyWeight},
          evaluation_weight = ${data.evaluationWeight},
          updated_at = NOW()
      `
      return { success: true, config: null }
    }
  } catch (error) {
    console.error("Error updating scoring config:", error)
    throw new Error("Gagal menyimpan konfigurasi")
  }
}

// Calculate Activity Score (max 100)
async function calculateActivityScore(userId: string): Promise<number> {
  const targets = {
    monthlyActivities: 20,
    avgDuration: 60
  }

  const stats = await prisma.pastoralActivity.aggregate({
    where: {
      userId,
      date: { gte: new Date(new Date().setDate(1)) } // This month
    },
    _count: { id: true },
    _avg: { duration: true }
  })

  const count = stats._count.id || 0
  const avgDuration = stats._avg.duration || 0

  // Score = (actual/target) * weight, capped at 100
  const countScore = Math.min(80, (count / targets.monthlyActivities) * 80)
  const durationScore = Math.min(20, (avgDuration / targets.avgDuration) * 20)

  return Math.round(countScore + durationScore)
}

// Calculate Pillar Balance Score (max 100)
async function calculatePillarBalanceScore(userId: string): Promise<number> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const activities = await prisma.pastoralActivity.groupBy({
    by: ['pillar'],
    where: {
      userId,
      date: { gte: thirtyDaysAgo }
    },
    _count: { id: true }
  })

  const pillars = ["LITURGIA", "DIAKONIA", "KERYGMA", "KOINONIA", "MARTYRIA"]
  const counts = pillars.map(p => {
    const found = activities.find(a => a.pillar === p)
    return found?._count.id || 0
  })

  // If no activities, return 0
  if (counts.every(c => c === 0)) return 0

  const avg = counts.reduce((a, b) => a + b, 0) / pillars.length
  if (avg === 0) return 0

  // Calculate coefficient of variation
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / pillars.length
  const stdDev = Math.sqrt(variance)
  const cv = stdDev / avg

  // Score: 100 - (cv * 50), capped at 0-100
  const score = Math.max(0, Math.min(100, 100 - (cv * 50)))
  return Math.round(score)
}

// Calculate Task Score (max 100)
async function calculateTaskScore(userId: string): Promise<number> {
  const stats = await prisma.pastoralTask.aggregate({
    where: {
      OR: [
        { assignedTo: userId },
        { createdBy: userId }
      ]
    },
    _count: { id: true }
  })

  const completedStats = await prisma.pastoralTask.count({
    where: {
      OR: [
        { assignedTo: userId },
        { createdBy: userId }
      ],
      status: "COMPLETED"
    }
  })

  const total = stats._count.id || 0
  if (total === 0) return 50 // Neutral if no tasks

  return Math.round((completedStats / total) * 100)
}

// Calculate Consistency Score (max 100)
async function calculateConsistencyScore(userId: string): Promise<number> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get unique active days
  const activities = await prisma.pastoralActivity.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo }
    },
    select: { date: true },
    orderBy: { date: 'desc' }
  })

  // Count unique days
  const uniqueDays = new Set(
    activities.map(a => a.date.toISOString().split('T')[0])
  )
  const daysCount = uniqueDays.size

  // Calculate streak
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const sortedDates = Array.from(uniqueDays).sort().reverse()
  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    const expectedStr = expectedDate.toISOString().split('T')[0]
    
    if (sortedDates[i] === expectedStr) {
      streak++
    } else {
      break
    }
  }

  const target = 20 // Target active days/month

  // Active days score (60%) + streak bonus (40%)
  const daysScore = Math.min(60, (daysCount / target) * 60)
  const streakScore = Math.min(40, (streak / 7) * 40) // 7-day streak = full bonus

  return Math.round(daysScore + streakScore)
}

// NEW: Calculate Evaluation Score (max 100)
async function calculateEvaluationScore(userId: string): Promise<number> {
  try {
    // Get all evaluation answers for this user as appraisee
    const submissions = await prisma.evaluationSubmission.findMany({
      where: {
        appraiseeId: userId,
        isFinal: true
      },
      include: {
        answers: {
          where: {
            scoreValue: { not: null }
          },
          select: { scoreValue: true }
        }
      }
    })

    if (submissions.length === 0) return 50 // Neutral if no evaluations

    // Calculate average of all score values (1-5 scale, convert to 0-100)
    const allScores: number[] = []
    submissions.forEach(sub => {
      sub.answers.forEach(ans => {
        if (ans.scoreValue) {
          allScores.push(ans.scoreValue)
        }
      })
    })

    if (allScores.length === 0) return 50

    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length
    // Convert 1-5 scale to 0-100 scale
    return Math.round(((avgScore - 1) / 4) * 100)
  } catch (error) {
    console.error("Error calculating evaluation score:", error)
    return 50
  }
}

// Get rank based on score
function getRank(score: number): string {
  if (score >= 90) return "🥇 Excellent"
  if (score >= 75) return "🥈 Very Good"
  if (score >= 60) return "🥉 Good"
  if (score >= 45) return "📈 Progressing"
  return "💪 Needs Improvement"
}

// Main function: Calculate user's total score with dynamic weights
export async function calculateUserScore(userId?: string): Promise<ScoreBreakdown> {
  const session = await auth()
  const targetUserId = userId || session?.user?.id

  if (!targetUserId) {
    throw new Error("Unauthorized")
  }

  try {
    // Get weights from config
    const weights = await getScoringWeights()

    // Calculate all component scores in parallel
    const [activityScore, pillarBalanceScore, taskScore, consistencyScore, evaluationScore] = 
      await Promise.all([
        calculateActivityScore(targetUserId),
        calculatePillarBalanceScore(targetUserId),
        calculateTaskScore(targetUserId),
        calculateConsistencyScore(targetUserId),
        calculateEvaluationScore(targetUserId)
      ])

    // Calculate weighted total
    const totalScore = Math.round(
      (activityScore * weights.activity / 100) +
      (pillarBalanceScore * weights.pillar / 100) +
      (taskScore * weights.task / 100) +
      (consistencyScore * weights.consistency / 100) +
      (evaluationScore * weights.evaluation / 100)
    )

    return {
      activityScore,
      pillarBalanceScore,
      taskScore,
      consistencyScore,
      evaluationScore,
      totalScore,
      rank: getRank(totalScore),
      weights
    }
  } catch (error) {
    console.error("Error calculating score:", error)
    return {
      activityScore: 0,
      pillarBalanceScore: 0,
      taskScore: 0,
      consistencyScore: 0,
      evaluationScore: 0,
      totalScore: 0,
      rank: "Error",
      weights: DEFAULT_WEIGHTS
    }
  }
}

// Get leaderboard (all staff ranked)
export async function getLeaderboard() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Get all staff users using Prisma Client
    const users = await prisma.user.findMany({
      where: { role: "PASTORAL_STAFF" },
      select: { id: true, name: true, email: true }
    })

    // Calculate score for each user
    const leaderboard = await Promise.all(
      users.map(async (user) => {
        const score = await calculateUserScore(user.id)
        return {
          userId: user.id,
          userName: user.name || user.email,
          ...score
        }
      })
    )

    // Sort by total score descending
    leaderboard.sort((a, b) => b.totalScore - a.totalScore)

    // Add position
    return leaderboard.map((entry, index) => ({
      ...entry,
      position: index + 1,
      medal: index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null
    }))
  } catch (error) {
    console.error("Error getting leaderboard:", error)
    return []
  }
}

// Get my score
export async function getMyScore() {
  return calculateUserScore()
}

// Get leaderboard summary stats (for analytics)
export async function getLeaderboardStats() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    const leaderboard = await getLeaderboard()
    if (leaderboard.length === 0) {
      return { average: 0, highest: 0, lowest: 0, median: 0, count: 0 }
    }

    const scores = leaderboard.map(l => l.totalScore)
    const sorted = [...scores].sort((a, b) => a - b)

    return {
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      median: sorted[Math.floor(sorted.length / 2)],
      count: scores.length
    }
  } catch (error) {
    console.error("Error getting leaderboard stats:", error)
    return { average: 0, highest: 0, lowest: 0, median: 0, count: 0 }
  }
}
