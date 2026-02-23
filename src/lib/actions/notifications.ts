"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { NotificationType } from "@prisma/client"

// Types
interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  linkUrl?: string
  linkText?: string
}

// Combined fetch to minimize database connections
export async function getNotificationData(limit = 10) {
  const session = await auth()
  if (!session?.user?.id) {
    return { notifications: [], unreadCount: 0 }
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })
  ])

  return { notifications, unreadCount }
}

// Get notifications for current user
export async function getNotifications(limit = 10) {
  const session = await auth()
// ... existing getNotifications implementation can stay for backward compatibility or be removed if unused elsewhere
// but for cleaner code I will keep the new one above and let the old ones exist 
// effectively I am REPLACING the old separate exports with the new combined one being the primary
// actually, I will just add the new function.

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return notifications
}

// Get unread notification count
export async function getUnreadNotificationCount() {
  const session = await auth()
  if (!session?.user?.id) {
    return 0
  }

  const count = await prisma.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  })

  return count
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
  })

  if (!notification) {
    throw new Error("Notification not found")
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })

  return { success: true }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })

  return { success: true }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
  })

  if (!notification) {
    throw new Error("Notification not found")
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  })

  return { success: true }
}

// Create notification (for internal use / admin)
export async function createNotification(input: CreateNotificationInput) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Only admin can create notifications for others
  if (session.user.role !== "ADMIN" && input.userId !== session.user.id) {
    throw new Error("Forbidden")
  }

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl,
      linkText: input.linkText,
    },
  })

  return notification
}

// Create notification for multiple users (admin only)
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationInput, "userId">
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }

  const notifications = await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      linkUrl: notification.linkUrl,
      linkText: notification.linkText,
    })),
  })

  return { count: notifications.count }
}

// Helper: Create task reminder notification
export async function createTaskReminder(
  userId: string,
  taskId: string,
  taskTitle: string,
  daysUntilDue: number
) {
  let title: string
  let type: NotificationType
  
  if (daysUntilDue < 0) {
    title = "Tugas Terlambat"
    type = "TASK_OVERDUE"
  } else if (daysUntilDue === 0) {
    title = "Deadline Hari Ini"
    type = "TASK_DUE_SOON"
  } else {
    title = `Deadline dalam ${daysUntilDue} hari`
    type = "TASK_DUE_SOON"
  }

  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message: `Tugas "${taskTitle}" ${daysUntilDue < 0 ? 'sudah melewati deadline' : 'mendekati deadline'}. Segera selesaikan tugas Anda.`,
      linkUrl: `/tasks`,
      linkText: "Lihat Tugas",
    },
  })
}

// Helper: Create evaluation reminder notification
export async function createEvaluationReminder(
  userId: string,
  periodName: string,
  daysUntilEnd: number
) {
  return prisma.notification.create({
    data: {
      userId,
      type: "EVALUATION_REMINDER",
      title: "Pengingat Evaluasi",
      message: `Periode evaluasi "${periodName}" akan berakhir dalam ${daysUntilEnd} hari. Pastikan Anda sudah melengkapi semua evaluasi.`,
      linkUrl: `/evaluations`,
      linkText: "Lihat Evaluasi",
    },
  })
}
