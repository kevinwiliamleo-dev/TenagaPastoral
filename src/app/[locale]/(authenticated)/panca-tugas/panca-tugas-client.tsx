"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { createActivity, deleteActivity } from "@/lib/actions/activities"
import { PILLAR_INFO, PastoralPillar } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/ui/empty-state"
import { PillarDetailModal } from "@/components/pillar-detail-modal"


interface Activity {
  id: string
  title: string
  description: string | null
  pillar: PastoralPillar
  date: Date
  duration: number
  location: string | null
}

interface Stats {
  LITURGIA: { count: number; totalDuration: number }
  DIAKONIA: { count: number; totalDuration: number }
  KERYGMA: { count: number; totalDuration: number }
  KOINONIA: { count: number; totalDuration: number }
  MARTYRIA: { count: number; totalDuration: number }
}

interface PancaTugasClientProps {
  stats: Stats
  activities: Activity[]
  userRole: "ADMIN" | "PASTORAL_STAFF"
  userName: string
}

const PILLARS: PastoralPillar[] = ["LITURGIA", "DIAKONIA", "KERYGMA", "KOINONIA", "MARTYRIA"]

export function PancaTugasClient({ stats, activities, userRole, userName }: PancaTugasClientProps) {
  const t = useTranslations("Activities")
  const tCommon = useTranslations("Common")
  const { toast } = useToast()
  
  const [showForm, setShowForm] = useState(false)
  const [selectedPillar, setSelectedPillar] = useState<PastoralPillar | null>(null)
  const [detailPillar, setDetailPillar] = useState<PastoralPillar | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pillar, setPillar] = useState<PastoralPillar>("LITURGIA")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [duration, setDuration] = useState(60)
  const [location, setLocation] = useState("")

  const totalActivities = Object.values(stats).reduce((sum, s) => sum + s.count, 0)
  const totalDuration = Object.values(stats).reduce((sum, s) => sum + s.totalDuration, 0)

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} ${t('minutes')}`
    const hours = Math.floor(mins / 60)
    const remaining = mins % 60
    return remaining > 0 ? `${hours} ${t('hours')} ${remaining} ${t('minutes')}` : `${hours} ${t('hours')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createActivity({
        title,
        description,
        pillar,
        date,
        duration,
        location,
      })

      if (result.success) {
        toast({ title: tCommon("save"), description: result.message })
        setShowForm(false)
        setTitle("")
        setDescription("")
        setLocation("")
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: tCommon("error_generic"), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(tCommon("confirm"))) return
    
    const result = await deleteActivity(id)
    if (result.success) {
      toast({ title: tCommon("delete"), description: result.message })
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" })
    }
  }

  const filteredActivities = selectedPillar 
    ? activities.filter(a => a.pillar === selectedPillar)
    : activities

  return (
    <>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {t("add_activity")}
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{t("total_activities")}</p>
            <p className="text-3xl font-bold text-foreground">{totalActivities}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">{t("total_duration")}</p>
            <p className="text-3xl font-bold text-foreground">{formatDuration(totalDuration)}</p>
          </div>
        </div>

        {/* Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PILLARS.map((p) => {
            const info = PILLAR_INFO[p]
            const stat = stats[p]
            const isSelected = selectedPillar === p
            
            return (
              <div
                key={p}
                className={`bg-card rounded-xl border-2 p-5 text-left transition hover:shadow-md ${
                  isSelected ? "border-primary shadow-md" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`size-12 rounded-lg ${info.color} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white text-2xl">{info.icon}</span>
                  </div>
                  <button
                    onClick={() => setDetailPillar(p)}
                    className="size-8 rounded-full hover:bg-accent flex items-center justify-center transition"
                    title={`Detail ${info.name}`}
                  >
                    <span className="material-symbols-outlined text-muted-foreground text-xl">info</span>
                  </button>
                </div>
                <button
                  onClick={() => setSelectedPillar(isSelected ? null : p)}
                  className="w-full text-left"
                >
                  <h3 className="font-bold text-foreground">{info.name}</h3>
                   {/* Use translated pillar description/name combo */}
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{t(`pillars.${p}`)}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{stat.count}</span>
                    <span className="font-medium text-foreground">{formatDuration(stat.totalDuration)}</span>
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        {/* Activity List */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="font-bold text-foreground">
              {selectedPillar ? t(`pillars.${selectedPillar}`) : t("all_activities")}
            </h2>
            {selectedPillar && (
              <button 
                onClick={() => setSelectedPillar(null)} 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t("show_all")}
              </button>
            )}
          </div>
          
          {filteredActivities.length === 0 ? (
            <EmptyState
              icon="event_note"
              title={t("no_activities")}
              description={t("start_tracking")}
              action={{
                label: t("add_first"),
                onClick: () => setShowForm(true)
              }}
            />
          ) : (
            <div className="divide-y divide-border">
              {filteredActivities.map((activity) => {
                const info = PILLAR_INFO[activity.pillar]
                return (
                  <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition">
                    <div className={`size-10 rounded-lg ${info.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-white">{info.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{activity.title}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>{new Date(activity.date).toLocaleDateString("id-ID")}</span>
                        <span>•</span>
                        <span>{formatDuration(activity.duration)}</span>
                        {activity.location && (
                          <>
                            <span>•</span>
                            <span>{activity.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Activity Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground">{t("add_activity")}</h2>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("form.pillar")}</label>
                  <select
                    value={pillar}
                    onChange={(e) => setPillar(e.target.value as PastoralPillar)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  >
                    {PILLARS.map((p) => (
                      <option key={p} value={p}>
                        {t(`pillars.${p}`)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("form.title")}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    placeholder="Contoh: Misa Harian"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("form.description")}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 min-h-[80px]"
                    placeholder="..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("form.date")}</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">{t("form.duration")}</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2"
                      min={5}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t("form.location")}</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    placeholder="..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 rounded-lg border border-border font-medium hover:bg-muted transition"
                  >
                    {tCommon("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition disabled:opacity-50"
                  >
                     {isSubmitting ? tCommon("loading") : tCommon("save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pillar Detail Modal */}
        {detailPillar && (
          <PillarDetailModal
            pillar={detailPillar}
            stats={stats[detailPillar]}
            onClose={() => setDetailPillar(null)}
          />
        )}
      </div>

    </>
  )
}
