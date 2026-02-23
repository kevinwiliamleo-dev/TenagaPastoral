import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, FileText, Edit, AlertCircle, Lock } from "lucide-react"
import { getQuestionsByPeriod } from "@/lib/actions/questions"
import { QUESTION_TYPE_LABELS } from "@/lib/constants"
import { DeleteQuestionButton } from "./delete-button"
import { PeriodStatus } from "@prisma/client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function QuestionsPage({ params }: Props) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id: periodId } = await params

  const period = await prisma.evaluationPeriod.findUnique({
    where: { id: periodId },
  })

  // If period not found, redirect to admin periods list
  if (!period) {
    redirect("/admin/periods")
  }

  const questions = await getQuestionsByPeriod(periodId)
  const isClosed = period.status === PeriodStatus.CLOSED

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/admin/periods`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kelola Pertanyaan</h1>
              <p className="text-muted-foreground">
                {period.name} • {questions.length} pertanyaan
              </p>
            </div>
          </div>
          {!isClosed && (
            <div className="flex gap-2">
              <Link href={`/admin/periods/${periodId}/questions/templates`}>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Template
                </Button>
              </Link>
              <Link href={`/admin/periods/${periodId}/questions/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Pertanyaan
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Closed Warning */}
        {isClosed && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <CardContent className="flex items-center gap-3 py-4">
              <Lock className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 dark:text-amber-200">
                Periode ini sudah ditutup. Pertanyaan tidak bisa diubah atau dihapus.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        {questions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum Ada Pertanyaan</h3>
              <p className="text-muted-foreground text-center mb-4">
                Mulai dengan menambahkan pertanyaan baru atau gunakan template.
              </p>
              {!isClosed && (
                <div className="flex gap-2">
                  <Link href={`/admin/periods/${periodId}/questions/templates`}>
                    <Button variant="outline">Gunakan Template</Button>
                  </Link>
                  <Link href={`/admin/periods/${periodId}/questions/new`}>
                    <Button>Tambah Pertanyaan</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Daftar Pertanyaan</CardTitle>
              <CardDescription>
                Pertanyaan diurutkan berdasarkan nomor urut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{question.order}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {QUESTION_TYPE_LABELS[question.type]}
                        </span>
                        {question.isRequired && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            Wajib
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{question.text}</p>
                    </div>
                    {!isClosed && (
                      <div className="flex items-center gap-1 ml-4">
                        {/* Edit link - note we might need to create this route if it doesn't exist too */}
                        <Link href={`/admin/periods/${periodId}/questions/${question.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DeleteQuestionButton 
                          questionId={question.id} 
                          periodId={periodId}
                          questionText={question.text}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{questions.length}</p>
                  <p className="text-sm text-muted-foreground">Total Pertanyaan</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">
                    {questions.filter(q => q.isRequired).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pertanyaan Wajib</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">
                    {questions.filter(q => q.type === "SCALE_1_TO_5").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Tipe Skala</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  )
}
