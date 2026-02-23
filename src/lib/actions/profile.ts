"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { hash, compare } from "bcryptjs"
import { z } from "zod"

// User profile type for raw query
interface DbUser {
  id: string
  email: string
  name: string | null
  password: string
  role: string
}

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  birthDate: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Get current user profile
export async function getProfile() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      birthDate: true,
      joinDate: true,
    }
  })

  if (!user) {
    throw new Error("User not found")
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role,
    birthDate: user.birthDate,
    joinDate: user.joinDate,
  }
}

// Update profile
export async function updateProfile(input: UpdateProfileInput) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = updateProfileSchema.parse(input)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: validated.name,
      birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
      joinDate: validated.joinDate ? new Date(validated.joinDate) : null,
    }
  })

  revalidatePath("/profile")
  revalidatePath("/dashboard")

  return { success: true, message: "Profil berhasil diperbarui" }
}

// Change password
export async function changePassword(input: ChangePasswordInput) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = changePasswordSchema.parse(input)

  // Get current user with password
  const users = await prisma.$queryRaw<DbUser[]>`
    SELECT id, password FROM users WHERE id = ${session.user.id} LIMIT 1
  `

  if (users.length === 0) {
    throw new Error("User not found")
  }

  const user = users[0]

  // Verify current password
  const isValidPassword = await compare(validated.currentPassword, user.password)
  if (!isValidPassword) {
    throw new Error("Password lama tidak benar")
  }

  // Hash new password
  const hashedPassword = await hash(validated.newPassword, 12)

  // Update password
  await prisma.$executeRaw`
    UPDATE users SET password = ${hashedPassword} WHERE id = ${session.user.id}
  `

  return { success: true, message: "Password berhasil diubah" }
}
