import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAllActivities, getAllActivityStats, getStaffActivitySummary } from "@/lib/actions/activities"
import { ActivitiesAdminClient } from "./activities-admin-client"

export default async function AdminActivitiesPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  let activities: Awaited<ReturnType<typeof getAllActivities>> = []
  let stats: Awaited<ReturnType<typeof getAllActivityStats>> | null = null
  let staffSummary: Awaited<ReturnType<typeof getStaffActivitySummary>> = []

  try {
    [activities, stats, staffSummary] = await Promise.all([
      getAllActivities(),
      getAllActivityStats(),
      getStaffActivitySummary()
    ])
  } catch (error) {
    console.error("Error fetching activities data:", error)
  }

  return (
    <ActivitiesAdminClient
      initialActivities={activities}
      stats={stats}
      staffSummary={staffSummary}
      userName={session.user?.name || "Admin"}
    />
  )
}
