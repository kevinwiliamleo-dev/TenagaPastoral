import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getGoalsForReview, type Goal } from "@/lib/actions/goals"
import { GoalReviewClient } from "./goal-review-client"

export default async function GoalReviewPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let pendingGoals: Goal[] = []

  try {
    pendingGoals = await getGoalsForReview()
  } catch (error) {
    console.error("Error fetching goals for review:", error)
  }

  return (
    <GoalReviewClient
      initialGoals={pendingGoals}
      adminName={session.user.name || "Admin"}
    />
  )
}
