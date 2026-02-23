import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getNotifications, markAllNotificationsAsRead } from "@/lib/actions/notifications"
import { NotificationsClient } from "./notifications-client"

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch notifications
  const notifications = await getNotifications(50) // Get last 50 notifications

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Notifikasi</h1>
        
        <NotificationsClient 
          initialNotifications={notifications} 
          userId={session.user.id}
        />
      </div>
    </>
  )
}
