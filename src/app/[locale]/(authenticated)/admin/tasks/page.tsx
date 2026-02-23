import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAllTasks, getAllTaskStats, getStaffTaskSummary } from "@/lib/actions/tasks"
import { getUsers } from "@/lib/actions/user"
import { TasksAdminClient } from "./tasks-admin-client"

export default async function AdminTasksPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  let tasks: Awaited<ReturnType<typeof getAllTasks>> = []
  let stats: Awaited<ReturnType<typeof getAllTaskStats>> | null = null
  let staffSummary: Awaited<ReturnType<typeof getStaffTaskSummary>> = []
  let staffList: { id: string; name: string; email: string }[] = []

  try {
    const [tasksData, statsData, summaryData, usersData] = await Promise.all([
      getAllTasks(),
      getAllTaskStats(),
      getStaffTaskSummary(),
      getUsers()
    ])
    tasks = tasksData
    stats = statsData
    staffSummary = summaryData
    staffList = usersData.users
      .filter((u: { role: string }) => u.role === "PASTORAL_STAFF")
      .map((u: { id: string; name: string | null; email: string }) => ({ 
        id: u.id, 
        name: u.name || u.email, 
        email: u.email 
      }))
  } catch (error) {
    console.error("Error fetching tasks data:", error)
  }

  return (
    <TasksAdminClient
      initialTasks={tasks}
      stats={stats}
      staffSummary={staffSummary}
      staffList={staffList}
      userName={session.user?.name || "Admin"}
    />
  )
}
