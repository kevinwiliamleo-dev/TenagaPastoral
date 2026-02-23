"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// Types for raw query results
// Types for raw query results
interface DbPeriod {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: string
}

interface DbUser {
  id: string
  email: string
  name: string | null
  role: string
}

interface DbSubmission {
  id: string
  appraiserId: string
  appraiseeId: string
  periodId: string
  isFinal: boolean
  submittedAt: Date
}

interface DbAnswer {
  id: string
  submissionId: string
  questionId: string
  scoreValue: number | null
  textValue: string | null
  questionText?: string
  weight?: number
  category?: string
}

interface StaffReportData {
  userId: string
  userName: string
  userEmail: string
  averageScore: number
  totalEvaluations: number
  status: "completed" | "pending" | "not_started"
}

interface PeriodReportData {
  periodId: string
  periodName: string
  startDate: Date
  endDate: Date
  staffReports: StaffReportData[]
}

// Get all periods for reports
export async function getPeriodsForReports() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const periods = await prisma.$queryRaw<DbPeriod[]>`
    SELECT id, name, "startDate", "endDate", status 
    FROM evaluation_periods 
    ORDER BY "startDate" DESC
  `

  return periods.map(p => ({
    id: p.id,
    name: p.name,
    startDate: p.startDate,
    endDate: p.endDate,
    status: p.status,
  }))
}

// Get staff report summary for a period (Admin view) - OPTIMIZED
export async function getStaffReportSummary(periodId: string): Promise<StaffReportData[]> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  // Single optimized query with LEFT JOINs (replaces N+1 pattern)
  interface StaffReportRow {
    id: string
    email: string
    name: string | null
    total_evaluations: bigint
    avg_score: number | null
    draft_count: bigint
  }

  const results = await prisma.$queryRaw<StaffReportRow[]>`
    SELECT 
      u.id,
      u.email,
      u.name,
      COUNT(DISTINCT CASE WHEN es."isFinal" = true THEN es.id END) as total_evaluations,
      AVG(CASE WHEN es."isFinal" = true THEN a."scoreValue" END) as avg_score,
      COUNT(DISTINCT CASE WHEN es."isFinal" = false THEN es.id END) as draft_count
    FROM users u
    LEFT JOIN evaluation_submissions es ON es."appraiseeId" = u.id AND es."periodId" = ${periodId}
    LEFT JOIN answers a ON a."submissionId" = es.id AND a."scoreValue" IS NOT NULL
    WHERE u.role = 'PASTORAL_STAFF'
    GROUP BY u.id, u.email, u.name
    ORDER BY avg_score DESC NULLS LAST
  `

  return results.map(row => {
    const totalEvaluations = Number(row.total_evaluations || 0)
    const draftCount = Number(row.draft_count || 0)
    
    let status: "completed" | "pending" | "not_started" = "not_started"
    if (totalEvaluations > 0) {
      status = "completed"
    } else if (draftCount > 0) {
      status = "pending"
    }

    return {
      userId: row.id,
      userName: row.name || row.email,
      userEmail: row.email,
      averageScore: Math.round(Number(row.avg_score || 0) * 10) / 10,
      totalEvaluations,
      status,
    }
  })
}

// Get detailed report for a specific user in a period
export async function getDetailedReport(periodId: string, userId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if user has access (admin or self)
  if (session.user.role !== "ADMIN" && session.user.id !== userId) {
    throw new Error("Unauthorized - You can only view your own report")
  }

  // Get user info
  const users = await prisma.$queryRaw<DbUser[]>`
    SELECT id, email, name, role FROM users WHERE id = ${userId} LIMIT 1
  `

  if (users.length === 0) {
    throw new Error("User not found")
  }

  const user = users[0]

  // Get period info
  const periods = await prisma.$queryRaw<DbPeriod[]>`
    SELECT id, name, "startDate", "endDate", status
    FROM evaluation_periods WHERE id = ${periodId} LIMIT 1
  `

  if (periods.length === 0) {
    throw new Error("Period not found")
  }

  const period = periods[0]

  // Get all finalized submissions for this user in this period with appraiser info
  const submissions = await prisma.$queryRaw<(DbSubmission & { appraiser_name: string | null })[]>`
    SELECT 
      es.id, es."appraiserId", es."appraiseeId", es."periodId", es."isFinal", es."submittedAt",
      u.name as appraiser_name
    FROM evaluation_submissions es
    LEFT JOIN users u ON es."appraiserId" = u.id
    WHERE es."appraiseeId" = ${userId} 
      AND es."periodId" = ${periodId}
      AND es."isFinal" = true
    ORDER BY es."submittedAt" DESC
  `

  // OPTIMIZED: Fetch all answers in single query instead of N+1 loop
  // OPTIMIZED: Fetch all answers in single query instead of N+1 loop
  interface AnswerRow {
    submissionId: string
    questionId: string
    question_text: string
    scoreValue: number | null
    textValue: string | null
    weight: number
    category: string
  }

  // Get submission IDs for the IN clause
  const submissionIds = submissions.map(s => s.id)
  
  let allAnswers: { 
    submissionId: string;
    questionId: string;
    questionText: string; 
    score: number | null; 
    text: string | null;
    weight?: number;
    category?: string;
  }[] = []

  if (submissionIds.length > 0) {
    const answers = await prisma.$queryRaw<AnswerRow[]>`
      SELECT 
        a."submissionId",
        a."questionId",
        q.text as question_text, 
        a."scoreValue", 
        a."textValue", 
        COALESCE(q.weight, 1) as weight, 
        COALESCE(q.category, 'General') as category
      FROM answers a
      JOIN questions q ON a."questionId" = q.id
      WHERE a."submissionId" = ANY(${submissionIds}::text[])
    `

    allAnswers = answers.map(a => ({
      submissionId: a.submissionId,
      questionId: a.questionId,
      questionText: a.question_text,
      score: a.scoreValue,
      text: a.textValue,
      weight: a.weight,
      category: a.category,
    }))
  }

  // Calculate weighted average score & Question Scores
  const scoreAnswers = allAnswers.filter(a => a.score !== null)
  
  let totalWeightedScore = 0
  
  // Group by question for detailed report
  const questionAgg: Record<string, { text: string; total: number; count: number }> = {}
  
  // Calculate totals
  let totalWeight = 0
  
  if (scoreAnswers.length > 0) {
    scoreAnswers.forEach(a => {
      const weight = a.weight || 1
      totalWeightedScore += (a.score || 0) * weight
      totalWeight += weight

      // Per question aggregation
      if (!questionAgg[a.questionId]) {
        questionAgg[a.questionId] = { text: a.questionText, total: 0, count: 0 }
      }
      questionAgg[a.questionId].total += (a.score || 0)
      questionAgg[a.questionId].count += 1
    })
  }

  const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0

  // Format Question Scores
  const questionScores = Object.entries(questionAgg).map(([qid, data]) => ({
    questionId: qid,
    questionText: data.text,
    averageScore: data.count > 0 ? data.total / data.count : 0,
    totalResponses: data.count,
    questionType: "Scale" // Default
  })).sort((a, b) => b.averageScore - a.averageScore)

  // Prepare Radar Chart Data (Group by Category)
  const categoryScores: Record<string, { total: number; count: number }> = {}
  
  scoreAnswers.forEach(a => {
    const cat = a.category || "General"
    if (!categoryScores[cat]) {
      categoryScores[cat] = { total: 0, count: 0 }
    }
    categoryScores[cat].total += (a.score || 0)
    categoryScores[cat].count += 1
  })

  // Normalize for chart (1-5)
  const radarData = Object.entries(categoryScores).map(([category, data]) => ({
    category,
    score: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
    fullMark: 5,
  }))

  // Get text feedback (comments) - Enriched
  const feedback = allAnswers
    .filter(a => a.text)
    .map(a => {
      const sub = submissions.find(s => s.id === a.submissionId)
      return {
        question: a.questionText,
        comment: a.text || "",
        evaluatorName: sub?.appraiser_name || "Anonymous",
        submittedAt: sub?.submittedAt || new Date(),
      }
    })

  return {
    user: {
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      role: user.role,
    },
    period: {
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
    },
    summary: {
      overallScore: Math.round(overallScore * 10) / 10,
      totalEvaluations: submissions.length,
      totalQuestions: scoreAnswers.length,
    },
    radarData,
    feedback: feedback, // Return all feedback
    questionScores, // Added for Print/Detail view
  }
}

// Get my own report (for staff)
export async function getMyReport(periodId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return getDetailedReport(periodId, session.user.id)
}

// Get report statistics for dashboard
export async function getReportStats(periodId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  // Total staff
  const staffCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM users WHERE role = 'PASTORAL_STAFF'
  `

  // Completed evaluations
  const completedCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT "appraiseeId") as count 
    FROM evaluation_submissions 
    WHERE "periodId" = ${periodId} AND "isFinal" = true
  `

  // Pending evaluations (drafts)
  const pendingCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT "appraiseeId") as count 
    FROM evaluation_submissions 
    WHERE "periodId" = ${periodId} AND "isFinal" = false
  `

  // Average score across all
  const avgScore = await prisma.$queryRaw<{ avg_score: number }[]>`
    SELECT COALESCE(AVG(a."scoreValue"), 0) as avg_score
    FROM evaluation_submissions es
    JOIN answers a ON a."submissionId" = es.id
    WHERE es."periodId" = ${periodId} AND es."isFinal" = true AND a."scoreValue" IS NOT NULL
  `

  return {
    totalStaff: Number(staffCount[0]?.count || 0),
    completed: Number(completedCount[0]?.count || 0),
    pending: Number(pendingCount[0]?.count || 0),
    notStarted: Number(staffCount[0]?.count || 0) - Number(completedCount[0]?.count || 0) - Number(pendingCount[0]?.count || 0),
    averageScore: Math.round(Number(avgScore[0]?.avg_score || 0) * 10) / 10,
  }
}

// Get chart data for dashboard - OPTIMIZED
export async function getDashboardChartData(periodId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  // Single optimized query to get all answers with submission grouping
  interface ChartDataRow {
    submissionId: string
    scoreValue: number | null
    weight: number
    category: string
  }

  const allData = await prisma.$queryRaw<ChartDataRow[]>`
    SELECT 
      es.id as "submissionId",
      a."scoreValue",
      COALESCE(q.weight, 1) as weight,
      COALESCE(q.category, 'General') as category
    FROM evaluation_submissions es
    JOIN answers a ON a."submissionId" = es.id
    JOIN questions q ON a."questionId" = q.id
    WHERE es."periodId" = ${periodId} 
      AND es."isFinal" = true
      AND a."scoreValue" IS NOT NULL
  `

  if (allData.length === 0) {
    return { barData: [], radarData: [] }
  }

  // Group by submission_id to calculate per-submission weighted averages
  const submissionScores: Record<string, { totalWeightedScore: number; totalWeight: number }> = {}
  const categoryTotals: Record<string, { total: number; count: number }> = {}

  for (const row of allData) {
    const w = row.weight || 1
    const score = row.scoreValue || 0
    const cat = row.category || "General"

    // Accumulate per-submission
    if (!submissionScores[row.submissionId]) {
      submissionScores[row.submissionId] = { totalWeightedScore: 0, totalWeight: 0 }
    }
    submissionScores[row.submissionId].totalWeightedScore += score * w
    submissionScores[row.submissionId].totalWeight += w

    // Accumulate category totals
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { total: 0, count: 0 }
    }
    categoryTotals[cat].total += score
    categoryTotals[cat].count += 1
  }

  // Build score distribution
  const scoreDistribution: Record<string, number> = {
    "0-1": 0, "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0
  }

  for (const subId of Object.keys(submissionScores)) {
    const sub = submissionScores[subId]
    const avg = sub.totalWeight > 0 ? sub.totalWeightedScore / sub.totalWeight : 0
    
    if (avg <= 1) scoreDistribution["0-1"]++
    else if (avg <= 2) scoreDistribution["1-2"]++
    else if (avg <= 3) scoreDistribution["2-3"]++
    else if (avg <= 4) scoreDistribution["3-4"]++
    else scoreDistribution["4-5"]++
  }

  // Format Bar Data
  const barData = Object.entries(scoreDistribution).map(([range, count]) => ({
    name: range,
    count: count,
  }))

  // Format Radar Data
  const radarData = Object.entries(categoryTotals).map(([category, data]) => ({
    category,
    score: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
    fullMark: 5,
  }))

  return { barData, radarData }
}
