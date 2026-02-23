"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { DashboardLayoutData, DEFAULT_LAYOUT, DashboardWidgetId } from "@/components/dashboard/dashboard-layout-types"

export async function getDashboardLayout(): Promise<DashboardWidgetId[]> {
  const session = await auth()
  if (!session?.user?.id) return DEFAULT_LAYOUT

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: { dashboardLayout: true } as any
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userWithLayout = user as any;
    
    if (userWithLayout?.dashboardLayout) {
       // Prisma Json type needs casting
       const layout = userWithLayout.dashboardLayout as unknown as DashboardLayoutData
       if (layout && Array.isArray(layout.items)) {
         return layout.items
       }
    }
  } catch (error) {
    console.error("Error fetching dashboard layout:", error)
  }

  return DEFAULT_LAYOUT
}

export async function saveDashboardLayout(items: DashboardWidgetId[]) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: "Unauthorized" }

  try {
    const layoutData: DashboardLayoutData = { items }
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dashboardLayout: layoutData as any 
      }
    })

    revalidatePath("/dashboard")
    return { success: true, message: "Layout saved" }
  } catch (error) {
    console.error("Error saving dashboard layout:", error)
    return { success: false, message: "Failed to save layout" }
  }
}

export async function resetDashboardLayout() {
  const session = await auth()
  if (!session?.user?.id) return { success: false, message: "Unauthorized" }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dashboardLayout: null as any
      }
    })

    revalidatePath("/dashboard")
    return { success: true, message: "Layout reset to default" }
  } catch (error) {
    console.error("Error resetting dashboard layout:", error)
    return { success: false, message: "Failed to reset layout" }
  }
}
