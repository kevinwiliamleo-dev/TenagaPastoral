import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getPeriodsForReports, getStaffReportSummary, getReportStats } from "@/lib/actions/reports"
import { ReportsClient } from "./reports-client"

export default async function ReportsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Get periods
  let periods: Awaited<ReturnType<typeof getPeriodsForReports>> = []
  let staffReports: Awaited<ReturnType<typeof getStaffReportSummary>> = []
  let stats = { totalStaff: 0, completed: 0, pending: 0, notStarted: 0, averageScore: 0 }

  try {
    periods = await getPeriodsForReports()
    
    // Get data for the first (most recent) period
    if (periods.length > 0 && session.user?.role === "ADMIN") {
      staffReports = await getStaffReportSummary(periods[0].id)
      stats = await getReportStats(periods[0].id)
    }
  } catch (error) {
    console.error("Error fetching reports data:", error)
  }

  return (
    <ReportsClient
      periods={periods}
      initialStaffReports={staffReports}
      initialStats={stats}
      userRole={session.user?.role as "ADMIN" | "PASTORAL_STAFF" || "PASTORAL_STAFF"}
      userId={session.user?.id || ""}
      userName={session.user?.name || "User"}
    />
  )
}
