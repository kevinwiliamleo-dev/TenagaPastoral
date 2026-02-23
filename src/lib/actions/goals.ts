"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { PastoralPillar } from "@/lib/constants"

// Types
export type GoalStatus = "PENDING_APPROVAL" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "REJECTED"
export type GoalType = "ACTIVITY_COUNT" | "ACTIVITY_DURATION" | "TASK_COMPLETION" | "PILLAR_BALANCE" | "CUSTOM"

interface DbGoal {
  id: string
  user_id: string
  title: string
  description: string | null
  type: GoalType
  pillar: PastoralPillar | null
  target_value: number
  current_value: number
  start_date: Date
  target_date: Date
  status: GoalStatus
  created_by: string | null
  created_at: Date
  completed_at: Date | null
  reviewed_by: string | null
  review_note: string | null
  reviewed_at: Date | null
}

// Extended type for admin review (includes staff name)
interface DbGoalWithUser extends DbGoal {
  user_name: string | null
  user_email: string
}

export interface Goal {
  id: string
  userId: string
  title: string
  description: string | null
  type: GoalType
  pillar: PastoralPillar | null
  targetValue: number
  currentValue: number
  startDate: Date
  targetDate: Date
  status: GoalStatus
  createdBy: string | null
  createdAt: Date
  completedAt: Date | null
  reviewedBy: string | null
  reviewNote: string | null
  reviewedAt: Date | null
  progress: number
  // Optional: included when fetching for admin review
  userName?: string | null
  userEmail?: string
}

function mapDbGoalToGoal(db: DbGoal): Goal {
  const progress = db.target_value > 0 
    ? Math.min(100, Math.round((db.current_value / db.target_value) * 100)) 
    : 0
  
  return {
    id: db.id,
    userId: db.user_id,
    title: db.title,
    description: db.description,
    type: db.type,
    pillar: db.pillar,
    targetValue: db.target_value,
    currentValue: db.current_value,
    startDate: db.start_date,
    targetDate: db.target_date,
    status: db.status,
    createdBy: db.created_by,
    createdAt: db.created_at,
    completedAt: db.completed_at,
    reviewedBy: db.reviewed_by,
    reviewNote: db.review_note,
    reviewedAt: db.reviewed_at,
    progress
  }
}

function mapDbGoalWithUserToGoal(db: DbGoalWithUser): Goal {
  return {
    ...mapDbGoalToGoal(db),
    userName: db.user_name,
    userEmail: db.user_email,
  }
}

// Get my goals
export async function getMyGoals(status?: GoalStatus) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    let goals: DbGoal[]
    
    if (status) {
      goals = await prisma.$queryRaw<DbGoal[]>`
        SELECT * FROM staff_goals 
        WHERE user_id = ${session.user.id} 
          AND status = ${status}::"GoalStatus"
        ORDER BY target_date ASC
      `
    } else {
      goals = await prisma.$queryRaw<DbGoal[]>`
        SELECT * FROM staff_goals 
        WHERE user_id = ${session.user.id}
        ORDER BY 
          CASE WHEN status = 'PENDING_APPROVAL' THEN 0
               WHEN status = 'ACTIVE' THEN 1
               WHEN status = 'REJECTED' THEN 2
               WHEN status = 'COMPLETED' THEN 3
               ELSE 4 END,
          target_date ASC
      `
    }

    return goals.map(mapDbGoalToGoal)
  } catch (error) {
    console.error("Error fetching goals:", error)
    return []
  }
}

// Create goal input
interface CreateGoalInput {
  title: string
  description?: string
  type: GoalType
  pillar?: PastoralPillar
  targetValue: number
  targetDate: string
}

// Create new goal — status defaults to PENDING_APPROVAL
export async function createGoal(input: CreateGoalInput) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  const { title, description, type, pillar, targetValue, targetDate } = input

  if (!title || title.trim().length < 3) {
    return { success: false, message: "Judul minimal 3 karakter" }
  }

  if (targetValue <= 0) {
    return { success: false, message: "Target harus lebih dari 0" }
  }

  try {
    await prisma.staffGoal.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        description: description || null,
        type: type,
        pillar: pillar || null,
        targetValue: targetValue,
        targetDate: new Date(targetDate),
        status: "PENDING_APPROVAL",
        currentValue: 0,
        startDate: new Date(),
      }
    })

    revalidatePath("/goals")
    revalidatePath("/admin/goal-review")
    return { success: true, message: "Target diajukan, menunggu persetujuan admin" }
  } catch (error) {
    console.error("Error creating goal:", error)
    return { success: false, message: "Gagal menambahkan target" }
  }
}

// Update goal progress manually
export async function updateGoalProgress(id: string, currentValue: number) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    // Verify ownership AND status is ACTIVE
    const goal = await prisma.$queryRaw<DbGoal[]>`
      SELECT * FROM staff_goals WHERE id = ${id} AND user_id = ${session.user.id} AND status = 'ACTIVE'
    `
    
    if (!goal || goal.length === 0) {
      return { success: false, message: "Target tidak ditemukan atau belum disetujui" }
    }

    // Check if completed
    const targetValue = goal[0].target_value
    const newStatus = currentValue >= targetValue ? "COMPLETED" : "ACTIVE"
    const completedAt = currentValue >= targetValue ? new Date() : null

    await prisma.$executeRaw`
      UPDATE staff_goals 
      SET current_value = ${currentValue},
          status = ${newStatus}::"GoalStatus",
          completed_at = ${completedAt}
      WHERE id = ${id}
    `

    revalidatePath("/goals")
    return { success: true, message: newStatus === "COMPLETED" ? "Target tercapai! 🎉" : "Progress diperbarui" }
  } catch (error) {
    console.error("Error updating goal progress:", error)
    return { success: false, message: "Gagal memperbarui progress" }
  }
}

// Complete goal manually
export async function completeGoal(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.$executeRaw`
      UPDATE staff_goals 
      SET status = 'COMPLETED'::"GoalStatus",
          completed_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id} AND status = 'ACTIVE'
    `

    revalidatePath("/goals")
    return { success: true, message: "Target selesai! 🎉" }
  } catch (error) {
    console.error("Error completing goal:", error)
    return { success: false, message: "Gagal menyelesaikan target" }
  }
}

// Cancel goal
export async function cancelGoal(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.$executeRaw`
      UPDATE staff_goals 
      SET status = 'CANCELLED'::"GoalStatus"
      WHERE id = ${id} AND user_id = ${session.user.id} AND status IN ('ACTIVE', 'PENDING_APPROVAL')
    `

    revalidatePath("/goals")
    revalidatePath("/admin/goal-review")
    return { success: true, message: "Target dibatalkan" }
  } catch (error) {
    console.error("Error cancelling goal:", error)
    return { success: false, message: "Gagal membatalkan target" }
  }
}

// Delete goal
export async function deleteGoal(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.$executeRaw`
      DELETE FROM staff_goals 
      WHERE id = ${id} AND user_id = ${session.user.id}
    `

    revalidatePath("/goals")
    revalidatePath("/admin/goal-review")
    return { success: true, message: "Target dihapus" }
  } catch (error) {
    console.error("Error deleting goal:", error)
    return { success: false, message: "Gagal menghapus target" }
  }
}

// Get goal stats
export async function getGoalStats() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const stats = await prisma.$queryRaw<Array<{
      status: GoalStatus
      count: bigint
    }>>`
      SELECT status, COUNT(*) as count
      FROM staff_goals
      WHERE user_id = ${session.user.id}
      GROUP BY status
    `

    const pending = Number(stats.find(s => s.status === "PENDING_APPROVAL")?.count || 0)
    const active = Number(stats.find(s => s.status === "ACTIVE")?.count || 0)
    const completed = Number(stats.find(s => s.status === "COMPLETED")?.count || 0)
    const cancelled = Number(stats.find(s => s.status === "CANCELLED")?.count || 0)
    const rejected = Number(stats.find(s => s.status === "REJECTED")?.count || 0)

    return { 
      pending, active, completed, cancelled, rejected, 
      total: pending + active + completed + cancelled + rejected 
    }
  } catch (error) {
    console.error("Error fetching goal stats:", error)
    return { pending: 0, active: 0, completed: 0, cancelled: 0, rejected: 0, total: 0 }
  }
}

// ============================================================
// ADMIN REVIEW FUNCTIONS
// ============================================================

// Get all goals pending review (Admin only)
export async function getGoalsForReview() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })
  
  if (user?.role !== "ADMIN") {
    throw new Error("Forbidden: Admin only")
  }

  try {
    const goals = await prisma.$queryRaw<DbGoalWithUser[]>`
      SELECT sg.*, u.name as user_name, u.email as user_email
      FROM staff_goals sg
      JOIN users u ON sg.user_id = u.id
      WHERE sg.status = 'PENDING_APPROVAL'
      ORDER BY sg.created_at ASC
    `

    return goals.map(mapDbGoalWithUserToGoal)
  } catch (error) {
    console.error("Error fetching goals for review:", error)
    return []
  }
}

// Get review stats for admin badge
export async function getReviewStats() {
  const session = await auth()
  if (!session?.user?.id) return { pending: 0 }

  try {
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM staff_goals
      WHERE status = 'PENDING_APPROVAL'
    `
    return { pending: Number(result[0]?.count || 0) }
  } catch {
    return { pending: 0 }
  }
}

// Approve goal (Admin)
export async function approveGoal(id: string, note?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    // Get goal info for notification
    const goal = await prisma.$queryRaw<{user_id: string, title: string}[]>`
      SELECT user_id, title FROM staff_goals WHERE id = ${id} AND status = 'PENDING_APPROVAL'
    `

    await prisma.$executeRaw`
      UPDATE staff_goals 
      SET status = 'ACTIVE'::"GoalStatus",
          reviewed_by = ${session.user.id},
          review_note = ${note || null},
          reviewed_at = NOW()
      WHERE id = ${id} AND status = 'PENDING_APPROVAL'
    `

    // Send notification to staff
    if (goal[0]) {
      await prisma.notification.create({
        data: {
          userId: goal[0].user_id,
          type: "GOAL_APPROVED",
          title: "Target Disetujui",
          message: `Target "${goal[0].title}" telah disetujui oleh admin.${note ? ` Catatan: ${note}` : ''}`,
          linkUrl: "/goals",
          linkText: "Lihat Target",
        }
      })
    }

    revalidatePath("/goals")
    revalidatePath("/admin/goal-review")
    return { success: true, message: "Target disetujui" }
  } catch (error) {
    console.error("Error approving goal:", error)
    return { success: false, message: "Gagal menyetujui target" }
  }
}

// Revise goal (Admin — change target value and approve)
export async function reviseGoal(id: string, targetValue: number, note: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  if (targetValue <= 0) {
    return { success: false, message: "Target harus lebih dari 0" }
  }

  try {
    // Get goal info for notification
    const goal = await prisma.$queryRaw<{user_id: string, title: string}[]>`
      SELECT user_id, title FROM staff_goals WHERE id = ${id} AND status = 'PENDING_APPROVAL'
    `

    await prisma.$executeRaw`
      UPDATE staff_goals 
      SET status = 'ACTIVE'::"GoalStatus",
          target_value = ${targetValue},
          reviewed_by = ${session.user.id},
          review_note = ${note},
          reviewed_at = NOW()
      WHERE id = ${id} AND status = 'PENDING_APPROVAL'
    `

    // Send notification to staff
    if (goal[0]) {
      await prisma.notification.create({
        data: {
          userId: goal[0].user_id,
          type: "GOAL_APPROVED",
          title: "Target Direvisi & Disetujui",
          message: `Target "${goal[0].title}" telah direvisi (target baru: ${targetValue}) dan disetujui. Catatan: ${note}`,
          linkUrl: "/goals",
          linkText: "Lihat Target",
        }
      })
    }

    revalidatePath("/goals")
    revalidatePath("/admin/goal-review")
    return { success: true, message: "Target direvisi dan disetujui" }
  } catch (error) {
    console.error("Error revising goal:", error)
    return { success: false, message: "Gagal merevisi target" }
  }
}

// Reject goal (Admin)
export async function rejectGoal(id: string, note: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  if (!note || note.trim().length < 3) {
    return { success: false, message: "Alasan penolakan wajib diisi (min 3 karakter)" }
  }

  try {
    // Get goal info for notification
    const goal = await prisma.$queryRaw<{user_id: string, title: string}[]>`
      SELECT user_id, title FROM staff_goals WHERE id = ${id} AND status = 'PENDING_APPROVAL'
    `

    await prisma.$executeRaw`
      UPDATE staff_goals 
      SET status = 'REJECTED'::"GoalStatus",
          reviewed_by = ${session.user.id},
          review_note = ${note.trim()},
          reviewed_at = NOW()
      WHERE id = ${id} AND status = 'PENDING_APPROVAL'
    `

    // Send notification to staff
    if (goal[0]) {
      await prisma.notification.create({
        data: {
          userId: goal[0].user_id,
          type: "GOAL_REJECTED",
          title: "Target Ditolak",
          message: `Target "${goal[0].title}" ditolak. Alasan: ${note.trim()}`,
          linkUrl: "/goals",
          linkText: "Lihat Target",
        }
      })
    }

    revalidatePath("/goals")
    revalidatePath("/admin/goal-review")
    return { success: true, message: "Target ditolak" }
  } catch (error) {
    console.error("Error rejecting goal:", error)
    return { success: false, message: "Gagal menolak target" }
  }
}

// ============================================================
// AUTO-SCORE GOAL TRACKING
// ============================================================

// Update goal progress from activities (for ACTIVITY_COUNT and ACTIVITY_DURATION goals)
export async function updateGoalProgressFromActivities(userId: string) {
  try {
    // Get active activity-based goals
    const goals = await prisma.$queryRaw<DbGoal[]>`
      SELECT * FROM staff_goals
      WHERE user_id = ${userId}
        AND status = 'ACTIVE'
        AND type IN ('ACTIVITY_COUNT', 'ACTIVITY_DURATION')
    `

    for (const goal of goals) {
      let currentValue = 0

      if (goal.type === 'ACTIVITY_COUNT') {
        // Count activities since goal start date
        if (goal.pillar) {
          const result = await prisma.$queryRaw<[{count: bigint}]>`
            SELECT COUNT(*) as count FROM pastoral_activities
            WHERE "userId" = ${userId}
              AND date >= ${goal.start_date}
              AND pillar = ${goal.pillar}::"PastoralPillar"
          `
          currentValue = Number(result[0]?.count || 0)
        } else {
          const result = await prisma.$queryRaw<[{count: bigint}]>`
            SELECT COUNT(*) as count FROM pastoral_activities
            WHERE "userId" = ${userId}
              AND date >= ${goal.start_date}
          `
          currentValue = Number(result[0]?.count || 0)
        }
      } else if (goal.type === 'ACTIVITY_DURATION') {
        // Sum duration of activities since goal start date
        if (goal.pillar) {
          const result = await prisma.$queryRaw<[{total: number}]>`
            SELECT COALESCE(SUM(duration), 0) as total FROM pastoral_activities
            WHERE "userId" = ${userId}
              AND date >= ${goal.start_date}
              AND pillar = ${goal.pillar}::"PastoralPillar"
          `
          currentValue = Number(result[0]?.total || 0)
        } else {
          const result = await prisma.$queryRaw<[{total: number}]>`
            SELECT COALESCE(SUM(duration), 0) as total FROM pastoral_activities
            WHERE "userId" = ${userId}
              AND date >= ${goal.start_date}
          `
          currentValue = Number(result[0]?.total || 0)
        }
      }

      // Update goal current value
      await prisma.$executeRaw`
        UPDATE staff_goals 
        SET current_value = ${currentValue}, updated_at = NOW()
        WHERE id = ${goal.id}
      `

      // Auto-complete if target reached
      if (currentValue >= goal.target_value) {
        await prisma.$executeRaw`
          UPDATE staff_goals 
          SET status = 'COMPLETED'::"GoalStatus", completed_at = NOW()
          WHERE id = ${goal.id}
        `
      }
    }

    revalidatePath("/goals")
    revalidatePath("/performance")
    return { success: true }
  } catch (error) {
    console.error("Error updating goal progress from activities:", error)
    return { success: false }
  }
}

// Update goal progress from tasks (for TASK_COMPLETION goals)
export async function updateGoalProgressFromTasks(userId: string) {
  try {
    // Get active task-based goals
    const goals = await prisma.$queryRaw<DbGoal[]>`
      SELECT * FROM staff_goals
      WHERE user_id = ${userId}
        AND status = 'ACTIVE'
        AND type = 'TASK_COMPLETION'
    `

    for (const goal of goals) {
      // Count completed tasks since goal start date
      const result = await prisma.$queryRaw<[{count: bigint}]>`
        SELECT COUNT(*) as count FROM pastoral_tasks
        WHERE ("createdBy" = ${userId} OR "assignedTo" = ${userId})
          AND status = 'COMPLETED'
          AND "completedAt" >= ${goal.start_date}
      `
      const currentValue = Number(result[0]?.count || 0)

      // Update goal current value
      await prisma.$executeRaw`
        UPDATE staff_goals 
        SET current_value = ${currentValue}, updated_at = NOW()
        WHERE id = ${goal.id}
      `

      // Auto-complete if target reached
      if (currentValue >= goal.target_value) {
        await prisma.$executeRaw`
          UPDATE staff_goals 
          SET status = 'COMPLETED'::"GoalStatus", completed_at = NOW()
          WHERE id = ${goal.id}
        `
      }
    }

    revalidatePath("/goals")
    revalidatePath("/performance")
    return { success: true }
  } catch (error) {
    console.error("Error updating goal progress from tasks:", error)
    return { success: false }
  }
}

// Master function to update all goals for a user
export async function refreshAllGoalProgress(userId?: string) {
  const session = await auth()
  const targetUserId = userId || session?.user?.id
  
  if (!targetUserId) {
    return { success: false, message: "Unauthorized" }
  }

  await updateGoalProgressFromActivities(targetUserId)
  await updateGoalProgressFromTasks(targetUserId)
  
  return { success: true }
}
