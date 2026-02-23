import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getMyGoals, getGoalStats, type Goal } from "@/lib/actions/goals"
import { GoalsClient } from "./goals-client"

export default async function GoalsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let goals: Goal[] = []
  let stats = { pending: 0, active: 0, completed: 0, cancelled: 0, rejected: 0, total: 0 }

  try {
    const [goalsData, statsData] = await Promise.all([
      getMyGoals(),
      getGoalStats()
    ])
    goals = goalsData
    stats = statsData
  } catch (error) {
    console.error("Error fetching goals:", error)
  }

  return (
    <GoalsClient
      initialGoals={goals}
      stats={stats}
      userName={session.user.name || "Staff"}
    />
  )
}
