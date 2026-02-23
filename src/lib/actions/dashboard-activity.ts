"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export interface RecentActivity {
  id: string
  type: "activity" | "task" | "goal" | "evaluation" | "system"
  icon: string
  iconColor: string
  userName: string
  description: string
  timeAgo: string
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m lalu`
  if (diffHours < 24) return `${diffHours}j lalu`
  if (diffDays < 7) return `${diffDays}h lalu`
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
}

export async function getRecentActivities(): Promise<RecentActivity[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const isAdmin = session.user.role === "ADMIN"
  const activities: RecentActivity[] = []

  try {
    if (isAdmin) {
      // Admin: Get system-wide activities
      
      // Recent pastoral activities from all users
      const recentActivities = await prisma.$queryRaw<Array<{
        id: string
        pillar: string
        title: string
        date: Date
        userName: string
      }>>`
        SELECT 
          pa.id, pa.pillar, pa.title, pa.date,
          u.name as "userName"
        FROM pastoral_activities pa
        JOIN users u ON pa."userId" = u.id
        ORDER BY pa.date DESC
        LIMIT 3
      `

      for (const act of recentActivities) {
        activities.push({
          id: act.id,
          type: "activity",
          icon: "add_circle",
          iconColor: "text-green-500 bg-green-500/10",
          userName: act.userName || "User",
          description: `Mencatat aktivitas ${act.pillar}: ${act.title}`,
          timeAgo: formatTimeAgo(new Date(act.date))
        })
      }

      // Recent task completions - using correct column name completed_at
      const recentTasks = await prisma.$queryRaw<Array<{
        id: string
        title: string
        completed_at: Date
        userName: string
      }>>`
        SELECT 
          pt.id, pt.title, pt.completed_at,
          u.name as "userName"
        FROM pastoral_tasks pt
        JOIN users u ON pt."assignedTo" = u.id
        WHERE pt.status = 'COMPLETED' AND pt.completed_at IS NOT NULL
        ORDER BY pt.completed_at DESC
        LIMIT 2
      `

      for (const task of recentTasks) {
        activities.push({
          id: task.id,
          type: "task",
          icon: "task_alt",
          iconColor: "text-blue-500 bg-blue-500/10",
          userName: task.userName || "User",
          description: `Menyelesaikan tugas: ${task.title}`,
          timeAgo: formatTimeAgo(new Date(task.completed_at))
        })
      }

    } else {
      // Staff: Get MY activities only
      const userId = session.user.id
      const userName = session.user.name || "Saya"

      // My recent pastoral activities
      const myActivities = await prisma.$queryRaw<Array<{
        id: string
        pillar: string
        title: string
        date: Date
      }>>`
        SELECT id, pillar, title, date
        FROM pastoral_activities
        WHERE "userId" = ${userId}
        ORDER BY date DESC
        LIMIT 3
      `

      for (const act of myActivities) {
        activities.push({
          id: act.id,
          type: "activity",
          icon: "add_circle",
          iconColor: "text-green-500 bg-green-500/10",
          userName: userName,
          description: `Mencatat aktivitas ${act.pillar}: ${act.title}`,
          timeAgo: formatTimeAgo(new Date(act.date))
        })
      }

      // My recent task completions - using correct column name completed_at
      const myTasks = await prisma.$queryRaw<Array<{
        id: string
        title: string
        completed_at: Date
      }>>`
        SELECT id, title, completed_at
        FROM pastoral_tasks
        WHERE ("assignedTo" = ${userId} OR "createdBy" = ${userId})
          AND status = 'COMPLETED' AND completed_at IS NOT NULL
        ORDER BY completed_at DESC
        LIMIT 2
      `

      for (const task of myTasks) {
        activities.push({
          id: task.id,
          type: "task",
          icon: "task_alt",
          iconColor: "text-blue-500 bg-blue-500/10",
          userName: userName,
          description: `Menyelesaikan tugas: ${task.title}`,
          timeAgo: formatTimeAgo(new Date(task.completed_at))
        })
      }

      // My goals updates - using correct column names current_value, updated_at
      const myGoals = await prisma.$queryRaw<Array<{
        id: string
        title: string
        current_value: number
        target_value: number
        updated_at: Date
      }>>`
        SELECT id, title, current_value, target_value, updated_at
        FROM staff_goals
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
        LIMIT 2
      `

      for (const goal of myGoals) {
        const progress = goal.target_value > 0 
          ? Math.round((goal.current_value / goal.target_value) * 100)
          : 0
        activities.push({
          id: goal.id,
          type: "goal",
          icon: "flag",
          iconColor: "text-purple-500 bg-purple-500/10",
          userName: userName,
          description: `Target "${goal.title}" progress: ${progress}%`,
          timeAgo: formatTimeAgo(new Date(goal.updated_at))
        })
      }
    }

    // Sort by recency and limit to 5
    activities.sort((a, b) => {
      // Parse timeAgo back to compare - this is approximate
      const getMinutes = (timeAgo: string) => {
        if (timeAgo.includes("m")) return parseInt(timeAgo)
        if (timeAgo.includes("j")) return parseInt(timeAgo) * 60
        if (timeAgo.includes("h")) return parseInt(timeAgo) * 1440
        return 99999
      }
      return getMinutes(a.timeAgo) - getMinutes(b.timeAgo)
    })

    return activities.slice(0, 5)

  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return []
  }
}
