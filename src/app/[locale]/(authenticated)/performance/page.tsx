import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { 
  getMonthlyActivityStats, 
  getPillarBalanceStats, 
  getTaskCompletionStats, 
  getActivityStreak, 
  getPerformanceSummary 
} from "@/lib/actions/performance"
import { getMyScore } from "@/lib/actions/scoring"
import { PerformanceClient } from "./performance-client"

interface MonthlyStats { month: Date; count: number; totalDuration: number }
interface PillarStats { pillar: string; count: number; totalDuration: number }

export default async function PerformancePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let monthlyStats: MonthlyStats[] = []
  let pillarBalance: PillarStats[] = []
  let taskStats = { todo: 0, inProgress: 0, completed: 0, total: 0, completionRate: 0 }
  let streak = { currentStreak: 0, longestStreak: 0 }
  let summary = { totalActivities: 0, totalDuration: 0, thisMonthActivities: 0, avgDuration: 0 }
  let score: { 
    activityScore: number
    pillarBalanceScore: number
    taskScore: number
    consistencyScore: number
    totalScore: number
    rank?: string 
  } = { activityScore: 0, pillarBalanceScore: 0, taskScore: 0, consistencyScore: 0, totalScore: 0, rank: "" }

  try {
    const [monthly, pillar, tasks, streakData, summaryData, scoreData] = await Promise.all([
      getMonthlyActivityStats(),
      getPillarBalanceStats(),
      getTaskCompletionStats(),
      getActivityStreak(),
      getPerformanceSummary(),
      getMyScore()
    ])
    monthlyStats = monthly
    pillarBalance = pillar
    taskStats = tasks
    streak = streakData
    summary = summaryData
    score = scoreData
  } catch (error) {
    console.error("Error fetching performance data:", error)
  }

  return (
    <PerformanceClient
      monthlyStats={monthlyStats}
      pillarBalance={pillarBalance}
      taskStats={taskStats}
      streak={streak}
      summary={summary}
      score={score}
      userName={session.user.name || "Staff"}
    />
  )
}

