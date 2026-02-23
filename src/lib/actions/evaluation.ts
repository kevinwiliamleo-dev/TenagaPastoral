"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Validation schemas
const saveAnswersSchema = z.object({
  periodId: z.string(),
  appraiseeId: z.string().nullable(),
  answers: z.array(z.object({
    questionId: z.string(),
    scoreValue: z.number().min(1).max(5).nullable().optional(),
    textValue: z.string().nullable().optional(),
    boolValue: z.boolean().nullable().optional(),
  })),
  isFinal: z.boolean().default(false),
})

export type SaveAnswersInput = z.infer<typeof saveAnswersSchema>

// Get active periods for evaluation
export async function getActivePeriodsForEvaluation() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const periods = await prisma.$queryRaw<Array<{
    id: string
    name: string
    startDate: Date
    endDate: Date
    status: string
  }>>`
    SELECT id, name, "startDate", "endDate", status 
    FROM evaluation_periods 
    WHERE status = 'ACTIVE'
    ORDER BY "startDate" DESC
  `

  return periods.map(p => ({
    id: p.id,
    name: p.name,
    startDate: p.startDate,
    endDate: p.endDate,
    status: p.status,
  }))
}

// Get questions for a period
export async function getQuestionsForPeriod(periodId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const questions = await prisma.$queryRaw<Array<{
    id: string
    text: string
    type: string
    order: number
    isRequired: boolean
    periodId: string
  }>>`
    SELECT id, text, type, "order", "isRequired", "periodId"
    FROM questions
    WHERE "periodId" = ${periodId}
    ORDER BY "order" ASC
  `

  return questions.map(q => ({
    id: q.id,
    text: q.text,
    type: q.type,
    order: q.order,
    isRequired: q.isRequired,
    periodId: q.periodId,
  }))
}

// Get pastoral staff for peer evaluation (excluding self)
export async function getStaffForEvaluation() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const staff = await prisma.$queryRaw<Array<{
    id: string
    email: string
    name: string | null
    role: string
  }>>`
    SELECT id, email, name, role 
    FROM users 
    WHERE role = 'PASTORAL_STAFF' AND id != ${session.user.id}
    ORDER BY name ASC
  `

  return staff.map(s => ({
    id: s.id,
    email: s.email,
    name: s.name || s.email,
    role: s.role,
  }))
}

// Get existing submission if any (for resuming draft)
export async function getExistingSubmission(periodId: string, appraiseeId: string | null) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const appraiserId = session.user.id
  const targetAppraiseeId = appraiseeId || session.user.id // Self-evaluation if no appraisee

  const submissions = await prisma.$queryRaw<Array<{
    id: string
    appraiserId: string | null
    appraiseeId: string | null
    periodId: string
    submittedAt: Date
    isFinal: boolean
  }>>`
    SELECT id, "appraiserId", "appraiseeId", "periodId", "submittedAt", "isFinal"
    FROM evaluation_submissions
    WHERE "appraiserId" = ${appraiserId}
      AND "appraiseeId" = ${targetAppraiseeId}
      AND "periodId" = ${periodId}
    LIMIT 1
  `

  if (submissions.length === 0) {
    return null
  }

  const submission = submissions[0]
  
  // Get answers
  const answers = await prisma.$queryRaw<Array<{
    id: string
    submissionId: string
    questionId: string
    scoreValue: number | null
    textValue: string | null
    boolValue: boolean | null
  }>>`
    SELECT id, "submissionId", "questionId", "scoreValue", "textValue", "boolValue"
    FROM answers
    WHERE "submissionId" = ${submission.id}
  `

  return {
    id: submission.id,
    appraiserId: submission.appraiserId,
    appraiseeId: submission.appraiseeId,
    periodId: submission.periodId,
    submittedAt: submission.submittedAt,
    isFinal: submission.isFinal,
    answers: answers.map(a => ({
      id: a.id,
      questionId: a.questionId,
      scoreValue: a.scoreValue,
      textValue: a.textValue,
      boolValue: a.boolValue,
    })),
  }
}

// Save or update answers (draft or final submit)
export async function saveEvaluationAnswers(input: SaveAnswersInput) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = saveAnswersSchema.parse(input)
  const appraiserId = session.user.id
  const appraiseeId = validated.appraiseeId || session.user.id // Self-evaluation if null

  // Check for existing submission
  const existing = await getExistingSubmission(validated.periodId, validated.appraiseeId)

  if (existing) {
    // Cannot modify finalized submission
    if (existing.isFinal && validated.isFinal) {
      throw new Error("Evaluasi ini sudah final dan tidak dapat diubah")
    }

    // Update existing submission using transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete old answers
      await tx.answer.deleteMany({
        where: { submissionId: existing.id }
      })

      // 2. Update submission and create new answers
      await tx.evaluationSubmission.update({
        where: { id: existing.id },
        data: {
          isFinal: validated.isFinal,
          submittedAt: new Date(),
          answers: {
            create: validated.answers.map(a => ({
              questionId: a.questionId,
              scoreValue: a.scoreValue,
              textValue: a.textValue,
              boolValue: a.boolValue
            }))
          }
        }
      })
    })

    revalidatePath("/evaluations")
    revalidatePath("/dashboard")

    return { 
      success: true, 
      submissionId: existing.id,
      message: validated.isFinal ? "Evaluasi berhasil dikirim!" : "Draft tersimpan"
    }
  } else {
    // Create new submission using Prisma create with nested answers
    const submission = await prisma.evaluationSubmission.create({
      data: {
        appraiserId,
        appraiseeId,
        periodId: validated.periodId,
        isFinal: validated.isFinal,
        submittedAt: new Date(),
        answers: {
          create: validated.answers.map(a => ({
            questionId: a.questionId,
            scoreValue: a.scoreValue,
            textValue: a.textValue,
            boolValue: a.boolValue
          }))
        }
      }
    })

    revalidatePath("/evaluations")
    revalidatePath("/dashboard")

    return { 
      success: true, 
      submissionId: submission.id,
      message: validated.isFinal ? "Evaluasi berhasil dikirim!" : "Draft tersimpan"
    }
  }
}

// Get my evaluations (for staff to see their submissions)
export async function getMyEvaluations() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const submissions = await prisma.$queryRaw<Array<{
    id: string
    appraiserId: string | null
    appraiseeId: string | null
    periodId: string
    submittedAt: Date
    isFinal: boolean
    period_name: string
    appraisee_name: string | null
  }>>`
    SELECT 
      es.id, es."appraiserId", es."appraiseeId", es."periodId", es."submittedAt", es."isFinal",
      ep.name as period_name,
      u.name as appraisee_name
    FROM evaluation_submissions es
    JOIN evaluation_periods ep ON es."periodId" = ep.id
    LEFT JOIN users u ON es."appraiseeId" = u.id
    WHERE es."appraiserId" = ${session.user.id}
    ORDER BY es."submittedAt" DESC
  `

  return submissions.map(s => ({
    id: s.id,
    periodId: s.periodId,
    periodName: s.period_name,
    appraiseeId: s.appraiseeId,
    appraiseeName: s.appraisee_name || "Self",
    submittedAt: s.submittedAt,
    isFinal: s.isFinal,
    isSelfEvaluation: s.appraiserId === s.appraiseeId,
  }))
}
