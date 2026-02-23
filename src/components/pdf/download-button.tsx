"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { EvaluationReportPDF, type ReportData } from "./evaluation-report"

interface DownloadPDFButtonProps {
  report: ReportData
  className?: string
}

export function DownloadPDFButton({ report, className }: DownloadPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    try {
      setIsGenerating(true)

      // Ensure dates are proper Date objects (they may come as strings from server)
      const processedReport = {
        ...report,
        period: {
          ...report.period,
          startDate: new Date(report.period.startDate),
          endDate: new Date(report.period.endDate),
        }
      }

      // Generate PDF blob on the client
      const blob = await pdf(<EvaluationReportPDF data={processedReport} />).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      
      // Create filename
      const sanitizedName = report.user.name.replace(/[^a-zA-Z0-9]/g, "_")
      const sanitizedPeriod = report.period.name.replace(/[^a-zA-Z0-9]/g, "_")
      const filename = `Laporan_Evaluasi_${sanitizedName}_${sanitizedPeriod}.pdf`
      
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Gagal generate PDF. Silakan coba lagi.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={className || "flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition shadow-sm disabled:opacity-50"}
    >
      {isGenerating ? (
        <>
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span>Generating...</span>
        </>
      ) : (
        <>
          <span className="material-symbols-outlined">download</span>
          <span>Download PDF</span>
        </>
      )}
    </button>
  )
}
