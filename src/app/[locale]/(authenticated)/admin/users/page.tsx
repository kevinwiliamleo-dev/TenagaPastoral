import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { UsersClient } from "./users-client"
import { getUsers, getUserStats } from "@/lib/actions/user"
import { getMasterDataByType } from "@/lib/actions/master-data"

export default async function UsersPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Only admin can access this page
  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch initial data
  let users: Awaited<ReturnType<typeof getUsers>>["users"] = []
  let stats = { total: 0, active: 0, pastoral: 0, pendingEvaluations: 0 }
  let pagination = { total: 0, page: 1, limit: 10, totalPages: 0 }
  const jobTitles = await getMasterDataByType("JOB_TITLE")

  try {
    const usersData = await getUsers({ page: 1, limit: 10 })
    users = usersData.users
    pagination = usersData.pagination
    stats = await getUserStats()
  } catch (error) {
    // If database is not yet migrated, use empty/mock data
    console.error("Failed to fetch users:", error)
  }

  return (
      <UsersClient 
        initialUsers={users}
        initialStats={stats}
        pagination={pagination}
        jobTitles={jobTitles}
      />
  )
}
