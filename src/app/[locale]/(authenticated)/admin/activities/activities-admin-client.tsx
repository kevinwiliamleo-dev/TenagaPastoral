"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllActivities } from "@/lib/actions/activities"
import { PILLAR_INFO, PastoralPillar } from "@/lib/constants"

interface Activity {
  id: string
  title: string
  description: string | null
  pillar: PastoralPillar
  date: Date
  duration: number
  location: string | null
  userId: string
  userName: string | null
  userEmail: string
}

interface Stats {
  LITURGIA: { count: number; totalDuration: number; userCount: number }
  DIAKONIA: { count: number; totalDuration: number; userCount: number }
  KERYGMA: { count: number; totalDuration: number; userCount: number }
  KOINONIA: { count: number; totalDuration: number; userCount: number }
  MARTYRIA: { count: number; totalDuration: number; userCount: number }
}

interface StaffSummary {
  id: string
  name: string
  email: string
  activityCount: number
  totalDuration: number
}

interface ActivitiesAdminClientProps {
  initialActivities: Activity[]
  stats: Stats | null
  staffSummary: StaffSummary[]
  userName: string
}

export function ActivitiesAdminClient({
  initialActivities,
  stats,
  staffSummary,
  userName,
}: ActivitiesAdminClientProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [activities, setActivities] = useState(initialActivities)
  const [loading, setLoading] = useState(false)

  const handleStaffFilter = async (staffId: string) => {
    setSelectedStaffId(staffId)
    setLoading(true)
    try {
      const filtered = await getAllActivities(staffId || undefined)
      setActivities(filtered)
    } catch (error) {
      console.error("Error filtering:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}j ${mins}m`
    }
    return `${mins}m`
  }

  const totalActivities = stats ? Object.values(stats).reduce((a, b) => a + b.count, 0) : 0
  const totalDuration = stats ? Object.values(stats).reduce((a, b) => a + b.totalDuration, 0) : 0

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Aktivitas Staff</h1>
            <p className="text-muted-foreground">Monitor aktivitas Panca Tugas semua Staff Pastoral</p>
          </div>
          
          {/* Staff Filter */}
          <select
            value={selectedStaffId}
            onChange={(e) => handleStaffFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Semua Staff</option>
            {staffSummary.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} ({staff.activityCount} aktivitas)
              </option>
            ))}
          </select>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{totalActivities}</div>
              <p className="text-sm text-muted-foreground">Total Aktivitas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{formatDuration(totalDuration)}</div>
              <p className="text-sm text-muted-foreground">Total Durasi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{staffSummary.length}</div>
              <p className="text-sm text-muted-foreground">Staff Aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">
                {staffSummary.length > 0 ? Math.round(totalActivities / staffSummary.length) : 0}
              </div>
              <p className="text-sm text-muted-foreground">Rata-rata/Staff</p>
            </CardContent>
          </Card>
        </div>

        {/* Pillar Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {(Object.keys(PILLAR_INFO) as PastoralPillar[]).map((pillar) => (
              <Card key={pillar} className={`border-l-4`} style={{ borderLeftColor: PILLAR_INFO[pillar].color }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{PILLAR_INFO[pillar].name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats[pillar].count}</div>
                  <p className="text-xs text-muted-foreground">{formatDuration(stats[pillar].totalDuration)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Staff Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan per Staff</CardTitle>
            <CardDescription>Jumlah aktivitas dan durasi per Staff Pastoral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Staff</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Aktivitas</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Durasi</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {staffSummary.map((staff) => (
                    <tr key={staff.id} className="border-b border-border hover:bg-accent/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{staff.name}</p>
                          <p className="text-sm text-muted-foreground">{staff.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">{staff.activityCount}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{formatDuration(staff.totalDuration)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleStaffFilter(staff.id)}
                          className="text-primary hover:underline text-sm"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedStaffId ? `Aktivitas ${staffSummary.find(s => s.id === selectedStaffId)?.name || 'Staff'}` : 'Semua Aktivitas'}
            </CardTitle>
            <CardDescription>
              {loading ? "Memuat..." : `${activities.length} aktivitas ditemukan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PILLAR_INFO[activity.pillar]?.color || "#888" }}
                      />
                      <div>
                        <p className="font-medium text-foreground">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.userName || activity.userEmail} • {PILLAR_INFO[activity.pillar]?.name || activity.pillar}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(activity.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDuration(activity.duration)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-muted-foreground mb-3">event_busy</span>
                <p className="text-muted-foreground">Belum ada aktivitas tercatat.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
