"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { QuestionType, PeriodStatus } from "@prisma/client"
import { QUESTION_TYPE_LABELS, QuestionFormState } from "@/lib/constants"

export type { QuestionFormState }

// Validation schemas
const questionSchema = z.object({
  text: z.string().min(5, "Pertanyaan minimal 5 karakter"),
  type: z.nativeEnum(QuestionType),
  order: z.coerce.number().min(1).default(1),
  isRequired: z.boolean().default(true),
  periodId: z.string().min(1, "Period ID diperlukan"),
  weight: z.coerce.number().min(1).default(1),
  category: z.string().default("General"),
})

// Get all questions for a period
export async function getQuestionsByPeriod(periodId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const questions = await prisma.question.findMany({
    where: { periodId },
    orderBy: { order: "asc" },
  })

  return questions
}

// Get single question
export async function getQuestion(id: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      period: true,
    },
  })

  return question
}

// Create question
export async function createQuestion(
  prevState: QuestionFormState,
  formData: FormData
): Promise<QuestionFormState> {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" }
  }

  const validatedFields = questionSchema.safeParse({
    text: formData.get("text"),
    type: formData.get("type"),
    order: formData.get("order"),
    isRequired: formData.get("isRequired") === "true",
    periodId: formData.get("periodId"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validasi gagal",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { text, type, order, isRequired, periodId, weight, category } = validatedFields.data

  try {
    // Check if period exists and is not closed
    const period = await prisma.evaluationPeriod.findUnique({
      where: { id: periodId },
    })

    if (!period) {
      return { success: false, message: "Periode tidak ditemukan" }
    }

    if (period.status === PeriodStatus.CLOSED) {
      return { success: false, message: "Periode sudah ditutup, tidak bisa menambah pertanyaan" }
    }

    // Get max order if not provided
    let finalOrder = order
    if (order === 1) {
      const maxOrder = await prisma.question.aggregate({
        where: { periodId },
        _max: { order: true },
      })
      finalOrder = (maxOrder._max.order ?? 0) + 1
    }

    await prisma.question.create({
      data: {
        text,
        type,
        order: finalOrder,
        isRequired,
        periodId,
        weight,
        category,
      },
    })

    revalidatePath(`/admin/periods/${periodId}/questions`)
    return { success: true, message: "Pertanyaan berhasil ditambahkan" }
  } catch (error) {
    console.error("Error creating question:", error)
    return { success: false, message: "Gagal membuat pertanyaan" }
  }
}

// Update question
export async function updateQuestion(
  prevState: QuestionFormState,
  formData: FormData
): Promise<QuestionFormState> {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" }
  }

  const id = formData.get("id") as string
  
  const validatedFields = questionSchema.safeParse({
    text: formData.get("text"),
    type: formData.get("type"),
    order: formData.get("order"),
    isRequired: formData.get("isRequired") === "true",
    periodId: formData.get("periodId"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validasi gagal",
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { text, type, order, isRequired, periodId, weight, category } = validatedFields.data

  try {
    // Check if period is closed
    const period = await prisma.evaluationPeriod.findUnique({
      where: { id: periodId },
    })

    if (period?.status === PeriodStatus.CLOSED) {
      return { success: false, message: "Periode sudah ditutup, tidak bisa mengubah pertanyaan" }
    }

    await prisma.question.update({
      where: { id },
      data: {
        text,
        type,
        order,
        isRequired,
        weight: validatedFields.data.weight,
        category: validatedFields.data.category,
      },
    })

    revalidatePath(`/admin/periods/${periodId}/questions`)
    return { success: true, message: "Pertanyaan berhasil diperbarui" }
  } catch (error) {
    console.error("Error updating question:", error)
    return { success: false, message: "Gagal memperbarui pertanyaan" }
  }
}

// Delete question
export async function deleteQuestion(id: string, periodId: string): Promise<QuestionFormState> {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" }
  }

  try {
    // Check if period is closed
    const period = await prisma.evaluationPeriod.findUnique({
      where: { id: periodId },
    })

    if (period?.status === PeriodStatus.CLOSED) {
      return { success: false, message: "Periode sudah ditutup, tidak bisa menghapus pertanyaan" }
    }

    // Check if question has answers
    const answersCount = await prisma.answer.count({
      where: { questionId: id },
    })

    if (answersCount > 0) {
      return { 
        success: false, 
        message: `Pertanyaan memiliki ${answersCount} jawaban, tidak bisa dihapus` 
      }
    }

    await prisma.question.delete({
      where: { id },
    })

    revalidatePath(`/admin/periods/${periodId}/questions`)
    return { success: true, message: "Pertanyaan berhasil dihapus" }
  } catch (error) {
    console.error("Error deleting question:", error)
    return { success: false, message: "Gagal menghapus pertanyaan" }
  }
}

// Bulk create questions (for templates)
export async function bulkCreateQuestions(
  periodId: string,
  questions: Array<{ text: string; type: QuestionType; isRequired?: boolean }>
): Promise<QuestionFormState> {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const period = await prisma.evaluationPeriod.findUnique({
      where: { id: periodId },
    })

    if (!period) {
      return { success: false, message: "Periode tidak ditemukan" }
    }

    if (period.status === PeriodStatus.CLOSED) {
      return { success: false, message: "Periode sudah ditutup" }
    }

    // Get current max order
    const maxOrder = await prisma.question.aggregate({
      where: { periodId },
      _max: { order: true },
    })
    let currentOrder = maxOrder._max.order ?? 0

    // Create questions with auto-incrementing order
    const questionsData = questions.map((q) => {
      currentOrder++
      return {
        text: q.text,
        type: q.type,
        order: currentOrder,
        isRequired: q.isRequired ?? true,
        periodId,
      }
    })

    await prisma.question.createMany({
      data: questionsData,
    })

    revalidatePath(`/admin/periods/${periodId}/questions`)
    return { success: true, message: `${questions.length} pertanyaan berhasil ditambahkan` }
  } catch (error) {
    console.error("Error bulk creating questions:", error)
    return { success: false, message: "Gagal membuat pertanyaan" }
  }
}

// Get question count by period
export async function getQuestionCount(periodId: string): Promise<number> {
  const count = await prisma.question.count({
    where: { periodId },
  })
  return count
}
