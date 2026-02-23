import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PeriodsClient } from "./periods-client"
import { getPeriods } from "@/lib/actions/period"

export default async function PeriodsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch initial data
  let periods: Awaited<ReturnType<typeof getPeriods>> = []

  try {
    periods = await getPeriods()
  } catch (error) {
    console.error("Failed to fetch periods:", error)
  }

  return (
    <PeriodsClient initialPeriods={periods} />
  )
}
