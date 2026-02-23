"use client"

import Link from "next/link"

import { DownloadPDFButton } from "@/components/pdf/download-button"
import { TrendChart } from "@/components/charts/trend-chart"
import type { ReportData } from "@/components/pdf/evaluation-report"

interface Report {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  period: {
    id: string
    name: string
    startDate: Date
    endDate: Date
  }
  summary: {
    overallScore: number
    totalEvaluations: number
    totalQuestions: number
  }
  questionScores?: {
    questionId: string
    questionText: string
    averageScore: number
    totalResponses: number
    questionType: string
  }[]
  radarData?: {
    category: string
    score: number
    fullMark: number
  }[]
  feedback: {
    question: string
    comment: string
    evaluatorName: string
    submittedAt: Date
  }[]
}


interface DetailedReportClientProps {
  report: Report
  trendData: { period: string; score: number }[]
  userRole: "ADMIN" | "PASTORAL_STAFF"
  userName: string
}

export function DetailedReportClient({ report, trendData, userRole, userName }: DetailedReportClientProps) {
  const getScoreGrade = (score: number) => {
    if (score >= 4.5) return { label: "Excellent", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" }
    if (score >= 3.5) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" }
    if (score >= 2.5) return { label: "Average", color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" }
    if (score > 0) return { label: "Needs Improvement", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" }
    return { label: "N/A", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30" }
  }

  const grade = getScoreGrade(report.summary.overallScore)
  const scorePercent = (report.summary.overallScore / 5) * 100

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <>
      <div className="p-6 lg:p-8">
        {/* Back Button */}
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="text-sm font-medium">Kembali ke Laporan</span>
        </Link>

        {/* Report Container */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-5">
              <div className="size-16 md:size-20 rounded-full bg-muted flex items-center justify-center border-2 border-card shadow-md">
                <span className="material-symbols-outlined text-4xl text-muted-foreground">person</span>
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-foreground">{report.user.name}</h2>
                <div className="flex flex-wrap gap-2 text-muted-foreground items-center text-sm font-medium mt-1">
                  <span>{report.user.email}</span>
                  <span className="size-1 rounded-full bg-border"></span>
                  <span className="text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                    {report.period.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link 
                href={`/print/reports/${report.period.id}/${report.user.id}`}
                target="_blank"
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-foreground font-bold hover:bg-accent transition"
              >
                <span className="material-symbols-outlined text-[20px]">print</span>
                <span className="hidden sm:inline">Print</span>
              </Link>
              <DownloadPDFButton 
                report={{
                  user: report.user,
                  period: report.period,
                  summary: report.summary,
                  questionScores: report.questionScores,
                  feedback: report.feedback.map(f => ({ question: f.question, comment: f.comment })),
                }} 
              />
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column: Visualizations */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Score Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Overall Score */}
                <div className="bg-muted/50 rounded-xl p-5 flex flex-col gap-1 border border-transparent hover:border-border transition">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Overall Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-foreground">{report.summary.overallScore}</span>
                    <span className="text-sm text-muted-foreground">/ 5.0</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${scorePercent}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs ${grade.color} mt-2 font-medium`}>
                    {grade.label}
                  </p>
                </div>

                {/* Total Evaluations */}
                <div className="bg-muted/50 rounded-xl p-5 flex flex-col gap-1 border border-transparent hover:border-border transition">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Evaluasi</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-foreground">{report.summary.totalEvaluations}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-auto">
                    Evaluasi diterima
                  </p>
                </div>

                {/* Questions Answered */}
                <div className="bg-muted/50 rounded-xl p-5 flex flex-col gap-1 border border-transparent hover:border-border transition">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Jawaban</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-foreground">{report.summary.totalQuestions}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-auto">
                    Pertanyaan dinilai
                  </p>
                </div>
              </div>

              {/* Period Info */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Informasi Periode</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Periode</p>
                    <p className="font-semibold text-foreground">{report.period.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rentang Waktu</p>
                    <p className="font-semibold text-foreground">
                      {formatDate(report.period.startDate)} - {formatDate(report.period.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Score Trend Chart */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Trend Performa</h3>
                <div className="w-full">
                  <TrendChart data={trendData} />
                </div>
              </div>
            </div>

            {/* Right Column: Feedback */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Umpan Balik</h3>
              </div>

              {report.feedback.length === 0 ? (
                <div className="bg-muted/50 rounded-xl p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-muted-foreground mb-2">chat_bubble</span>
                  <p className="text-sm text-muted-foreground">
                    Belum ada umpan balik tertulis
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2">
                  {report.feedback.map((fb, index) => (
                    <div
                      key={index}
                      className="bg-muted/50 rounded-lg p-4 border border-border"
                    >
                      <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
                        {fb.question}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        &quot;{fb.comment}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
