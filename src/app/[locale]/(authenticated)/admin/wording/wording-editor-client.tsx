"use client"

import { useState, useMemo, useTransition } from "react"
import { updateWording, resetWording, bulkUpdateWordings, resetAllWordings } from "@/lib/actions/wording"

type WordingItem = {
  key: string
  defaultValue: string
  customValue: string | null
  description: string | null
}

export function WordingEditorClient({
  items,
  locale,
}: {
  items: WordingItem[]
  locale: string
}) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "modified" | "default">("all")
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Group by top-level key (e.g., "Sidebar", "Dashboard", "Common")
  const groups = useMemo(() => {
    const map: Record<string, WordingItem[]> = {}
    for (const item of items) {
      const group = item.key.split(".")[0]
      if (!map[group]) map[group] = []
      map[group].push(item)
    }
    return map
  }, [items])

  // Filter and search
  const filteredGroups = useMemo(() => {
    const result: Record<string, WordingItem[]> = {}
    for (const [group, groupItems] of Object.entries(groups)) {
      const filtered = groupItems.filter((item) => {
        const matchesSearch =
          search === "" ||
          item.key.toLowerCase().includes(search.toLowerCase()) ||
          item.defaultValue.toLowerCase().includes(search.toLowerCase()) ||
          (item.customValue && item.customValue.toLowerCase().includes(search.toLowerCase()))

        const matchesFilter =
          filter === "all" ||
          (filter === "modified" && item.customValue !== null) ||
          (filter === "default" && item.customValue === null)

        return matchesSearch && matchesFilter
      })
      if (filtered.length > 0) result[group] = filtered
    }
    return result
  }, [groups, search, filter])

  const totalModified = items.filter((i) => i.customValue !== null).length
  const totalItems = items.length

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = (key: string) => {
    const value = editedValues[key]
    if (value === undefined) return

    startTransition(async () => {
      const result = await updateWording(key, value, locale)
      if (result.success) {
        showToast(`"${key}" berhasil disimpan`, "success")
        // Clear from edited
        setEditedValues((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      } else {
        showToast(`Gagal menyimpan: ${result.error}`, "error")
      }
    })
  }

  const handleReset = (key: string) => {
    startTransition(async () => {
      const result = await resetWording(key, locale)
      if (result.success) {
        showToast(`"${key}" dikembalikan ke default`, "success")
        setEditedValues((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      } else {
        showToast(`Gagal reset: ${result.error}`, "error")
      }
    })
  }

  const handleSaveAll = () => {
    const updates = Object.entries(editedValues).map(([key, value]) => ({ key, value }))
    if (updates.length === 0) {
      showToast("Tidak ada perubahan untuk disimpan", "error")
      return
    }

    startTransition(async () => {
      const result = await bulkUpdateWordings(updates, locale)
      if (result.success) {
        showToast(`${result.count} teks berhasil disimpan`, "success")
        setEditedValues({})
      } else {
        showToast(`Gagal menyimpan: ${result.error}`, "error")
      }
    })
  }

  const handleResetAll = () => {
    if (!confirm("Yakin ingin mengembalikan SEMUA teks ke default? Semua perubahan custom akan hilang.")) return

    startTransition(async () => {
      const result = await resetAllWordings(locale)
      if (result.success) {
        showToast(`${result.count} teks direset ke default`, "success")
        setEditedValues({})
      } else {
        showToast(`Gagal reset: ${result.error}`, "error")
      }
    })
  }

  const pendingEditsCount = Object.keys(editedValues).length

  // Icon map for groups
  const groupIcons: Record<string, string> = {
    Common: "widgets",
    Sidebar: "menu",
    Dashboard: "dashboard",
    Tasks: "task_alt",
    Activities: "directions_run",
    Evaluations: "grading",
    Results: "analytics",
    Help: "help",
    Performance: "speed",
    Calendar: "calendar_month",
    Reports: "summarize",
    Goals: "flag",
    Profile: "person",
    Leaderboard: "leaderboard",
    Users: "group",
    Periods: "date_range",
    Questions: "quiz",
    Analytics: "monitoring",
    Notifications: "notifications",
    Auth: "lock",
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Stats & Actions Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
          <span className="material-symbols-outlined text-lg text-muted-foreground">translate</span>
          <span><strong>{totalItems}</strong> total teks</span>
          {totalModified > 0 && (
            <span className="text-amber-500 font-medium">• {totalModified} custom</span>
          )}
        </div>

        {pendingEditsCount > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            Simpan Semua ({pendingEditsCount})
          </button>
        )}

        {totalModified > 0 && (
          <button
            onClick={handleResetAll}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">restart_alt</span>
            Reset Semua ke Default
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari teks... (misal: dashboard, evaluasi, simpan)"
            className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["all", "modified", "default"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Semua" : f === "modified" ? "Custom" : "Default"}
            </button>
          ))}
        </div>
      </div>

      {/* Groups */}
      {Object.entries(filteredGroups).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">
            search_off
          </span>
          <p>Tidak ditemukan teks yang cocok.</p>
        </div>
      ) : (
        Object.entries(filteredGroups).map(([group, groupItems]) => (
          <div
            key={group}
            className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
          >
            {/* Group Header */}
            <div className="px-5 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">
                {groupIcons[group] || "folder"}
              </span>
              <h3 className="font-semibold text-sm">{group}</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {groupItems.length} item
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-border">
              {groupItems.map((item) => {
                const isEdited = editedValues[item.key] !== undefined
                const hasCustom = item.customValue !== null
                const displayValue = isEdited
                  ? editedValues[item.key]
                  : item.customValue ?? item.defaultValue

                return (
                  <div
                    key={item.key}
                    className={`px-5 py-3 flex items-start gap-4 transition-colors ${
                      isEdited ? "bg-amber-500/5" : hasCustom ? "bg-blue-500/5" : ""
                    }`}
                  >
                    {/* Key label */}
                    <div className="w-1/3 min-w-[200px] flex-shrink-0 pt-2">
                      <span className="text-xs font-mono text-muted-foreground break-all">
                        {item.key}
                      </span>
                      {hasCustom && !isEdited && (
                        <div className="mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">
                            CUSTOM
                          </span>
                        </div>
                      )}
                      {isEdited && (
                        <div className="mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                            BELUM DISIMPAN
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={displayValue}
                        onChange={(e) =>
                          setEditedValues((prev) => ({
                            ...prev,
                            [item.key]: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          hasCustom && !isEdited
                            ? "border-blue-300 dark:border-blue-800"
                            : isEdited
                            ? "border-amber-300 dark:border-amber-800"
                            : "border-border"
                        }`}
                      />
                      {(hasCustom || isEdited) && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Default: <span className="italic">{item.defaultValue}</span>
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pt-1 flex-shrink-0">
                      {isEdited && (
                        <button
                          onClick={() => handleSave(item.key)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                          title="Simpan"
                        >
                          <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                      )}
                      {(hasCustom || isEdited) && (
                        <button
                          onClick={() => {
                            if (isEdited) {
                              // Just discard local edit
                              setEditedValues((prev) => {
                                const next = { ...prev }
                                delete next[item.key]
                                return next
                              })
                            } else {
                              // Reset DB override
                              handleReset(item.key)
                            }
                          }}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title={isEdited ? "Batal" : "Reset ke Default"}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {isEdited ? "close" : "restart_alt"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
