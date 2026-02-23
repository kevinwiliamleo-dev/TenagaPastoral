import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getMyTasks, getTaskStats } from "@/lib/actions/tasks"
import { TasksClient } from "./tasks-client"

export default async function TasksPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const [tasks, stats] = await Promise.all([
    getMyTasks(),
    getTaskStats(),
  ])

  return (
    <TasksClient 
      tasks={tasks} 
      stats={stats}
      userRole={session.user.role as "ADMIN" | "PASTORAL_STAFF"}
      userName={session.user.name || "User"} 
    />
  )
}
