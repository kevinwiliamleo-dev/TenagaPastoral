import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getPeriodsForReports, getMyReport } from "@/lib/actions/reports"
import { ResultsClient } from "./results-client"
import prisma from "@/lib/prisma"
import { CommentWithAuthor } from "@/lib/actions/feedback"

export default async function ResultsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Get all periods with closed or active status for viewing results
  let periods: Awaited<ReturnType<typeof getPeriodsForReports>> = []
  let myReport: Awaited<ReturnType<typeof getMyReport>> | null = null
// ...

  let developmentPlans: Array<{
    id: string
    periodId: string
    periodName: string
    strengths: string | null
    areasOfImprovement: string | null
    recommendations: string | null
    status: string
    createdAt: Date
    comments: CommentWithAuthor[]
  }> = []

  try {
    periods = await getPeriodsForReports()
    
    // Get report for the most recent period
    if (periods.length > 0 && session.user?.id) {
      myReport = await getMyReport(periods[0].id)
      
      // Get all development plans for this user
      const plans = await prisma.developmentPlan.findMany({
        where: { userId: session.user.id },
        include: { 
          period: { select: { name: true } },
          comments: {
            include: {
              author: { select: { id: true, name: true, email: true, role: true } }
            },
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { createdAt: "desc" }
      })
      
      developmentPlans = plans.map(p => ({
        id: p.id,
        periodId: p.periodId,
        periodName: p.period.name,
        strengths: p.strengths,
        areasOfImprovement: p.areasOfImprovement,
        recommendations: p.recommendations,
        status: p.status,
        createdAt: p.createdAt,
        comments: p.comments.map(c => ({
          ...c,
          createdAt: c.createdAt // Ensure date type is preserved or handled
        }))
      }))
    }
  } catch (error) {
    console.error("Error fetching results data:", error)
  }

  return (
    <ResultsClient
      periods={periods}
      initialReport={myReport}
      developmentPlans={developmentPlans}
      userName={session.user?.name || "Staff"}
      userId={session.user?.id || ""}
    />
  )
}
