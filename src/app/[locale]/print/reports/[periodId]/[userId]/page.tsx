import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getDetailedReport } from "@/lib/actions/reports"
import { PrintReportClient } from "./print-report-client"

interface PageProps {
  params: Promise<{
    periodId: string
    userId: string
  }>
}

export default async function PrintReportPage({ params }: PageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Only ADMIN can view all reports
  if (session.user.role !== "ADMIN") {
    const resolvedParams = await params
    // Staff can only view their own report
    if (session.user.id !== resolvedParams.userId) {
      redirect("/dashboard")
    }
  }

  const resolvedParams = await params
  const report = await getDetailedReport(resolvedParams.periodId, resolvedParams.userId)

  if (!report) {
    notFound()
  }

  return <PrintReportClient report={report} />
}
