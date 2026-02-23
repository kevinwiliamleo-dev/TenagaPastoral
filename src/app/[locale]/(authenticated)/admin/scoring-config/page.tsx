import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getScoringConfig } from "@/lib/actions/scoring"
import { ScoringConfigClient } from "@/components/scoring/scoring-config-client"

export default async function ScoringConfigPage() {
  const session = await auth()
  
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const config = await getScoringConfig()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">
          Konfigurasi Scoring
        </h1>
        <p className="text-muted-foreground mt-1">
          Atur bobot komponen untuk perhitungan skor kinerja staff
        </p>
      </div>

      {/* Config Component */}
      <ScoringConfigClient initialConfig={config} />
    </div>
  )
}
