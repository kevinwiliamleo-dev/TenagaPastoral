"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { PILLAR_INFO, PastoralPillar } from "@/lib/constants"

interface DbActivity {
  id: string
  title: string
  description: string | null
  pillar: PastoralPillar
  date: Date
  duration: number
  location: string | null
  notes: string | null
  userId: string        // Unmapped -> "userId"
  created_at: Date      // Mapped -> created_at
}

export interface Activity {
  id: string
  title: string
  description: string | null
  pillar: PastoralPillar
  date: Date
  duration: number
  location: string | null
  notes: string | null
  userId: string
  createdAt: Date
}

function mapDbActivityToActivity(db: DbActivity): Activity {
  return {
    id: db.id,
    title: db.title,
    description: db.description,
    pillar: db.pillar,
    date: db.date,
    duration: db.duration,
    location: db.location,
    notes: db.notes,
    userId: db.userId,
    createdAt: db.created_at,
  }
}

interface CreateActivityInput {
  title: string
  description?: string
  pillar: PastoralPillar
  date: string
  duration: number
  location?: string
  notes?: string
}

// Get activities for current user
export async function getMyActivities(pillar?: PastoralPillar): Promise<Activity[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    let activities: DbActivity[]
    
    if (pillar) {
      activities = await prisma.$queryRaw<DbActivity[]>`
        SELECT * FROM pastoral_activities 
        WHERE "userId" = ${session.user.id}
        AND pillar = ${pillar}::pastoral_pillar
        ORDER BY date DESC
        LIMIT 50
      `
    } else {
      activities = await prisma.$queryRaw<DbActivity[]>`
        SELECT * FROM pastoral_activities 
        WHERE "userId" = ${session.user.id}
        ORDER BY date DESC
        LIMIT 50
      `
    }
    
    return activities.map(mapDbActivityToActivity)
  } catch (error) {
    console.error("Error fetching activities:", error)
    // Return empty array if table doesn't exist yet
    return []
  }
}

// Get activity statistics
export async function getActivityStats() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const stats = await prisma.$queryRaw<Array<{ pillar: string; count: bigint; total_duration: bigint }>>`
      SELECT pillar, COUNT(*) as count, COALESCE(SUM(duration), 0) as total_duration
      FROM pastoral_activities 
      WHERE "userId" = ${session.user.id}
      GROUP BY pillar
    `
    
    const result: Record<PastoralPillar, { count: number; totalDuration: number }> = {
      LITURGIA: { count: 0, totalDuration: 0 },
      DIAKONIA: { count: 0, totalDuration: 0 },
      KERYGMA: { count: 0, totalDuration: 0 },
      KOINONIA: { count: 0, totalDuration: 0 },
      MARTYRIA: { count: 0, totalDuration: 0 },
    }
    
    for (const stat of stats) {
      result[stat.pillar as PastoralPillar] = {
        count: Number(stat.count),
        totalDuration: Number(stat.total_duration),
      }
    }
    
    return result
  } catch (error) {
    console.error("Error fetching stats:", error)
    // Return empty stats if table doesn't exist
    return {
      LITURGIA: { count: 0, totalDuration: 0 },
      DIAKONIA: { count: 0, totalDuration: 0 },
      KERYGMA: { count: 0, totalDuration: 0 },
      KOINONIA: { count: 0, totalDuration: 0 },
      MARTYRIA: { count: 0, totalDuration: 0 },
    }
  }
}

// Get monthly activity stats for a specific pillar
export async function getPillarMonthlyStats(pillar: PastoralPillar) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Get last 6 months of data
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const stats = await prisma.$queryRaw<Array<{
      month: Date
      count: bigint
      total_duration: bigint
    }>>`
      SELECT 
        DATE_TRUNC('month', date) as month,
        COUNT(*) as count,
        COALESCE(SUM(duration), 0) as total_duration
      FROM pastoral_activities 
      WHERE "userId" = ${session.user.id}
        AND pillar = ${pillar}::pastoral_pillar
        AND date >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `
    
    return stats.map(s => ({
      month: s.month,
      count: Number(s.count),
      totalDuration: Number(s.total_duration)
    }))
  } catch (error) {
    console.error("Error fetching monthly stats:", error)
    return []
  }
}

// Create new activity
export async function createActivity(input: CreateActivityInput) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  const { title, description, pillar, date, duration, location, notes } = input

  if (!title || title.trim().length < 3) {
    return { success: false, message: "Judul minimal 3 karakter" }
  }

  try {
    // Use Prisma Client instead of raw SQL to handle ID generation and type safety
    await prisma.pastoralActivity.create({
      data: {
        title: title.trim(),
        description: description || null,
        pillar: pillar,
        date: new Date(date),
        duration: duration,
        location: location || null,
        notes: notes || null,
        userId: session.user.id
      }
    })

    revalidatePath("/panca-tugas")
    
    // Auto-update goal progress after activity creation
    const { updateGoalProgressFromActivities } = await import("./goals")
    await updateGoalProgressFromActivities(session.user.id)
    
    return { success: true, message: "Aktivitas berhasil ditambahkan" }
  } catch (error) {
    console.error("Error creating activity:", error)
    return { success: false, message: "Gagal menambahkan aktivitas" }
  }
}

// Delete activity
export async function deleteActivity(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.$executeRaw`
      DELETE FROM pastoral_activities 
      WHERE id = ${id} AND "userId" = ${session.user.id}
    `

    revalidatePath("/panca-tugas")
    return { success: true, message: "Aktivitas berhasil dihapus" }
  } catch (error) {
    console.error("Error deleting activity:", error)
    return { success: false, message: "Gagal menghapus aktivitas" }
  }
}

// Get recent activities for dashboard
export async function getRecentActivities(limit = 5): Promise<Activity[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const activities = await prisma.$queryRaw<DbActivity[]>`
      SELECT * FROM pastoral_activities 
      WHERE "userId" = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    
    return activities.map(mapDbActivityToActivity)
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return []
  }
}

// ============================================
// ADMIN-ONLY FUNCTIONS
// ============================================

interface ActivityWithUser extends Activity {
  userName: string | null
  userEmail: string
}

interface DbActivityWithUser extends DbActivity {
  user_name: string | null
  user_email: string
}

// Get all activities (Admin only) with user info
export async function getAllActivities(userId?: string): Promise<ActivityWithUser[]> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin only")
  }

  try {
    let activities: DbActivityWithUser[]
    
    if (userId) {
      activities = await prisma.$queryRaw<DbActivityWithUser[]>`
        SELECT pa.*, u.name as user_name, u.email as user_email
        FROM pastoral_activities pa
        JOIN users u ON pa."userId" = u.id
        WHERE pa."userId" = ${userId}
        ORDER BY pa.date DESC
        LIMIT 100
      `
    } else {
      activities = await prisma.$queryRaw<DbActivityWithUser[]>`
        SELECT pa.*, u.name as user_name, u.email as user_email
        FROM pastoral_activities pa
        JOIN users u ON pa."userId" = u.id
        ORDER BY pa.date DESC
        LIMIT 100
      `
    }
    
    return activities.map(db => ({
      ...mapDbActivityToActivity(db),
      userName: db.user_name,
      userEmail: db.user_email
    }))
  } catch (error) {
    console.error("Error fetching all activities:", error)
    return []
  }
}

// Get all activities stats (Admin only)
export async function getAllActivityStats() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin only")
  }

  try {
    const stats = await prisma.$queryRaw<Array<{ 
      pillar: string
      count: bigint
      total_duration: bigint 
      user_count: bigint
    }>>`
      SELECT 
        pillar, 
        COUNT(*) as count, 
        COALESCE(SUM(duration), 0) as total_duration,
        COUNT(DISTINCT "userId") as user_count
      FROM pastoral_activities 
      GROUP BY pillar
    `
    
    const result: Record<PastoralPillar, { count: number; totalDuration: number; userCount: number }> = {
      LITURGIA: { count: 0, totalDuration: 0, userCount: 0 },
      DIAKONIA: { count: 0, totalDuration: 0, userCount: 0 },
      KERYGMA: { count: 0, totalDuration: 0, userCount: 0 },
      KOINONIA: { count: 0, totalDuration: 0, userCount: 0 },
      MARTYRIA: { count: 0, totalDuration: 0, userCount: 0 },
    }
    
    for (const stat of stats) {
      result[stat.pillar as PastoralPillar] = {
        count: Number(stat.count),
        totalDuration: Number(stat.total_duration),
        userCount: Number(stat.user_count),
      }
    }
    
    return result
  } catch (error) {
    console.error("Error fetching all stats:", error)
    return {
      LITURGIA: { count: 0, totalDuration: 0, userCount: 0 },
      DIAKONIA: { count: 0, totalDuration: 0, userCount: 0 },
      KERYGMA: { count: 0, totalDuration: 0, userCount: 0 },
      KOINONIA: { count: 0, totalDuration: 0, userCount: 0 },
      MARTYRIA: { count: 0, totalDuration: 0, userCount: 0 },
    }
  }
}

// Get staff list with activity counts (Admin only)
export async function getStaffActivitySummary() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin only")
  }

  try {
    const result = await prisma.$queryRaw<Array<{
      id: string
      name: string | null
      email: string
      activity_count: bigint
      total_duration: bigint
    }>>`
      SELECT 
        u.id, u.name, u.email,
        COUNT(pa.id) as activity_count,
        COALESCE(SUM(pa.duration), 0) as total_duration
      FROM users u
      LEFT JOIN pastoral_activities pa ON u.id = pa."userId"
      WHERE u.role = 'PASTORAL_STAFF'
      GROUP BY u.id, u.name, u.email
      ORDER BY activity_count DESC
    `
    
    return result.map(r => ({
      id: r.id,
      name: r.name || r.email,
      email: r.email,
      activityCount: Number(r.activity_count),
      totalDuration: Number(r.total_duration)
    }))
  } catch (error) {
    console.error("Error fetching staff summary:", error)
    return []
  }
}
