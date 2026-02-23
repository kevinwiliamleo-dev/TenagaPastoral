import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import { TemplateSelector } from "./template-selector"
import { PeriodStatus } from "@prisma/client"

interface Props {
  params: Promise<{ id: string }>
}

import { QUESTION_TEMPLATES } from "@/lib/constants/question-templates"

export default async function TemplatesPage({ params }: Props) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id: periodId } = await params

  const period = await prisma.evaluationPeriod.findUnique({
    where: { id: periodId },
  })

  if (!period) {
    redirect("/admin/periods")
  }

  if (period.status === PeriodStatus.CLOSED) {
    redirect(`/admin/periods/${periodId}/questions`)
  }

  // Check existing questions count
  const existingCount = await prisma.question.count({
    where: { periodId },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/periods/${periodId}/questions`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Template Pertanyaan</h1>
          <p className="text-muted-foreground">{period.name}</p>
        </div>
      </div>

      {/* Warning if questions exist */}
      {existingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="flex items-center gap-3 py-4">
            <FileText className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800 dark:text-amber-200">
              Periode ini sudah memiliki {existingCount} pertanyaan. Menggunakan template akan menambahkan pertanyaan baru.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Template Selection */}
      <TemplateSelector periodId={periodId} templates={QUESTION_TEMPLATES} />
    </div>
  )
}
