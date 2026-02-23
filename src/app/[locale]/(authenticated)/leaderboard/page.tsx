import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getLeaderboard, getMyScore } from "@/lib/actions/scoring"
import { LeaderboardClient } from "./leaderboard-client"

export default async function LeaderboardPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const [leaderboard, myScore] = await Promise.all([
    getLeaderboard(),
    getMyScore()
  ])

  return (
    <LeaderboardClient 
      leaderboard={leaderboard}
      myScore={myScore}
      currentUserId={session.user.id}
      isAdmin={session.user.role === "ADMIN"}
      userName={session.user.name || "Staff"}
    />
  )
}
