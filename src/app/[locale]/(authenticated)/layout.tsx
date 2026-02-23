import { AppLayout } from "@/components/layout"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <AppLayout
      userName={session.user?.name || session.user?.email || "User"}
      userRole={session.user?.role}
      userImage={session.user?.image || undefined}
    >
      {children}
    </AppLayout>
  )
}
