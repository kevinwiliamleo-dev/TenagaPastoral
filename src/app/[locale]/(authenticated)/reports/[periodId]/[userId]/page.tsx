import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getDetailedReport } from "@/lib/actions/reports"
import { getStaffScoreTrend } from "@/lib/actions/analytics"
import { DetailedReportClient } from "./detailed-report-client"

interface PageProps {
  params: Promise<{ periodId: string; userId: string }>
}

export default async function DetailedReportPage({ params }: PageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { periodId, userId } = await params

  try {
    const [report, trendData] = await Promise.all([
      getDetailedReport(periodId, userId),
      getStaffScoreTrend(userId)
    ])
    
    return (
      <DetailedReportClient
        report={report}
        trendData={trendData}
        userRole={session.user?.role as "ADMIN" | "PASTORAL_STAFF" || "PASTORAL_STAFF"}
        userName={session.user?.name || "User"}
      />
    )
  } catch (error) {
    console.error("Error fetching report:", error)
    notFound()
  }
}
