import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getProfile } from "@/lib/actions/profile"
import { ProfileClient } from "./profile-client"

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  const profile = await getProfile()

  return <ProfileClient profile={profile} />
}
