import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getActivityStats, getMyActivities } from "@/lib/actions/activities"
import { PancaTugasClient } from "./panca-tugas-client"

export default async function PancaTugasPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const [stats, activities] = await Promise.all([
    getActivityStats(),
    getMyActivities(),
  ])

  return (
    <PancaTugasClient 
      stats={stats} 
      activities={activities} 
      userRole={session.user.role as "ADMIN" | "PASTORAL_STAFF"}
      userName={session.user.name || "User"} 
    />
  )
}
