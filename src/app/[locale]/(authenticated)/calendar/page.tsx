// import { AppLayout } from "@/components/layout" - Removed, handled by parent layout
import { CalendarClient } from "@/components/calendar/calendar-client"
import { getCalendarEvents } from "@/lib/actions/calendar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Kalender Kegiatan | Sistem KPI",
  description: "Kalender visual untuk jadwal evaluasi dan tugas"
}

export default async function CalendarPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const events = await getCalendarEvents()

  return (
    <CalendarClient initialEvents={events} />
  )
}
