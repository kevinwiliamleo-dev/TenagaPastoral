import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getMyReport } from "@/lib/actions/reports"
import { getStaffScoreTrend } from "@/lib/actions/analytics"
import { DetailedReportClient } from "./[userId]/detailed-report-client"

interface PageProps {
  params: Promise<{ periodId: string }>
}

export default async function MyReportPage({ params }: PageProps) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const { periodId } = await params

  try {
    const [report, trendData] = await Promise.all([
      getMyReport(periodId),
      session.user?.id ? getStaffScoreTrend(session.user.id) : Promise.resolve([])
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
