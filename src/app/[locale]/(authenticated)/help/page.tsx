import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getFAQs } from "@/lib/actions/faq"
import { HelpClient } from "./help-client"

export default async function HelpPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const faqs = await getFAQs()

  return (
    <HelpClient 
      faqs={faqs} 
      userRole={session.user.role as "ADMIN" | "PASTORAL_STAFF"}
      userName={session.user.name || "User"} 
    />
  )
}
