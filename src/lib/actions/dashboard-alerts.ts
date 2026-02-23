"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// Types
export interface DashboardAlert {
  id: string
  type: "warning" | "info" | "success" | "danger"
  icon: string
  title: string
  message: string
  link?: string
  linkText?: string
}

// Get dashboard alerts for the current user
export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  const alerts: DashboardAlert[] = []
  const isAdmin = session.user.role === "ADMIN"

  try {
    // 1. Check for active evaluation period deadline
    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { endDate: "asc" }
    })

    if (activePeriod) {
      const daysRemaining = Math.ceil(
        (activePeriod.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      if (daysRemaining <= 7 && daysRemaining > 0) {
        alerts.push({
          id: "period-deadline",
          type: daysRemaining <= 3 ? "danger" : "warning",
          icon: "schedule",
          title: `Periode "${activePeriod.name}" berakhir dalam ${daysRemaining} hari`,
          message: isAdmin 
            ? "Pastikan semua staff sudah menyelesaikan evaluasi mereka."
            : "Segera selesaikan evaluasi Anda sebelum periode berakhir.",
          link: isAdmin ? "/admin/periods" : "/evaluations",
          linkText: isAdmin ? "Lihat Periode" : "Isi Evaluasi"
        })
      } else if (daysRemaining <= 0) {
        alerts.push({
          id: "period-ended",
          type: "info",
          icon: "event_busy",
          title: `Periode "${activePeriod.name}" sudah berakhir`,
          message: isAdmin 
            ? "Periode evaluasi telah berakhir. Anda dapat menutup periode ini."
            : "Periode evaluasi telah berakhir.",
          link: isAdmin ? "/admin/periods" : undefined,
          linkText: isAdmin ? "Tutup Periode" : undefined
        })
      }
    }

    // Staff-specific alerts
    if (!isAdmin) {
      // 2. Check for pending evaluations
      if (activePeriod) {
        const mySubmissions = await prisma.$queryRaw<[{count: bigint}]>`
          SELECT COUNT(*) as count FROM evaluation_submissions
          WHERE "appraiserId" = ${session.user.id}
            AND "periodId" = ${activePeriod.id}
            AND "isFinal" = true
        `
        const submittedCount = Number(mySubmissions[0]?.count || 0)
        
        if (submittedCount === 0) {
          alerts.push({
            id: "no-evaluation",
            type: "warning",
            icon: "assignment_late",
            title: "Belum ada evaluasi",
            message: "Anda belum menyelesaikan evaluasi untuk periode aktif ini.",
            link: "/evaluations",
            linkText: "Mulai Evaluasi"
          })
        }
      }

      // 3. Check for overdue tasks
      const overdueTasks = await prisma.$queryRaw<[{count: bigint}]>`
        SELECT COUNT(*) as count FROM pastoral_tasks
        WHERE ("createdBy" = ${session.user.id} OR "assignedTo" = ${session.user.id})
          AND status != 'COMPLETED'
          AND "dueDate" < NOW()
      `
      const overdueCount = Number(overdueTasks[0]?.count || 0)
      
      if (overdueCount > 0) {
        alerts.push({
          id: "overdue-tasks",
          type: "danger",
          icon: "warning",
          title: `${overdueCount} tugas melewati deadline`,
          message: "Segera selesaikan tugas-tugas yang sudah melewati batas waktu.",
          link: "/tasks",
          linkText: "Lihat Tugas"
        })
      }

      // 4. Check for pending tasks (TODO status)
      const pendingTasks = await prisma.$queryRaw<[{count: bigint}]>`
        SELECT COUNT(*) as count FROM pastoral_tasks
        WHERE ("createdBy" = ${session.user.id} OR "assignedTo" = ${session.user.id})
          AND status = 'TODO'
      `
      const pendingCount = Number(pendingTasks[0]?.count || 0)
      
      if (pendingCount > 0 && overdueCount === 0) {
        alerts.push({
          id: "pending-tasks",
          type: "info",
          icon: "task_alt",
          title: `${pendingCount} tugas menunggu dikerjakan`,
          message: "Ada tugas yang belum dimulai.",
          link: "/tasks",
          linkText: "Lihat Tugas"
        })
      }

      // 5. Check goal progress
      const activeGoals = await prisma.$queryRaw<Array<{
        target_value: number
        current_value: number
        target_date: Date
      }>>`
        SELECT target_value, current_value, target_date FROM staff_goals
        WHERE user_id = ${session.user.id}
          AND status = 'ACTIVE'
        ORDER BY target_date ASC
        LIMIT 3
      `

      for (const goal of activeGoals) {
        const progress = goal.target_value > 0 
          ? Math.round((goal.current_value / goal.target_value) * 100)
          : 0
        const daysToTarget = Math.ceil(
          (goal.target_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )

        // Alert if goal is near deadline but progress is low
        if (daysToTarget <= 7 && daysToTarget > 0 && progress < 50) {
          alerts.push({
            id: `goal-warning-${daysToTarget}`,
            type: "warning",
            icon: "flag",
            title: "Target hampir deadline",
            message: `Target Anda hanya ${progress}% tercapai dengan ${daysToTarget} hari tersisa.`,
            link: "/goals",
            linkText: "Lihat Target"
          })
          break // Only show one goal warning
        }
      }
    }

    // Admin-specific alerts
    if (isAdmin) {
      // Check for staff needing attention (low activity)
      const lowActivityStaff = await prisma.$queryRaw<[{count: bigint}]>`
        SELECT COUNT(*) as count FROM (
          SELECT u.id
          FROM users u
          LEFT JOIN pastoral_activities pa ON u.id = pa."userId" 
            AND pa.date >= NOW() - INTERVAL '30 days'
          WHERE u.role = 'PASTORAL_STAFF'
          GROUP BY u.id
          HAVING COUNT(pa.id) < 3
        ) as low_activity_users
      `
      const lowActivityCount = Number(lowActivityStaff[0]?.count || 0)

      if (lowActivityCount > 0) {
        alerts.push({
          id: "low-activity-staff",
          type: "info",
          icon: "person_alert",
          title: `${lowActivityCount} staff dengan aktivitas rendah`,
          message: "Beberapa staff memiliki kurang dari 3 aktivitas dalam 30 hari terakhir.",
          link: "/admin/activities",
          linkText: "Lihat Detail"
        })
      }
    }

    return alerts
  } catch (error) {
    console.error("Error fetching dashboard alerts:", error)
    return []
  }
}
