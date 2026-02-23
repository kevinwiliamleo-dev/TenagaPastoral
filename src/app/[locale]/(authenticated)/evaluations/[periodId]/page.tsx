import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { 
  getQuestionsForPeriod, 
  getStaffForEvaluation, 
  getExistingSubmission 
} from "@/lib/actions/evaluation"
import prisma from "@/lib/prisma"
import { EvaluationFormClient } from "./evaluation-form-client"

interface DbPeriod {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: string
}

interface PageProps {
  params: Promise<{ periodId: string }>
  searchParams: Promise<{ type?: string; target?: string }>
}

export default async function EvaluationFormPage({ params, searchParams }: PageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { periodId } = await params
  const { type, target } = await searchParams

  // Get period info using Prisma Client (not raw SQL)
  const period = await prisma.evaluationPeriod.findUnique({
    where: { id: periodId },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
    }
  })

  if (!period) {
    notFound()
  }

  // Check if period is active
  if (period.status !== "ACTIVE") {
    redirect("/evaluations?error=period_not_active")
  }

  // Get questions
  const questions = await getQuestionsForPeriod(periodId)

  if (questions.length === 0) {
    redirect("/evaluations?error=no_questions")
  }

  // Determine evaluation type and target
  const evaluationType = type === "peer" ? "peer" : "self"
  const appraiseeId = evaluationType === "self" ? session.user?.id || null : target || null

  // If peer evaluation, get staff list
  let staffList: { id: string; name: string; email: string }[] = []
  if (evaluationType === "peer") {
    staffList = await getStaffForEvaluation()
  }

  // Get existing submission if any
  let existingSubmission = null
  if (appraiseeId) {
    try {
      existingSubmission = await getExistingSubmission(periodId, evaluationType === "self" ? null : appraiseeId)
    } catch {
      // No existing submission
    }
  }

  return (
    <EvaluationFormClient
      period={{
        id: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
      }}
      questions={questions}
      evaluationType={evaluationType}
      appraiseeId={appraiseeId}
      staffList={staffList}
      existingSubmission={existingSubmission}
      userId={session.user?.id || ""}
      userName={session.user?.name || ""}
    />
  )
}
