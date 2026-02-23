"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

// Interface matching actual DB column names
interface DbTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date | null       // Not mapped, stays camelCase in DB
  assignedTo: string | null  // Not mapped, stays camelCase in DB
  createdBy: string          // Not mapped, stays camelCase in DB
  created_at: Date           // Mapped from createdAt
  completed_at: Date | null  // Mapped from completedAt
  checklist: any             // JSON field
}

export interface ChecklistItem {
  id: string
  text: string
  isCompleted: boolean
}

// Public interface for components
export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: Date | null
  assignedTo: string | null
  createdBy: string
  createdAt: Date
  completedAt: Date | null
  checklist: ChecklistItem[]
}

interface CreateTaskInput {
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: string
  assignedTo?: string
  checklist?: ChecklistItem[]
}

// Helper to map DB result to public interface
function mapDbTaskToTask(dbTask: DbTask): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    status: dbTask.status,
    priority: dbTask.priority,
    dueDate: dbTask.dueDate,
    assignedTo: dbTask.assignedTo,
    createdBy: dbTask.createdBy,
    createdAt: dbTask.created_at,
    completedAt: dbTask.completed_at,
    checklist: (dbTask.checklist as ChecklistItem[]) || [],
  }
}

// Get all tasks for current user with relations
export async function getMyTasks(): Promise<TaskWithUser[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const tasks = await prisma.$queryRaw<DbTaskWithUser[]>`
      SELECT 
        t.id, t.title, t.description, t.status, t.priority, 
        t."dueDate", t."assignedTo", t."createdBy", t.checklist,
        t.created_at, t.completed_at,
        u.name as user_name, u.email as user_email,
        c.name as creator_name
      FROM pastoral_tasks t
      LEFT JOIN users u ON t."assignedTo" = u.id
      LEFT JOIN users c ON t."createdBy" = c.id
      WHERE t."createdBy" = ${session.user.id} 
         OR t."assignedTo" = ${session.user.id}
      ORDER BY 
        CASE WHEN t.status = 'TODO' THEN 0
             WHEN t.status = 'IN_PROGRESS' THEN 1
             ELSE 2 END,
        CASE WHEN t.priority = 'HIGH' THEN 0
             WHEN t.priority = 'MEDIUM' THEN 1
             ELSE 2 END,
        t.created_at DESC
    `
    
    return tasks.map(db => ({
      ...mapDbTaskToTask(db),
      userName: db.user_name,
      userEmail: db.user_email,
      creatorName: db.creator_name
    }))
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return []
  }
}

// Create new task
export async function createTask(input: CreateTaskInput) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  const { title, description, priority, dueDate, assignedTo } = input

  if (!title || title.trim().length < 3) {
    return { success: false, message: "Judul minimal 3 karakter" }
  }

  try {
    await prisma.pastoralTask.create({
      data: {
        title: title.trim(),
        description: description || null,
        priority: priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo: assignedTo || null,
        createdBy: session.user.id,
        checklist: (input.checklist ?? []) as any,
        status: "TODO"
      }
    })

    revalidatePath("/tasks")
    return { success: true, message: "Tugas berhasil ditambahkan" }
  } catch (error) {
    console.error("Error creating task:", error)
    return { success: false, message: "Gagal menambahkan tugas" }
  }
}

// Update task status
export async function updateTaskStatus(id: string, status: TaskStatus) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const completedAt = status === "COMPLETED" ? new Date() : null
    
    await prisma.pastoralTask.updateMany({
      where: {
        id: id,
        OR: [
          { createdBy: session.user.id },
          { assignedTo: session.user.id }
        ]
      },
      data: {
        status: status,
        completedAt: completedAt,
      }
    })

    revalidatePath("/tasks")
    
    // Auto-update goal progress when task is completed
    if (status === "COMPLETED") {
      const { updateGoalProgressFromTasks } = await import("./goals")
      await updateGoalProgressFromTasks(session.user.id)
    }
    
    return { success: true, message: "Status tugas diperbarui" }
  } catch (error) {
    console.error("Error updating task:", error)
    return { success: false, message: "Gagal memperbarui tugas" }
  }
}

// Update task checklist
export async function updateTaskChecklist(id: string, checklist: ChecklistItem[]) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.pastoralTask.updateMany({
      where: {
        id: id,
        OR: [
          { createdBy: session.user.id },
          { assignedTo: session.user.id }
        ]
      },
      data: {
        checklist: (checklist || []) as any
      }
    })

    revalidatePath("/tasks")
    return { success: true, message: "Checklist diperbarui" }
  } catch (error) {
    console.error("Error updating checklist:", error)
    return { success: false, message: "Gagal memperbarui checklist" }
  }
}

// Delete task
export async function deleteTask(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.pastoralTask.deleteMany({
      where: {
        id: id,
        createdBy: session.user.id // Only creator can delete
      }
    })

    revalidatePath("/tasks")
    return { success: true, message: "Tugas berhasil dihapus" }
  } catch (error) {
    console.error("Error deleting task:", error)
    return { success: false, message: "Gagal menghapus tugas" }
  }
}

// Get task stats
export async function getTaskStats() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const stats = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT status, COUNT(*) as count
      FROM pastoral_tasks 
      WHERE "createdBy" = ${session.user.id} 
         OR "assignedTo" = ${session.user.id}
      GROUP BY status
    `
    
    return {
      todo: Number(stats.find(s => s.status === "TODO")?.count || 0),
      inProgress: Number(stats.find(s => s.status === "IN_PROGRESS")?.count || 0),
      completed: Number(stats.find(s => s.status === "COMPLETED")?.count || 0),
    }
  } catch (error) {
    console.error("Error fetching task stats:", error)
    return { todo: 0, inProgress: 0, completed: 0 }
  }
}

// ============================================
// ADMIN-ONLY FUNCTIONS
// ============================================

export interface TaskWithUser extends Task {
  userName: string | null
  userEmail: string
  creatorName: string | null
}

interface DbTaskWithUser extends DbTask {
  user_name: string | null
  user_email: string
  creator_name: string | null
}

// Get all tasks (Admin only)
export async function getAllTasks(userId?: string): Promise<TaskWithUser[]> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin only")
  }

  try {
    let tasks: DbTaskWithUser[]
    
    if (userId) {
      tasks = await prisma.$queryRaw<DbTaskWithUser[]>`
        SELECT 
          t.*, t.checklist,
          u.name as user_name, u.email as user_email,
          c.name as creator_name
        FROM pastoral_tasks t
        LEFT JOIN users u ON t."assignedTo" = u.id
        LEFT JOIN users c ON t."createdBy" = c.id
        WHERE t."assignedTo" = ${userId} OR t."createdBy" = ${userId}
        ORDER BY 
          CASE WHEN t.status = 'TODO' THEN 0
               WHEN t.status = 'IN_PROGRESS' THEN 1
               ELSE 2 END,
          t.created_at DESC
      `
    } else {
      tasks = await prisma.$queryRaw<DbTaskWithUser[]>`
        SELECT 
          t.*, t.checklist,
          u.name as user_name, u.email as user_email,
          c.name as creator_name
        FROM pastoral_tasks t
        LEFT JOIN users u ON t."assignedTo" = u.id
        LEFT JOIN users c ON t."createdBy" = c.id
        ORDER BY 
          CASE WHEN t.status = 'TODO' THEN 0
               WHEN t.status = 'IN_PROGRESS' THEN 1
               ELSE 2 END,
          t.created_at DESC
      `
    }
    
    return tasks.map(db => ({
      ...mapDbTaskToTask(db),
      userName: db.user_name,
      userEmail: db.user_email,
      creatorName: db.creator_name
    }))
  } catch (error) {
    console.error("Error fetching all tasks:", error)
    return []
  }
}

// Get staff task summary (Admin only)
export async function getStaffTaskSummary() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin only")
  }

  try {
    const result = await prisma.$queryRaw<Array<{
      id: string
      name: string | null
      email: string
      todo_count: bigint
      in_progress_count: bigint
      completed_count: bigint
    }>>`
      SELECT 
        u.id, u.name, u.email,
        COUNT(CASE WHEN t.status = 'TODO' THEN 1 END) as todo_count,
        COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_count
      FROM users u
      LEFT JOIN pastoral_tasks t ON u.id = t."assignedTo" OR u.id = t."createdBy"
      WHERE u.role = 'PASTORAL_STAFF'
      GROUP BY u.id, u.name, u.email
      ORDER BY todo_count DESC, in_progress_count DESC
    `
    
    return result.map(r => ({
      id: r.id,
      name: r.name || r.email,
      email: r.email,
      todoCount: Number(r.todo_count),
      inProgressCount: Number(r.in_progress_count),
      completedCount: Number(r.completed_count)
    }))
  } catch (error) {
    console.error("Error fetching staff task summary:", error)
    return []
  }
}

// Assign task to staff (Admin only)
export async function assignTaskToStaff(input: CreateTaskInput & { assignedTo: string }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized - Admin only" }
  }

  const { title, description, priority, dueDate, assignedTo } = input

  if (!title || title.trim().length < 3) {
    return { success: false, message: "Judul minimal 3 karakter" }
  }

  if (!assignedTo) {
    return { success: false, message: "Staff harus dipilih" }
  }

  try {
    await prisma.pastoralTask.create({
      data: {
        title: title.trim(),
        description: description || null,
        priority: priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo: assignedTo,
        createdBy: session.user.id,
        status: "TODO"
      }
    })

    revalidatePath("/admin/tasks")
    revalidatePath("/tasks")
    return { success: true, message: "Tugas berhasil ditugaskan" }
  } catch (error) {
    console.error("Error assigning task:", error)
    return { success: false, message: "Gagal menugaskan tugas" }
  }
}

// Get all task stats (Admin only)
export async function getAllTaskStats() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin only")
  }

  try {
    const stats = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT status, COUNT(*) as count
      FROM pastoral_tasks 
      GROUP BY status
    `
    
    return {
      todo: Number(stats.find(s => s.status === "TODO")?.count || 0),
      inProgress: Number(stats.find(s => s.status === "IN_PROGRESS")?.count || 0),
      completed: Number(stats.find(s => s.status === "COMPLETED")?.count || 0),
    }
  } catch (error) {
    console.error("Error fetching all task stats:", error)
    return { todo: 0, inProgress: 0, completed: 0 }
  }
}

// =====================================================
// TASK MILESTONES / TIMELINE
// =====================================================

export interface TaskMilestone {
  id: string
  taskId: string
  status: TaskStatus
  note: string | null
  createdBy: string
  createdAt: Date
  createdByName?: string
}

// Create a milestone when task status changes
export async function createMilestone(taskId: string, status: TaskStatus, note?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.taskMilestone.create({
      data: {
        taskId: taskId,
        status: status,
        note: note || null,
        createdBy: session.user.id
      }
    })
    revalidatePath("/tasks")
    return { success: true, message: "Milestone ditambahkan" }
  } catch (error) {
    console.error("Error creating milestone:", error)
    return { success: false, message: "Gagal menambahkan milestone" }
  }
}

// Get milestones for a task
export async function getTaskMilestones(taskId: string): Promise<TaskMilestone[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    const milestones = await prisma.$queryRaw<Array<{
      id: string
      task_id: string
      status: TaskStatus
      note: string | null
      created_by: string
      created_at: Date
      created_by_name: string | null
    }>>`
      SELECT 
        tm.id, 
        tm.task_id,
        tm.status,
        tm.note,
        tm.created_by,
        tm.created_at,
        u.name as created_by_name
      FROM task_milestones tm
      LEFT JOIN users u ON u.id = tm.created_by
      WHERE tm.task_id = ${taskId}
      ORDER BY tm.created_at ASC
    `

    return milestones.map(m => ({
      id: m.id,
      taskId: m.task_id,
      status: m.status,
      note: m.note,
      createdBy: m.created_by,
      createdAt: m.created_at,
      createdByName: m.created_by_name || "Unknown"
    }))
  } catch (error) {
    console.error("Error fetching milestones:", error)
    return []
  }
}

// Get task with timeline (for detail view)
export async function getTaskWithTimeline(taskId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  try {
    // Get task
    const tasks = await prisma.$queryRaw<DbTask[]>`
      SELECT id, title, description, status, priority, "dueDate", "assignedTo", "createdBy", checklist, created_at, completed_at
      FROM pastoral_tasks 
      WHERE id = ${taskId}
      LIMIT 1
    `
    
    if (tasks.length === 0) {
      return null
    }

    const task = mapDbTaskToTask(tasks[0])
    const milestones = await getTaskMilestones(taskId)

    // Get assignee name if assigned
    let assigneeName = null
    if (task.assignedTo) {
      const user = await prisma.$queryRaw<Array<{ name: string | null }>>`
        SELECT name FROM users WHERE id = ${task.assignedTo}
      `
      assigneeName = user[0]?.name || null
    }

    return {
      ...task,
      assigneeName,
      milestones
    }
  } catch (error) {
    console.error("Error fetching task with timeline:", error)
    return null
  }
}

