"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { saveEvaluationAnswers } from "@/lib/actions/evaluation"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"

interface Question {
  id: string
  text: string
  type: string
  order: number
  isRequired: boolean
}

interface Period {
  id: string
  name: string
  startDate: Date
  endDate: Date
}

interface ExistingAnswer {
  id: string
  questionId: string
  scoreValue: number | null
  textValue: string | null
  boolValue: boolean | null
}

interface ExistingSubmission {
  id: string
  answers: ExistingAnswer[]
  isFinal: boolean
}

interface Staff {
  id: string
  name: string
  email: string
}

interface EvaluationFormClientProps {
  period: Period
  questions: Question[]
  evaluationType: "self" | "peer"
  appraiseeId: string | null
  staffList: Staff[]
  existingSubmission: ExistingSubmission | null
  userId: string
  userName: string
}

export function EvaluationFormClient({
  period,
  questions,
  evaluationType,
  appraiseeId: initialAppraiseeId,
  staffList,
  existingSubmission,
  userId,
  userName,
}: EvaluationFormClientProps) {
  const t = useTranslations("EvaluationForm")
  const router = useRouter()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedAppraisee, setSelectedAppraisee] = useState<string | null>(initialAppraiseeId)
  const [answers, setAnswers] = useState<Record<string, { score?: number; text?: string; bool?: boolean }>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const ratingLabels = [
    { value: 1, label: t("ratings.1") },
    { value: 2, label: t("ratings.2") },
    { value: 3, label: t("ratings.3") },
    { value: 4, label: t("ratings.4") },
    { value: 5, label: t("ratings.5") },
  ]

  // Load existing answers
  useEffect(() => {
    if (existingSubmission?.answers) {
      const loadedAnswers: Record<string, { score?: number; text?: string; bool?: boolean }> = {}
      existingSubmission.answers.forEach(answer => {
        loadedAnswers[answer.questionId] = {
          score: answer.scoreValue ?? undefined,
          text: answer.textValue ?? undefined,
          bool: answer.boolValue ?? undefined,
        }
      })
      setAnswers(loadedAnswers)
    }
  }, [existingSubmission])

  const currentQuestion = questions[currentStep]
  const totalQuestions = questions.length
  const progress = ((currentStep + 1) / totalQuestions) * 100

  // Count answered questions
  const answeredCount = Object.keys(answers).filter(key => {
    const answer = answers[key]
    return answer.score !== undefined || answer.text !== undefined || answer.bool !== undefined
  }).length

  const handleAnswerChange = (questionId: string, value: { score?: number; text?: string; bool?: boolean }) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...value },
    }))
  }

  const handleSaveDraft = async () => {
    if (!selectedAppraisee && evaluationType === "peer") {
      toast({
        title: t("toast.error_title"),
        description: t("toast.select_target"),
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        scoreValue: answer.score ?? null,
        textValue: answer.text ?? null,
        boolValue: answer.bool ?? null,
      }))

      await saveEvaluationAnswers({
        periodId: period.id,
        appraiseeId: evaluationType === "peer" ? selectedAppraisee : null,
        answers: formattedAnswers,
        isFinal: false,
      })

      setLastSaved(new Date())
      toast({
        title: t("toast.saved_title"),
        description: t("toast.draft_saved"),
        variant: "default",
      })
    } catch (error) {
      toast({
        title: t("toast.error_title"),
        description: error instanceof Error ? error.message : t("toast.save_failed"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    // Validate all required questions are answered
    const unanswered = questions.filter(q => {
      if (!q.isRequired) return false
      const answer = answers[q.id]
      if (!answer) return true
      if (q.type === "SCALE_1_TO_5" && answer.score === undefined) return true
      if (q.type === "TEXT" && !answer.text) return true
      if (q.type === "BOOLEAN" && answer.bool === undefined) return true
      return false
    })

    if (unanswered.length > 0) {
      toast({
        title: t("toast.attention_title"),
        description: t("toast.unanswered", { count: unanswered.length }),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        scoreValue: answer.score ?? null,
        textValue: answer.text ?? null,
        boolValue: answer.bool ?? null,
      }))

      await saveEvaluationAnswers({
        periodId: period.id,
        appraiseeId: evaluationType === "peer" ? selectedAppraisee : null,
        answers: formattedAnswers,
        isFinal: true,
      })

      toast({
        title: t("toast.success_title"),
        description: t("toast.submit_success"),
        variant: "default",
      })

      router.push("/evaluations?success=submitted")
    } catch (error) {
      toast({
        title: t("toast.error_title"),
        description: error instanceof Error ? error.message : t("toast.submit_failed"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // If peer evaluation and no target selected, show selection screen
  if (evaluationType === "peer" && !selectedAppraisee) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
          <div className="px-6 md:px-10 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/evaluations" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                    {t("header.peer")}
                  </h2>
                  <span className="text-xs text-muted-foreground">{period.name}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex justify-center w-full px-4 md:px-6 py-8">
          <div className="w-full max-w-[600px]">
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 mb-4">
                  <span className="material-symbols-outlined text-3xl text-primary">group</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{t("peer_selection.title")}</h1>
                <p className="text-muted-foreground">
                  {t("peer_selection.subtitle")}
                </p>
              </div>

              {staffList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t("peer_selection.empty")}</p>
                  <Link
                    href="/evaluations"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    {t("peer_selection.back")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {staffList.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => setSelectedAppraisee(staff.id)}
                      className="w-full p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left flex items-center gap-4"
                    >
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="material-symbols-outlined text-muted-foreground">person</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{staff.name}</p>
                        <p className="text-sm text-muted-foreground">{staff.email}</p>
                      </div>
                      <span className="material-symbols-outlined text-muted-foreground ml-auto">chevron_right</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
        <div className="px-6 md:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/evaluations" className="text-muted-foreground hover:text-primary transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
              <div className="flex flex-col">
                <h2 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                  {t("header.title")}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {evaluationType === "self" ? t("header.self") : t("header.peer")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium border border-green-200 dark:border-green-800">
                <span className="material-symbols-outlined text-[18px]">cloud_done</span>
                <span>{t("header.saved")}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center w-full px-4 md:px-6 py-8">
        <div className="w-full max-w-[800px] flex flex-col gap-6">
          {/* Context Header & Progress */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-end gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{period.name}</h1>
                <p className="text-muted-foreground font-medium">
                  {t("context.target")}:{" "}
                  <span className="text-foreground font-semibold">
                    {evaluationType === "self" ? userName : staffList.find(s => s.id === selectedAppraisee)?.name || ""}
                  </span>
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary text-xs font-bold border border-blue-100 dark:border-blue-800">
                {existingSubmission?.isFinal ? t("context.status_submitted") : t("context.status_draft")}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
              <div className="flex gap-6 justify-between mb-2">
                <p className="text-foreground text-sm font-semibold">
                  {t("context.progress", { current: currentStep + 1, total: totalQuestions })}
                </p>
                <p className="text-muted-foreground text-sm font-medium">
                  {t("context.completed", { percent: Math.round(progress) })}
                </p>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-muted-foreground text-sm">
                  {t("context.answered", { count: answeredCount, total: totalQuestions })}
                </p>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col gap-8">
              {/* Question Text */}
              <div className="space-y-2 text-center md:text-left">
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t("context.progress", { current: currentStep + 1, total: totalQuestions })}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
                  {currentQuestion.text}
                </h2>
                {currentQuestion.isRequired && (
                  <p className="text-sm text-red-500">{t("question.required")}</p>
                )}
              </div>

              <hr className="border-border" />

              {/* Input based on question type */}
              {currentQuestion.type === "SCALE_1_TO_5" && (
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-semibold text-foreground">{t("question.rating_label")}</label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {ratingLabels.map((rating) => (
                      <label key={rating.value} className="relative group cursor-pointer">
                        <input
                          type="radio"
                          name={`rating-${currentQuestion.id}`}
                          value={rating.value}
                          checked={answers[currentQuestion.id]?.score === rating.value}
                          onChange={() => handleAnswerChange(currentQuestion.id, { score: rating.value })}
                          className="peer sr-only"
                        />
                        <div className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-border bg-muted/50 hover:border-primary/50 hover:bg-primary/5 peer-checked:border-primary peer-checked:bg-primary/10 transition-all duration-200 h-full">
                          <span className="text-xl font-bold text-muted-foreground peer-checked:text-primary mb-1">
                            {rating.value}
                          </span>
                          <span className="text-xs text-center text-muted-foreground peer-checked:text-primary font-medium">
                            {rating.label}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.type === "BOOLEAN" && (
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold text-foreground">{t("question.boolean_label")}</label>
                  <div className="flex gap-4">
                    <label className="flex-1 relative cursor-pointer">
                      <input
                        type="radio"
                        name={`bool-${currentQuestion.id}`}
                        checked={answers[currentQuestion.id]?.bool === true}
                        onChange={() => handleAnswerChange(currentQuestion.id, { bool: true })}
                        className="peer sr-only"
                      />
                      <div className="p-4 rounded-lg border-2 border-border bg-muted/50 hover:border-green-500/50 peer-checked:border-green-500 peer-checked:bg-green-50 dark:peer-checked:bg-green-900/20 transition-all text-center">
                        <span className="material-symbols-outlined text-2xl text-green-500 mb-1">check_circle</span>
                        <p className="font-semibold text-foreground">{t("boolean.yes")}</p>
                      </div>
                    </label>
                    <label className="flex-1 relative cursor-pointer">
                      <input
                        type="radio"
                        name={`bool-${currentQuestion.id}`}
                        checked={answers[currentQuestion.id]?.bool === false}
                        onChange={() => handleAnswerChange(currentQuestion.id, { bool: false })}
                        className="peer sr-only"
                      />
                      <div className="p-4 rounded-lg border-2 border-border bg-muted/50 hover:border-red-500/50 peer-checked:border-red-500 peer-checked:bg-red-50 dark:peer-checked:bg-red-900/20 transition-all text-center">
                        <span className="material-symbols-outlined text-2xl text-red-500 mb-1">cancel</span>
                        <p className="font-semibold text-foreground">{t("boolean.no")}</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {currentQuestion.type === "TEXT" && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">{t("question.text_label")}</label>
                  <textarea
                    value={answers[currentQuestion.id]?.text || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, { text: e.target.value })}
                    className="w-full p-4 text-sm text-foreground bg-muted border border-border rounded-lg focus:ring-primary focus:border-primary resize-none"
                    placeholder={t("question.text_placeholder")}
                    rows={5}
                  />
                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      {(answers[currentQuestion.id]?.text || "").length}/500 {t("question.chars")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Navigation */}
            <div className="bg-muted/30 px-6 md:px-8 py-5 border-t border-border flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-border bg-card text-foreground font-semibold text-sm hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">save</span>
                )}
                {t("actions.save_draft")}
              </button>

              <div className="flex w-full sm:w-auto gap-3">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-transparent text-muted-foreground hover:text-foreground font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {t("actions.prev")}
                </button>

                {currentStep < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
                  >
                    {t("actions.next")}
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    )}
                    {t("actions.submit")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hint Section */}
          <div className="flex justify-center mt-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              {t("hint")}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
