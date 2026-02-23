"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Validation schemas
const createPeriodSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  startDate: z.string(),
  endDate: z.string(),
})

const updatePeriodSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Nama minimal 3 karakter").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>

// Get all periods with stats
export async function getPeriods() {
  const session = await auth()
  if (!session) {
    throw new Error("Unauthorized")
  }

  const periods = await prisma.evaluationPeriod.findMany({
    orderBy: { startDate: "desc" },
    include: {
      _count: {
        select: {
          questions: true,
          submissions: true,
        },
      },
      submissions: {
        select: {
          isFinal: true,
        },
      },
    },
  })

  return periods.map((period) => ({
    id: period.id,
    name: period.name,
    startDate: period.startDate,
    endDate: period.endDate,
    status: period.status,
    questionsCount: period._count.questions,
    submissionsCount: period._count.submissions,
    completedCount: period.submissions.filter((s) => s.isFinal).length,
  }))
}

// Get single period by ID
export async function getPeriodById(id: string) {
  const session = await auth()
  if (!session) {
    throw new Error("Unauthorized")
  }

  const period = await prisma.evaluationPeriod.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  })

  if (!period) {
    throw new Error("Period not found")
  }

  return period
}

// Create new period
export async function createPeriod(input: CreatePeriodInput) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const validated = createPeriodSchema.parse(input)

  const startDate = new Date(validated.startDate)
  const endDate = new Date(validated.endDate)

  // Validate dates
  if (endDate <= startDate) {
    throw new Error("Tanggal akhir harus setelah tanggal mulai")
  }

  const period = await prisma.evaluationPeriod.create({
    data: {
      name: validated.name,
      startDate,
      endDate,
      status: "DRAFT",
    },
  })

  revalidatePath("/admin/periods")

  return { success: true, period: { id: period.id, name: period.name } }
}

// Update period
export async function updatePeriod(input: UpdatePeriodInput) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const validated = updatePeriodSchema.parse(input)
  const { id, name, startDate, endDate } = validated

  // Check if period exists and is not closed
  const existingPeriod = await prisma.evaluationPeriod.findUnique({
    where: { id },
  })

  if (!existingPeriod) {
    throw new Error("Period not found")
  }

  if (existingPeriod.status === "CLOSED") {
    throw new Error("Tidak dapat mengubah periode yang sudah ditutup")
  }

  // Build update data with date conversion
  const updateData: {
    name?: string
    startDate?: Date
    endDate?: Date
  } = {}

  if (name) updateData.name = name
  if (startDate) updateData.startDate = new Date(startDate)
  if (endDate) updateData.endDate = new Date(endDate)

  const period = await prisma.evaluationPeriod.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/admin/periods")

  return { success: true, period: { id: period.id, name: period.name } }
}

// Delete period
export async function deletePeriod(id: string) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  // Check if period exists
  const period = await prisma.evaluationPeriod.findUnique({
    where: { id },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  })

  if (!period) {
    throw new Error("Period not found")
  }

  if (period._count.submissions > 0) {
    throw new Error("Tidak dapat menghapus periode yang sudah memiliki submission")
  }

  await prisma.evaluationPeriod.delete({
    where: { id },
  })

  revalidatePath("/admin/periods")

  return { success: true }
}

// Activate period
export async function activatePeriod(id: string) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const period = await prisma.evaluationPeriod.findUnique({
    where: { id },
    include: {
      _count: { select: { questions: true } },
    },
  })

  if (!period) {
    throw new Error("Period not found")
  }

  if (period.status !== "DRAFT") {
    throw new Error("Hanya periode dengan status DRAFT yang dapat diaktifkan")
  }

  if (period._count.questions === 0) {
    throw new Error("Periode harus memiliki minimal 1 pertanyaan sebelum diaktifkan")
  }

  // Deactivate any other active periods first
  await prisma.evaluationPeriod.updateMany({
    where: { status: "ACTIVE" },
    data: { status: "CLOSED" },
  })

  // Activate this period
  await prisma.evaluationPeriod.update({
    where: { id },
    data: { status: "ACTIVE" },
  })

  revalidatePath("/admin/periods")

  return { success: true }
}

// Close period
export async function closePeriod(id: string) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const period = await prisma.evaluationPeriod.findUnique({
    where: { id },
  })

  if (!period) {
    throw new Error("Period not found")
  }

  if (period.status !== "ACTIVE") {
    throw new Error("Hanya periode aktif yang dapat ditutup")
  }

  await prisma.evaluationPeriod.update({
    where: { id },
    data: { status: "CLOSED" },
  })

  revalidatePath("/admin/periods")

  return { success: true }
}

// Get period stats
export async function getPeriodStats() {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const [total, active, draft, closed] = await Promise.all([
    prisma.evaluationPeriod.count(),
    prisma.evaluationPeriod.count({ where: { status: "ACTIVE" } }),
    prisma.evaluationPeriod.count({ where: { status: "DRAFT" } }),
    prisma.evaluationPeriod.count({ where: { status: "CLOSED" } }),
  ])

  return { total, active, draft, closed }
}
