"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { PastoralPillar } from "@/lib/constants"

// Get all staff performance comparison (Admin only)
export async function getStaffPerformanceComparison() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    const stats = await prisma.$queryRaw<Array<{
      user_id: string
      user_name: string | null
      user_email: string
      activity_count: bigint
      total_duration: bigint
      task_completed: bigint
      task_total: bigint
    }>>`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COALESCE(a.activity_count, 0) as activity_count,
        COALESCE(a.total_duration, 0) as total_duration,
        COALESCE(t.completed, 0) as task_completed,
        COALESCE(t.total, 0) as task_total
      FROM users u
      LEFT JOIN (
        SELECT "userId", COUNT(*) as activity_count, SUM(duration) as total_duration
        FROM pastoral_activities
        GROUP BY "userId"
      ) a ON a."userId" = u.id
      LEFT JOIN (
        SELECT 
          COALESCE("assignedTo", "createdBy") as user_id,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed
        FROM pastoral_tasks
        GROUP BY COALESCE("assignedTo", "createdBy")
      ) t ON t.user_id = u.id
      WHERE u.role = 'PASTORAL_STAFF'
      ORDER BY activity_count DESC
    `

    return stats.map(s => ({
      userId: s.user_id,
      userName: s.user_name || s.user_email,
      activityCount: Number(s.activity_count),
      totalDuration: Number(s.total_duration),
      taskCompleted: Number(s.task_completed),
      taskTotal: Number(s.task_total),
      completionRate: Number(s.task_total) > 0 
        ? Math.round((Number(s.task_completed) / Number(s.task_total)) * 100) 
        : 0
    }))
  } catch (error) {
    console.error("Error fetching staff comparison:", error)
    return []
  }
}

// Get overall activity trend by month (Admin only)
export async function getActivityTrend() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    const trend = await prisma.$queryRaw<Array<{
      month: Date
      total_activities: bigint
      total_duration: bigint
      unique_users: bigint
    }>>`
      SELECT 
        DATE_TRUNC('month', date) as month,
        COUNT(*) as total_activities,
        SUM(duration) as total_duration,
        COUNT(DISTINCT "userId") as unique_users
      FROM pastoral_activities
      WHERE date >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `

    return trend.map(t => ({
      month: t.month,
      totalActivities: Number(t.total_activities),
      totalDuration: Number(t.total_duration),
      uniqueUsers: Number(t.unique_users)
    }))
  } catch (error) {
    console.error("Error fetching activity trend:", error)
    return []
  }
}

// Get pillar distribution across all staff (Admin only)
export async function getPillarDistribution() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    const distribution = await prisma.$queryRaw<Array<{
      pillar: string
      count: bigint
      total_duration: bigint
    }>>`
      SELECT 
        pillar,
        COUNT(*) as count,
        SUM(duration) as total_duration
      FROM pastoral_activities
      GROUP BY pillar
      ORDER BY count DESC
    `

    return distribution.map(d => ({
      pillar: d.pillar as PastoralPillar,
      count: Number(d.count),
      totalDuration: Number(d.total_duration)
    }))
  } catch (error) {
    console.error("Error fetching pillar distribution:", error)
    return []
  }
}

// Get staff requiring attention (low activity)
export async function getStaffRequiringAttention() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    const staff = await prisma.$queryRaw<Array<{
      user_id: string
      user_name: string | null
      user_email: string
      last_activity_date: Date | null
      monthly_count: bigint
    }>>`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        MAX(pa.date) as last_activity_date,
        COUNT(pa.id) FILTER (WHERE pa.date >= NOW() - INTERVAL '30 days') as monthly_count
      FROM users u
      LEFT JOIN pastoral_activities pa ON pa."userId" = u.id
      WHERE u.role = 'PASTORAL_STAFF'
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(pa.id) FILTER (WHERE pa.date >= NOW() - INTERVAL '30 days') < 3
        OR MAX(pa.date) IS NULL
        OR MAX(pa.date) < NOW() - INTERVAL '7 days'
      ORDER BY monthly_count ASC
    `

    return staff.map(s => ({
      userId: s.user_id,
      userName: s.user_name || s.user_email,
      lastActivityDate: s.last_activity_date,
      monthlyCount: Number(s.monthly_count),
      reason: !s.last_activity_date 
        ? "Belum ada aktivitas" 
        : Number(s.monthly_count) < 3 
          ? "Aktivitas rendah (< 3/bulan)"
          : "Tidak aktif > 7 hari"
    }))
  } catch (error) {
    console.error("Error fetching attention list:", error)
    return []
  }
}

// Get activity heatmap data (by day of week and hour)
export async function getActivityHeatmapData() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    const heatmap = await prisma.$queryRaw<Array<{
      day_of_week: number
      count: bigint
    }>>`
      SELECT 
        EXTRACT(DOW FROM date) as day_of_week,
        COUNT(*) as count
      FROM pastoral_activities
      WHERE date >= NOW() - INTERVAL '3 months'
      GROUP BY EXTRACT(DOW FROM date)
      ORDER BY day_of_week
    `

    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
    const maxCount = Math.max(...heatmap.map(h => Number(h.count)), 1)

    return days.map((day, i) => {
      const data = heatmap.find(h => Number(h.day_of_week) === i)
      const count = Number(data?.count || 0)
      return {
        day,
        dayIndex: i,
        count,
        intensity: Math.round((count / maxCount) * 100)
      }
    })
  } catch (error) {
    console.error("Error fetching heatmap data:", error)
    return []
  }
}
