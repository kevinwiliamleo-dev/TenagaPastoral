import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getActivePeriodsForEvaluation, getMyEvaluations } from "@/lib/actions/evaluation"
import { EvaluationsClient } from "./evaluations-client"

export default async function EvaluationsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Get active periods and user's evaluations
  let periods: Awaited<ReturnType<typeof getActivePeriodsForEvaluation>> = []
  let myEvaluations: Awaited<ReturnType<typeof getMyEvaluations>> = []

  try {
    periods = await getActivePeriodsForEvaluation()
  } catch (error) {
    console.error("Error fetching periods:", error)
  }

  try {
    myEvaluations = await getMyEvaluations()
  } catch (error) {
    console.error("Error fetching evaluations:", error)
  }

  return (
    <EvaluationsClient 
      periods={periods} 
      myEvaluations={myEvaluations}
      userId={session.user?.id || ""}
      userRole={session.user?.role as "ADMIN" | "PASTORAL_STAFF" || "PASTORAL_STAFF"}
      userName={session.user?.name || "User"}
    />
  )
}
