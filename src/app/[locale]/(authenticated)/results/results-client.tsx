"use client"

import { useState } from "react"
import { useTranslations, useFormatter } from "next-intl"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getMyReport } from "@/lib/actions/reports"
import { CommentThread } from "@/components/feedback/comment-thread"
import type { CommentWithAuthor } from "@/lib/actions/feedback"

interface Period {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: string
}

interface DevelopmentPlan {
  id: string
  periodId: string
  periodName: string
  strengths: string | null
  areasOfImprovement: string | null
  recommendations: string | null
  status: string
  createdAt: Date
  comments: CommentWithAuthor[]
}

// Report structure from getDetailedReport/getMyReport
interface ReportData {
  user: { id: string; name: string; email: string; role: string }
  period: { id: string; name: string; startDate: Date; endDate: Date }
  summary: { overallScore: number; totalEvaluations: number; totalQuestions: number }
  radarData: Array<{ category: string; score: number; fullMark: number }>
  feedback: Array<{ question: string; comment: string; evaluatorName: string; submittedAt: Date }>
  questionScores: Array<{ questionId: string; questionText: string; averageScore: number; totalResponses: number }>
}

interface ResultsClientProps {
  periods: Period[]
  initialReport: ReportData | null
  developmentPlans: DevelopmentPlan[]
  userName: string
  userId: string
}

export function ResultsClient({
  periods,
  initialReport,
  developmentPlans,
  userName,
}: ResultsClientProps) {
  const t = useTranslations("Results")
  const format = useFormatter()
  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0]?.id || "")
  const [report, setReport] = useState<ReportData | null>(initialReport)
  const [loading, setLoading] = useState(false)

  const selectedPlan = developmentPlans.find(p => p.periodId === selectedPeriodId)

  const handlePeriodChange = async (periodId: string) => {
    setSelectedPeriodId(periodId)
    setLoading(true)
    try {
      const newReport = await getMyReport(periodId)
      setReport(newReport as ReportData)
    } catch (error) {
      console.error("Error fetching report:", error)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const getScoreBadge = (score: number) => {
    if (score >= 4.5) return { label: t("badges.excellent"), color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" }
    if (score >= 3.5) return { label: t("badges.good"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" }
    if (score >= 2.5) return { label: t("badges.average"), color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" }
    return { label: t("badges.needs_improvement"), color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" }
  }

  const hasResults = report && report.summary && report.summary.totalEvaluations > 0

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          
          {/* Period Selector */}
          {periods.length > 0 && (
            <select
              value={selectedPeriodId}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {periods.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4">event_busy</span>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("period_selector.empty_title")}</h3>
              <p className="text-muted-foreground">{t("period_selector.empty_desc")}</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t("period_selector.loading")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evaluation Results Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">assessment</span>
                  {t("evaluation_card.title")}
                </CardTitle>
                <CardDescription>
                  {t("evaluation_card.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasResults ? (
                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{t("evaluation_card.average_score")}</p>
                        <p className="text-4xl font-bold text-foreground">{report.summary.overallScore.toFixed(1)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBadge(report.summary.overallScore).color}`}>
                        {getScoreBadge(report.summary.overallScore).label}
                      </span>
                    </div>

                    {/* Category Breakdown (Radar Data) */}
                    {report.radarData && report.radarData.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">{t("evaluation_card.category_score")}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {report.radarData.map((cat) => (
                            <div key={cat.category} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                              <span className="text-sm font-medium text-foreground">{cat.category}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${(cat.score / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-foreground w-10">
                                  {cat.score.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evaluation Count */}
                    <p className="text-sm text-muted-foreground">
                      {t.rich("evaluation_card.total_evaluators", {
                        count: report.summary.totalEvaluations,
                        strong: (chunks) => <strong>{chunks}</strong>
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">rate_review</span>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{t("evaluation_card.empty_title")}</h3>
                    <p className="text-muted-foreground text-sm">{t("evaluation_card.empty_desc")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Development Plan Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600">trending_up</span>
                  {t("development_plan.title")}
                </CardTitle>
                <CardDescription>
                  {t("development_plan.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPlan ? (
                  <div className="space-y-4">
                    {selectedPlan.strengths && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                          {t("development_plan.strengths")}
                        </h4>
                        <p className="text-sm text-foreground bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          {selectedPlan.strengths}
                        </p>
                      </div>
                    )}
                    {selectedPlan.areasOfImprovement && (
                      <div>
                        <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">construction</span>
                          {t("development_plan.areas_of_improvement")}
                        </h4>
                        <p className="text-sm text-foreground bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                          {selectedPlan.areasOfImprovement}
                        </p>
                      </div>
                    )}
                    {selectedPlan.recommendations && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                          {t("development_plan.recommendations")}
                        </h4>
                        <p className="text-sm text-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          {selectedPlan.recommendations}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("development_plan.status_label")}: <span className={`font-medium ${selectedPlan.status === "FINAL" ? "text-green-600" : "text-yellow-600"}`}>
                        {selectedPlan.status === "FINAL" ? t("development_plan.status_final") : t("development_plan.status_draft")}
                      </span>
                    </p>

                    <div className="pt-4 border-t border-border mt-4">
                      <CommentThread 
                        planId={selectedPlan.id}
                        initialComments={selectedPlan.comments}
                        currentUserEmail={report?.user?.email || ""}
                        currentUserRole={report?.user?.role || "PASTORAL_STAFF"}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">psychology</span>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{t("development_plan.empty_title")}</h3>
                    <p className="text-muted-foreground text-sm">{t("development_plan.empty_desc")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-600">history</span>
                  {t("history.title")}
                </CardTitle>
                <CardDescription>
                  {t("history.subtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {developmentPlans.length > 0 ? (
                  <div className="space-y-2">
                    {developmentPlans.slice(0, 5).map((plan) => (
                      <div
                        key={plan.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          plan.periodId === selectedPeriodId
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent/50"
                        }`}
                        onClick={() => handlePeriodChange(plan.periodId)}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{plan.periodName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format.dateTime(new Date(plan.createdAt), {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          plan.status === "FINAL" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" 
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                        }`}>
                          {plan.status === "FINAL" ? t("development_plan.status_final") : t("development_plan.status_draft")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">folder_off</span>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{t("history.empty_title")}</h3>
                    <p className="text-muted-foreground text-sm">{t("history.empty_desc")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

    </>
  )
}
