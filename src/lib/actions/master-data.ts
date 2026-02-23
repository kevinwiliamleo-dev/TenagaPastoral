"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export interface MasterData {
  id: string
  type: string
  code: string
  label: string
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type MasterDataType = "JOB_TITLE" | "FAQ_CATEGORY" | "OTHER"

// Get active master data by type (for dropdowns)
export async function getMasterDataByType(type: string): Promise<MasterData[]> {
  const session = await auth()
  if (!session?.user) return []

  try {
    const data = await prisma.masterData.findMany({
      where: { 
        type, 
        isActive: true 
      },
      orderBy: { order: 'asc' }
    })
    return data
  } catch (error) {
    console.error(`Error fetching master data type ${type}:`, error)
    return []
  }
}

// Admin: Get all data
export async function getAllMasterData(type?: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    const whereClause = type ? { type } : {}
    return await prisma.masterData.findMany({
      where: whereClause,
      orderBy: [
        { type: 'asc' },
        { order: 'asc' }
      ]
    })
  } catch (error) {
    console.error("Error fetching all master data:", error)
    return []
  }
}

// Admin: Create
export async function createMasterData(input: { type: string; code: string; label: string; order?: number }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.masterData.create({
      data: {
        type: input.type,
        code: input.code.toUpperCase().replace(/\s+/g, '_'),
        label: input.label,
        order: input.order || 0,
        isActive: true
      }
    })
    
    revalidatePath("/admin/master-data")
    return { success: true, message: "Data berhasil ditambahkan" }
  } catch (error) {
    console.error("Error creating master data:", error)
    return { success: false, message: "Gagal menambahkan data. Kode mungkin sudah ada." }
  }
}

// Admin: Update
export async function updateMasterData(id: string, input: { label?: string; order?: number; isActive?: boolean }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.masterData.update({
      where: { id },
      data: input
    })

    revalidatePath("/admin/master-data")
    return { success: true, message: "Data berhasil diperbarui" }
  } catch (error) {
    console.error("Error updating master data:", error)
    return { success: false, message: "Gagal memperbarui data" }
  }
}

// Admin: Delete
export async function deleteMasterData(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.masterData.delete({
      where: { id }
    })

    revalidatePath("/admin/master-data")
    return { success: true, message: "Data berhasil dihapus" }
  } catch (error) {
    console.error("Error deleting master data:", error)
    return { success: false, message: "Gagal menghapus data" }
  }
}
