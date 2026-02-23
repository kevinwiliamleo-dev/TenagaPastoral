"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
  isPublished: boolean
}

// Get all published FAQs
export async function getFAQs() {
  try {
    const faqs = await prisma.$queryRaw<FAQ[]>`
      SELECT id, question, answer, category, "order", "isPublished"
      FROM faqs
      WHERE "isPublished" = true
      ORDER BY category, "order"
    `
    
    // Group by category
    const grouped: Record<string, FAQ[]> = {}
    for (const faq of faqs) {
      if (!grouped[faq.category]) {
        grouped[faq.category] = []
      }
      grouped[faq.category].push(faq)
    }
    
    return grouped
  } catch (error) {
    console.error("Error fetching FAQs:", error)
    // Return default FAQs if table doesn't exist
    return {
      "Evaluasi": [
        { id: "1", question: "Bagaimana cara mengisi evaluasi?", answer: 'Buka menu "Evaluasi" dari sidebar, pilih periode yang aktif, pilih staf yang ingin dinilai, lalu isi formulir evaluasi dan klik "Kirim".', category: "Evaluasi", order: 1, is_published: true },
        { id: "2", question: "Siapa yang bisa melihat hasil evaluasi saya?", answer: "Hasil evaluasi Anda hanya dapat dilihat oleh Administrator dan diri Anda sendiri. Evaluator lain tidak dapat melihat hasil Anda.", category: "Evaluasi", order: 2, is_published: true },
        { id: "3", question: "Kapan periode evaluasi dibuka?", answer: "Periode evaluasi biasanya dibuka setiap semester. Administrator akan mengaktifkan periode dan Anda akan melihat notifikasi di dashboard.", category: "Evaluasi", order: 3, is_published: true },
      ],
      "Akun": [
        { id: "4", question: "Bagaimana cara mengubah password?", answer: 'Buka menu "Profil" dari sidebar, scroll ke bagian "Keamanan", masukkan password lama dan password baru, lalu klik "Ubah Password".', category: "Akun", order: 1, is_published: true },
      ],
      "Umum": [
        { id: "5", question: "Apa itu Panca Tugas?", answer: "Panca Tugas adalah lima pilar pelayanan pastoral: Liturgia (Peribadatan), Diakonia (Pelayanan Sosial), Kerygma (Pewartaan), Koinonia (Persekutuan), dan Martyria (Kesaksian).", category: "Umum", order: 1, is_published: true },
        { id: "6", question: "Bagaimana cara menghubungi admin?", answer: "Hubungi admin melalui email atau telepon kantor Pusat Pastoral Keuskupan Surabaya.", category: "Umum", order: 2, is_published: true },
      ],
    }
  }
}

// Admin: Get all FAQs
export async function getAllFAQs() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    const faqs = await prisma.$queryRaw<FAQ[]>`
      SELECT id, question, answer, category, "order", "isPublished"
      FROM faqs
      ORDER BY category, "order"
    `
    return faqs
  } catch (error) {
    console.error("Error fetching FAQs:", error)
    return []
  }
}

// Admin: Create FAQ
export async function createFAQ(input: { question: string; answer: string; category: string }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" }
  }

  const { question, answer, category } = input

  if (!question || !answer) {
    return { success: false, message: "Pertanyaan dan jawaban wajib diisi" }
  }

  try {
    await prisma.fAQ.create({
      data: {
        question,
        answer,
        category: category || "Umum",
        // id, order, isPublished handled by defaults
      }
    })

    revalidatePath("/help")
    return { success: true, message: "FAQ berhasil ditambahkan" }
  } catch (error) {
    console.error("Error creating FAQ:", error)
    return { success: false, message: "Gagal menambahkan FAQ" }
  }
}

// Admin: Delete FAQ
export async function deleteFAQ(id: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await prisma.$executeRaw`
      DELETE FROM faqs WHERE id = ${id}
    `

    revalidatePath("/help")
    return { success: true, message: "FAQ berhasil dihapus" }
  } catch (error) {
    console.error("Error deleting FAQ:", error)
    return { success: false, message: "Gagal menghapus FAQ" }
  }
}
