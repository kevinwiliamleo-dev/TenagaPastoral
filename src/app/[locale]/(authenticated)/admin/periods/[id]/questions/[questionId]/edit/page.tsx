import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { EditQuestionForm } from "./edit-question-form"
import { PeriodStatus } from "@prisma/client"

interface Props {
  params: Promise<{ id: string; questionId: string }>
}

export default async function EditQuestionPage({ params }: Props) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id: periodId, questionId } = await params

  const period = await prisma.evaluationPeriod.findUnique({
    where: { id: periodId },
  })

  if (!period) {
    redirect("/admin/periods")
  }

  if (period.status === PeriodStatus.CLOSED) {
    redirect(`/admin/periods/${periodId}/questions`)
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  })

  if (!question) {
    redirect(`/admin/periods/${periodId}/questions`)
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Edit Pertanyaan</h1>
          <p className="text-muted-foreground">{period.name}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Pertanyaan</CardTitle>
          <CardDescription>
            Ubah detail pertanyaan evaluasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditQuestionForm periodId={periodId} question={question} />
        </CardContent>
      </Card>
    </div>
  )
}
