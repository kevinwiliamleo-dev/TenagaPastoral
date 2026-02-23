"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// Get real dashboard stats using Prisma Client (no raw SQL)
export async function getDashboardStats() {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      totalStaff: 0,
      completedPercent: 0,
      pendingReview: 0
    }
  }

  const isAdmin = session.user.role === "ADMIN"

  try {
    // Total staff count using Prisma Client
    const totalStaff = await prisma.user.count({
      where: { role: "PASTORAL_STAFF" }
    })

    let completedPercent = 0
    let pendingReview = 0

    // Get active period
    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { status: "ACTIVE" }
    })

    if (activePeriod) {
      if (isAdmin) {
        // Admin: Get all submissions stats
        const totalSubmissions = await prisma.evaluationSubmission.count({
          where: { periodId: activePeriod.id }
        })
        
        const completedSubmissions = await prisma.evaluationSubmission.count({
          where: { 
            periodId: activePeriod.id,
            isFinal: true
          }
        })
        
        if (totalSubmissions > 0) {
          completedPercent = Math.round((completedSubmissions / totalSubmissions) * 100)
        } else {
          // Calculate expected submissions (all staff)
          completedPercent = totalStaff > 0 ? Math.round((completedSubmissions / totalStaff) * 100) : 0
        }

        // Pending review = submissions that are final but not yet reviewed
        // Since reviewedBy column doesn't exist, count submissions awaiting review
        // For now, pending = total staff - completed submissions
        pendingReview = Math.max(0, totalStaff - completedSubmissions)
      } else {
        // Staff: Get my submission stats
        const mySubmission = await prisma.evaluationSubmission.findFirst({
          where: {
            periodId: activePeriod.id,
            appraiserId: session.user.id
          },
          select: { isFinal: true }
        })
        
        completedPercent = mySubmission?.isFinal ? 100 : 0

        // My pending tasks
        const myPendingTasks = await prisma.pastoralTask.count({
          where: {
            OR: [
              { createdBy: session.user.id },
              { assignedTo: session.user.id }
            ],
            status: "TODO"
          }
        })
        pendingReview = myPendingTasks
      }
    }

    return {
      totalStaff,
      completedPercent,
      pendingReview
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalStaff: 0,
      completedPercent: 0,
      pendingReview: 0
    }
  }
}

