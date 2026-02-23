"use client"

import Link from "next/link"
import Image from "next/image"
import { RadarChart } from "@/components/ui/charts"

interface DetailedReport {
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
  questionScores: Array<{
    questionId: string
    questionText: string
    questionType: string
    averageScore: number
    totalResponses: number
  }>
  feedback: Array<{
    question: string
    comment: string
    evaluatorName: string
    submittedAt: Date
  }>
  radarData?: Array<{
    category: string
    score: number
    fullMark: number
  }>
}

interface PrintReportClientProps {
  report: DetailedReport
}

export function PrintReportClient({ report }: PrintReportClientProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const todayDate = formatDate(new Date())

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return { label: "SANGAT BAIK", color: "bg-emerald-600" }
    if (score >= 3.5) return { label: "BAIK", color: "bg-sky-600" }
    if (score >= 2.5) return { label: "CUKUP", color: "bg-amber-600" }
    return { label: "PERLU PERBAIKAN", color: "bg-red-600" }
  }

  const scoreInfo = getScoreLabel(report.summary.overallScore)

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Action Bar - No Print */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[210mm] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/reports/${report.period.id}/${report.user.id}`}
              className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-sm font-medium">Kembali</span>
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Pratinjau Laporan PDF</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              <span>Print</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Preview Area */}
      <main className="py-8 px-4 print:p-0">
        {/* A4 Paper */}
        <div className="a4-page p-12 flex flex-col text-slate-900">
          {/* Report Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 mb-2">
                <Image 
                  src="/logo.png" 
                  alt="Logo" 
                  width={40} 
                  height={40}
                  className="print:block"
                />
                <span className="text-xl font-bold uppercase tracking-wider">Pusat Pastoral Keuskupan Surabaya</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 leading-none">Laporan Evaluasi</h1>
              <p className="text-lg text-slate-600 font-medium">Kinerja Tenaga Pastoral</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">CONFIDENTIAL</div>
              <div className="text-sm text-slate-600">Generated on</div>
              <div className="font-mono font-bold">{todayDate}</div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-10 text-sm">
            <div className="flex flex-col border-l-4 border-slate-200 pl-3">
              <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Nama Lengkap</span>
              <span className="text-slate-900 font-bold text-lg">{report.user.name || report.user.email}</span>
            </div>
            <div className="flex flex-col border-l-4 border-slate-200 pl-3">
              <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Jabatan / Role</span>
              <span className="text-slate-900 font-bold text-lg">
                {report.user.role === "ADMIN" ? "Administrator" : "Tenaga Pastoral"}
              </span>
            </div>
            <div className="flex flex-col border-l-4 border-slate-200 pl-3">
              <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Periode Evaluasi</span>
              <span className="text-slate-900 font-medium text-base">{report.period.name}</span>
            </div>
            <div className="flex flex-col border-l-4 border-slate-200 pl-3">
              <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Jumlah Evaluator</span>
              <span className="text-slate-900 font-medium text-base">{report.summary.totalEvaluations} orang</span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="grid grid-cols-12 gap-8 mb-10">
            {/* Score Card */}
            <div className="col-span-4 bg-slate-50 border border-slate-200 rounded p-6 flex flex-col items-center justify-center text-center">
              <span className="text-slate-500 font-medium mb-2 uppercase text-xs tracking-wider">Nilai Keseluruhan</span>
              <div className="text-6xl font-black text-slate-900 mb-2">{report.summary.overallScore.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 text-slate-400 mb-2">
                <span className="text-xs">OUT OF 5.0</span>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white ${scoreInfo.color}`}>
                {scoreInfo.label}
              </span>
            </div>

            {/* Score Breakdown & Radar */}
            <div className="col-span-8 flex flex-col gap-6">
              {report.radarData && (
                <div className="flex justify-center -mt-4">
                  <RadarChart 
                    data={report.radarData} 
                    dataKey="score" 
                    gridKey="category" 
                    height={250} 
                  />
                </div>
              )}
              
              <div>
                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 text-sm uppercase tracking-wide">
                  Ringkasan Skor per Indikator
                </h3>
              <div className="flex flex-col gap-3">
                {report.questionScores.slice(0, 5).map((q, idx) => (
                  <div key={q.questionId} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="truncate max-w-[250px]">{idx + 1}. {q.questionText}</span>
                      <span>{q.averageScore.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className="bg-slate-800 h-1.5 rounded-full" 
                        style={{ width: `${(q.averageScore / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

          {/* Detailed Table */}
          <div className="mb-8">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">list_alt</span>
              Rincian Penilaian
            </h3>
            <div className="overflow-hidden border border-slate-200 rounded-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-bold w-16 text-center" scope="col">No</th>
                    <th className="px-4 py-3 font-bold" scope="col">Indikator Penilaian</th>
                    <th className="px-4 py-3 font-bold w-24 text-center" scope="col">Responden</th>
                    <th className="px-4 py-3 font-bold w-24 text-center" scope="col">Nilai</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {report.questionScores.map((q, idx) => (
                    <tr key={q.questionId}>
                      <td className="px-4 py-3 font-mono text-center text-slate-500">
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{q.questionText}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{q.totalResponses}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">{q.averageScore.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comments Section */}
          {report.feedback.some(f => f.comment) && (
            <div className="mb-12 flex-1">
              <h3 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">comment</span>
                Catatan &amp; Komentar Evaluator
              </h3>
              <div className="border border-slate-300 rounded-sm p-5 bg-slate-50/50 text-slate-700 text-sm leading-relaxed min-h-[100px]">
                {report.feedback
                  .filter(f => f.comment)
                  .map((f, idx) => (
                    <p key={idx} className="mb-2 last:mb-0">
                      <span className="font-medium">{f.evaluatorName}:</span> {f.comment}
                    </p>
                  ))}
              </div>
            </div>
          )}

          {/* Footer & Signatures */}
          <div className="mt-auto pt-8 border-t border-slate-200">
            <div className="flex justify-around items-end mb-8">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-16 uppercase tracking-wider">Mengetahui, Administrator</p>
                <div className="border-b border-slate-900 pb-1 font-bold text-slate-900 px-8">
                  _______________________
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-16 uppercase tracking-wider">Yang Dinilai</p>
                <div className="border-b border-slate-900 pb-1 font-bold text-slate-900 px-8">
                  {report.user.name || report.user.email}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Pastoral Evaluation System v1.0</span>
              <span>Halaman 1 dari 1</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
