"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// Get Overview Analytics (Scores, Trends)
export async function getOverviewAnalytics(periodId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  // 1. Score Distribution (Pie/Bar)
  const scoreDistribution = {
    "0-1": 0, "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0
  }
  
  // 2. Trend Data (Line) - Average score per period (Historical)
  const periods = await prisma.evaluationPeriod.findMany({
    where: { status: { in: ["ACTIVE", "CLOSED"] } },
    orderBy: { startDate: "asc" },
    select: { id: true, name: true }
  })

  const trendData = []

  for (const period of periods) {
    const submissions = await prisma.evaluationSubmission.findMany({
      where: { periodId: period.id, isFinal: true },
      include: { answers: true }
    })

    if (submissions.length === 0) {
      trendData.push({ name: period.name, avg: 0 })
      continue
    }

    // Simple average calculation for trend (can be improved to weighted)
    let periodTotalScore = 0
    let periodCount = 0

    submissions.forEach(sub => {
       const subTotal = sub.answers.reduce((acc, a) => acc + (a.scoreValue || 0), 0)
       const subAvg = sub.answers.length > 0 ? subTotal / sub.answers.length : 0
       periodTotalScore += subAvg
       periodCount++
    })

    trendData.push({ 
      name: period.name, 
      avg: periodCount > 0 ? Math.round((periodTotalScore / periodCount) * 10) / 10 : 0 
    })
  }

  // 3. Current Period Stats
  const currentSubmissions = await prisma.evaluationSubmission.findMany({
    where: { periodId, isFinal: true },
    include: { answers: true }
  })

  currentSubmissions.forEach(sub => {
     const subTotal = sub.answers.reduce((acc, a) => acc + (a.scoreValue || 0), 0)
     const subAvg = sub.answers.length > 0 ? subTotal / sub.answers.length : 0
     
     if (subAvg <= 1) scoreDistribution["0-1"]++
     else if (subAvg <= 2) scoreDistribution["1-2"]++
     else if (subAvg <= 3) scoreDistribution["2-3"]++
     else if (subAvg <= 4) scoreDistribution["3-4"]++
     else scoreDistribution["4-5"]++
  })

  return { trendData, scoreDistribution }
}

// Get Productivity Analytics (Tasks, Activities)
export async function getProductivityAnalytics(startDate: Date, endDate: Date) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  // 1. Task Completion Rate
  const totalTasks = await prisma.pastoralTask.count({
    where: { updatedAt: { gte: startDate, lte: endDate } }
  })
  
  const completedTasks = await prisma.pastoralTask.count({
    where: { 
      status: "COMPLETED",
      updatedAt: { gte: startDate, lte: endDate }
    }
  })

  // 2. Panca Tugas Distribution (Pie/Bar) by Pillar
  const activities = await prisma.pastoralActivity.findMany({
    where: { date: { gte: startDate, lte: endDate } }
  })

  const pillarStats = {
    LITURGIA: 0, DIAKONIA: 0, KERYGMA: 0, KOINONIA: 0, MARTYRIA: 0
  }

  activities.forEach(act => {
    if (pillarStats[act.pillar] !== undefined) {
      pillarStats[act.pillar] += act.duration // Total minutes
    }
  })

  // Convert to array
  const pillarData = Object.entries(pillarStats).map(([name, value]) => ({
    name, value: Math.round(value / 60) // Convert to hours
  }))

  return {
    taskStats: { total: totalTasks, completed: completedTasks, rate: totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0 },
    pillarData
  }
}

// Get specific staff score trend across all periods
// Get specific staff score trend across all periods
export async function getStaffScoreTrend(userId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Fetch all closed/active periods ordered by date
  const periods = await prisma.evaluationPeriod.findMany({
    where: { status: { in: ["ACTIVE", "CLOSED"] } },
    orderBy: { startDate: "asc" },
    select: { id: true, name: true }
  })

  // OPTIMIZATION: Fetch all submissions in one query instead of looping (N+1 fix)
  const submissions = await prisma.evaluationSubmission.findMany({
    where: {
      appraiseeId: userId,
      isFinal: true,
      periodId: { in: periods.map(p => p.id) }
    },
    include: { answers: true }
  })

  const trendData = []

  for (const period of periods) {
    // Find matching submission in memory
    const submission = submissions.find(s => s.periodId === period.id)

    if (!submission) {
      continue
    }

    const totalScore = submission.answers.reduce((acc, a) => acc + (a.scoreValue || 0), 0)
    const avgScore = submission.answers.length > 0 ? totalScore / submission.answers.length : 0

    trendData.push({
      period: period.name,
      score: Math.round(avgScore * 10) / 10
    })
  }

  return trendData
}

// Get activity heatmap data (last 365 days)
export async function getActivityHeatmap(userId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  // Query raw to group by date
  // Postgres truncates to day
  const dailyActivity = await prisma.$queryRaw<Array<{ day: Date, count: bigint }>>`
    SELECT 
      DATE_TRUNC('day', date) as day,
      COUNT(*) as count
    FROM pastoral_activities
    WHERE "userId" = ${userId}
      AND date >= ${oneYearAgo}
    GROUP BY DATE_TRUNC('day', date)
    ORDER BY day ASC
  `

  return dailyActivity.map(d => ({
    date: d.day.toISOString().split('T')[0], // YYYY-MM-DD
    count: Number(d.count),
    level: Number(d.count) > 4 ? 4 : Number(d.count) // Simple level capping 0-4
  }))
}

// Get details for a specific pillar (category) in a period
export async function getPillarDetails(periodId: string, category: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  // Get all answers for questions in this category for the active period
  const answers = await prisma.answer.findMany({
    where: {
      question: { category: category },
      submission: {
        periodId: periodId,
        isFinal: true
      },
      scoreValue: { not: null }
    },
    include: {
      question: true
    }
  })

  // Group by question
  const questionStats: Record<string, { text: string; total: number; count: number }> = {}

  answers.forEach(a => {
    const qId = a.questionId
    if (!questionStats[qId]) {
      questionStats[qId] = {
        text: a.question.text,
        total: 0,
        count: 0
      }
    }
    questionStats[qId].total += (a.scoreValue || 0)
    questionStats[qId].count += 1
  })

  // Format result
  const questions = Object.values(questionStats).map(stat => ({
    question: stat.text,
    average: stat.count > 0 ? Math.round((stat.total / stat.count) * 10) / 10 : 0,
    count: stat.count
  })).sort((a, b) => a.average - b.average) // Lowest scores first to highlight areas for improvement

  // Calculate overall category average
  const totalScore = answers.reduce((acc, a) => acc + (a.scoreValue || 0), 0)
  const categoryAverage = answers.length > 0 ? Math.round((totalScore / answers.length) * 10) / 10 : 0

  return {
    category,
    average: categoryAverage,
    questions
  }
}
