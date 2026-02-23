import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { MasterDataClient } from "./master-data-client"
import { getAllMasterData } from "@/lib/actions/master-data"

export default async function MasterDataPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Only admin
  if (session.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch all data
  const masterData = await getAllMasterData()

  return (
    <MasterDataClient initialData={masterData} />
  )
}
