import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { EvaluationReportPDF } from "@/components/pdf/evaluation-report"
import { getDetailedReport } from "@/lib/actions/reports"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get parameters from URL
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get("periodId")
    const userId = searchParams.get("userId")

    if (!periodId || !userId) {
      return NextResponse.json(
        { error: "Missing periodId or userId" },
        { status: 400 }
      )
    }

    // Check authorization - only admin or the user themselves can download
    if (session.user?.role !== "ADMIN" && session.user?.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch report data
    const report = await getDetailedReport(periodId, userId)

    // Transform data for PDF
    const pdfData = {
      user: {
        name: report.user.name,
        email: report.user.email,
        role: report.user.role,
      },
      period: {
        name: report.period.name,
        startDate: report.period.startDate,
        endDate: report.period.endDate,
      },
      summary: {
        overallScore: report.summary.overallScore,
        totalEvaluations: report.summary.totalEvaluations,
        totalQuestions: report.summary.totalQuestions,
      },
      questionScores: report.questionScores || [],
      feedback: report.feedback || [],
    }

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      EvaluationReportPDF({ data: pdfData })
    )

    // Create filename
    const sanitizedName = report.user.name.replace(/[^a-zA-Z0-9]/g, "_")
    const sanitizedPeriod = report.period.name.replace(/[^a-zA-Z0-9]/g, "_")
    const filename = `Laporan_Evaluasi_${sanitizedName}_${sanitizedPeriod}.pdf`

    // Return PDF response - convert Buffer to Uint8Array for NextResponse
    const pdfArray = new Uint8Array(pdfBuffer)
    return new NextResponse(pdfArray, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
