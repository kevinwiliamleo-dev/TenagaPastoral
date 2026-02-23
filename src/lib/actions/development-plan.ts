"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { PlanStatus } from "@prisma/client"

// Get Development Plan
export async function getDevelopmentPlan(userId: string, periodId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  // Staff can only read their own, Admin can read any
  if (session.user.role !== "ADMIN" && session.user.id !== userId) {
    throw new Error("Unauthorized")
  }

  return prisma.developmentPlan.findUnique({
    where: { userId_periodId: { userId, periodId } },
    include: { 
      user: { select: { name: true, email: true } },
      comments: { 
        include: { 
          author: { select: { id: true, name: true, email: true, role: true } } 
        },
        orderBy: { createdAt: "asc" }
      }
    }
  })
}

// Create/Update Development Plan (Admin Only)
export async function saveDevelopmentPlan(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" }
  }

  const userId = formData.get("userId") as string
  const periodId = formData.get("periodId") as string
  const strengths = formData.get("strengths") as string
  const areasOfImprovement = formData.get("areasOfImprovement") as string
  const recommendations = formData.get("recommendations") as string
  const status = (formData.get("status") as string || "DRAFT") as PlanStatus

  try {
    await prisma.developmentPlan.upsert({
      where: { userId_periodId: { userId, periodId } },
      create: {
        userId, periodId, strengths, areasOfImprovement, recommendations, status, createdBy: session.user.id
      },
      update: {
        strengths, areasOfImprovement, recommendations, status, createdBy: session.user.id
      }
    })

    revalidatePath(`/admin/analytics`)
    return { success: true, message: "Development plan saved successfully" }
  } catch (error) {
    console.error("Error saving development plan:", error)
    return { success: false, message: "Failed to save development plan" }
  }
}
