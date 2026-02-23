"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// Monthly activity count for chart
export async function getMonthlyActivityStats() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Get last 6 months of activity counts
    const stats = await prisma.$queryRaw<Array<{
      month: Date
      count: bigint
      total_duration: bigint
    }>>`
      SELECT 
        DATE_TRUNC('month', date) as month,
        COUNT(*) as count,
        SUM(duration) as total_duration
      FROM pastoral_activities
      WHERE "userId" = ${session.user.id}
        AND date >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `

    return stats.map(s => ({
      month: s.month,
      count: Number(s.count),
      totalDuration: Number(s.total_duration || 0)
    }))
  } catch (error) {
    console.error("Error fetching monthly stats:", error)
    return []
  }
}

// Pillar balance stats for radar chart
export async function getPillarBalanceStats() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const stats = await prisma.$queryRaw<Array<{
      pillar: string
      count: bigint
      total_duration: bigint
    }>>`
      SELECT 
        pillar,
        COUNT(*) as count,
        SUM(duration) as total_duration
      FROM pastoral_activities
      WHERE "userId" = ${session.user.id}
      GROUP BY pillar
    `

    const pillars = ["LITURGIA", "DIAKONIA", "KERYGMA", "KOINONIA", "MARTYRIA"]
    
    return pillars.map(p => {
      const stat = stats.find(s => s.pillar === p)
      return {
        pillar: p,
        count: stat ? Number(stat.count) : 0,
        totalDuration: stat ? Number(stat.total_duration || 0) : 0
      }
    })
  } catch (error) {
    console.error("Error fetching pillar balance:", error)
    return []
  }
}

// Task completion stats
export async function getTaskCompletionStats() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const stats = await prisma.$queryRaw<Array<{
      status: string
      count: bigint
    }>>`
      SELECT status, COUNT(*) as count
      FROM pastoral_tasks
      WHERE "createdBy" = ${session.user.id}
         OR "assignedTo" = ${session.user.id}
      GROUP BY status
    `

    const todo = Number(stats.find(s => s.status === "TODO")?.count || 0)
    const inProgress = Number(stats.find(s => s.status === "IN_PROGRESS")?.count || 0)
    const completed = Number(stats.find(s => s.status === "COMPLETED")?.count || 0)
    const total = todo + inProgress + completed

    return {
      todo,
      inProgress,
      completed,
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  } catch (error) {
    console.error("Error fetching task stats:", error)
    return { todo: 0, inProgress: 0, completed: 0, total: 0, completionRate: 0 }
  }
}

// Activity streak (consecutive active days)
export async function getActivityStreak() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Get unique activity dates for last 30 days
    const dates = await prisma.$queryRaw<Array<{ date: Date }>>`
      SELECT DISTINCT DATE(date) as date
      FROM pastoral_activities
      WHERE "userId" = ${session.user.id}
        AND date >= NOW() - INTERVAL '30 days'
      ORDER BY date DESC
    `

    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 }

    // Calculate current streak (consecutive days from today backward)
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < dates.length; i++) {
      const activityDate = new Date(dates[i].date)
      activityDate.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      
      if (activityDate.getTime() === expectedDate.getTime()) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak in last 30 days
    let longestStreak = 1
    let tempStreak = 1
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1].date)
      const currDate = new Date(dates[i].date)
      
      const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    return { currentStreak, longestStreak }
  } catch (error) {
    console.error("Error fetching streak:", error)
    return { currentStreak: 0, longestStreak: 0 }
  }
}

// Get overall performance summary
export async function getPerformanceSummary() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const summary = await prisma.$queryRaw<Array<{
      total_activities: bigint
      total_duration: bigint
      this_month_activities: bigint
      avg_duration: number
    }>>`
      SELECT 
        COUNT(*) as total_activities,
        COALESCE(SUM(duration), 0) as total_duration,
        COUNT(*) FILTER (WHERE date >= DATE_TRUNC('month', NOW())) as this_month_activities,
        COALESCE(AVG(duration), 0) as avg_duration
      FROM pastoral_activities
      WHERE "userId" = ${session.user.id}
    `

    return {
      totalActivities: Number(summary[0]?.total_activities || 0),
      totalDuration: Number(summary[0]?.total_duration || 0),
      thisMonthActivities: Number(summary[0]?.this_month_activities || 0),
      avgDuration: Math.round(Number(summary[0]?.avg_duration || 0))
    }
  } catch (error) {
    console.error("Error fetching performance summary:", error)
    return { totalActivities: 0, totalDuration: 0, thisMonthActivities: 0, avgDuration: 0 }
  }
}
