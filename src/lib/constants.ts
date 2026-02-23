
import { QuestionType } from "@prisma/client"

export type QuestionFormState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export const QUESTION_TYPE_LABELS = {
  SCALE_1_TO_5: "Skala 1-5",
  TEXT: "Teks",
  BOOLEAN: "Ya/Tidak",
} as const

// Pillar info
export type PastoralPillar = "LITURGIA" | "DIAKONIA" | "KERYGMA" | "KOINONIA" | "MARTYRIA"

export const PILLAR_INFO: Record<PastoralPillar, { name: string; icon: string; color: string; description: string }> = {
  LITURGIA: { name: "Liturgia", icon: "church", color: "bg-purple-500", description: "Peribadatan" },
  DIAKONIA: { name: "Diakonia", icon: "volunteer_activism", color: "bg-orange-500", description: "Pelayanan Sosial" },
  KERYGMA: { name: "Kerygma", icon: "campaign", color: "bg-blue-500", description: "Pewartaan" },
  KOINONIA: { name: "Koinonia", icon: "groups", color: "bg-green-500", description: "Persekutuan" },
  MARTYRIA: { name: "Martyria", icon: "local_fire_department", color: "bg-red-500", description: "Kesaksian" },
}
