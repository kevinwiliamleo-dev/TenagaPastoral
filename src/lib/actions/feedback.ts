"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const commentSchema = z.object({
  planId: z.string().uuid(),
  content: z.string().min(1, "Komentar tidak boleh kosong").max(1000, "Komentar terlalu panjang"),
})

export type CommentWithAuthor = {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    email: string | null
    role: string
    image?: string | null // If we add user image later
  }
}

export async function createComment(planId: string, content: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return { error: "Unauthorized" }
    }

    const validData = commentSchema.parse({ planId, content })

    const comment = await prisma.feedbackComment.create({
      data: {
        planId: validData.planId,
        content: validData.content,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    revalidatePath("/results")
    revalidatePath("/admin/analytics")

    // Optionally create notification for the other party
    // (Implementation skipped for now as per plan, but placeholder logic here)

    return { success: true, comment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation Error" }
    }
    return { error: "Gagal mengirim komentar" }
  }
}

export async function getComments(planId: string) {
  try {
    const comments = await prisma.feedbackComment.findMany({
      where: { planId },
      orderBy: { createdAt: "asc" }, // Thread order
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })
    return { success: true, comments }
  } catch (error) {
    return { error: "Gagal mengambil komentar" }
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return { error: "Unauthorized" }
    }

    const comment = await prisma.feedbackComment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      return { error: "Komentar tidak ditemukan" }
    }

    // Only author or admin can delete
    if (comment.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return { error: "Forbidden" }
    }

    await prisma.feedbackComment.delete({
      where: { id: commentId }
    })

    revalidatePath("/results")
    revalidatePath("/admin/analytics")

    return { success: true }
  } catch (error) {
    return { error: "Gagal menghapus komentar" }
  }
}
