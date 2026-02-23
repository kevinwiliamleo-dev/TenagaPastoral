"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { CalendarEvent } from "@/components/calendar/types"
import { addHours } from "date-fns" // Optional handling if needed, but direct date obj is fine

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const events: CalendarEvent[] = []
  const userId = session.user.id
  const isAdmin = session.user.role === "ADMIN"

  try {
    // Run fetching in parallel
    const [periods, tasks, goals] = await Promise.all([
      // 1. Fetch Evaluation Periods (Global)
      prisma.evaluationPeriod.findMany({
        where: { status: "ACTIVE" } 
      }),
      // 2. Fetch Tasks (Personal)
      prisma.pastoralTask.findMany({
        where: {
          assignedTo: userId,
          status: { not: "COMPLETED" } 
        }
      }),
      // 3. Fetch Goals (Personal)
      prisma.staffGoal.findMany({
        where: {
          userId: userId,
          status: "ACTIVE"
        }
      })
    ])

    // Process Periods
    periods.forEach(period => {
      events.push({
        id: `period-${period.id}`,
        title: `Periode: ${period.name}`,
        start: period.startDate,
        end: period.endDate,
        type: "PERIOD",
        color: "purple",
        status: period.status,
        url: isAdmin ? `/admin/periods` : `/evaluations`
      })
    })

    // Process Tasks
    tasks.forEach(task => {
      if (task.dueDate) {
        events.push({
          id: `task-${task.id}`,
          title: `Tugas: ${task.title}`,
          start: task.dueDate,
          end: task.dueDate, // Single day event
          type: "TASK",
          color: "blue",
          description: task.description || "",
          status: task.status,
          url: `/tasks`
        })
      }
    })

    // Process Goals
    goals.forEach(goal => {
      if (goal.targetDate) {
         events.push({
          id: `goal-${goal.id}`,
          title: `Target: ${goal.title}`,
          start: goal.targetDate,
          end: goal.targetDate,
          type: "GOAL",
          color: "green",
          status: "Target",
          url: `/goals`
        })
      }
    })

    // 4. Fetch Activities (History - Optional, maybe limit to last 30 days if too many?)
    // Let's fetch recent activities to show "what I did"
    /* 
    const activities = await prisma.pastoralActivity.findMany({
        where: { userId: userId },
        orderBy: { date: 'desc' },
        take: 20
    })
    
    // Adding activities might clutter the "Planning" view. 
    // The user asked for "Visual Calendar... memudahkan user melihat apa yang HARUS diperhatikan".
    // So usually future deadlines are more important. Let's keep activities out for now or optional.
    */

  } catch (error) {
    console.error("Error fetching calendar events:", error)
  }

  return events
}
