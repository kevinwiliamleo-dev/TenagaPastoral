"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { createPeriod, updatePeriod, type CreatePeriodInput, type UpdatePeriodInput } from "@/lib/actions/period"

interface PeriodFormModalProps {
  isOpen: boolean
  onClose: () => void
  period?: {
    id: string
    name: string
    startDate: Date
    endDate: Date
    status: string
  } | null
  onSuccess?: () => void
}

export function PeriodFormModal({ isOpen, onClose, period, onSuccess }: PeriodFormModalProps) {
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!period
  const isDisabled = period?.status === "CLOSED"

  const formatDate = (date: Date) => {
    return new Date(date).toISOString().split("T")[0]
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      if (isEditing) {
        const data: UpdatePeriodInput = {
          id: period.id,
          name: formData.get("name") as string,
          startDate: formData.get("startDate") as string,
          endDate: formData.get("endDate") as string,
        }
        await updatePeriod(data)
        addToast({ type: "success", title: "Berhasil", message: "Periode berhasil diperbarui" })
      } else {
        const data: CreatePeriodInput = {
          name: formData.get("name") as string,
          startDate: formData.get("startDate") as string,
          endDate: formData.get("endDate") as string,
        }
        await createPeriod(data)
        addToast({ type: "success", title: "Berhasil", message: "Periode baru berhasil ditambahkan" })
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan"
      addToast({ type: "error", title: "Gagal", message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Periode" : "Buat Periode Baru"}
      description={isEditing ? "Perbarui informasi periode evaluasi" : "Isi informasi untuk periode evaluasi baru"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {isDisabled && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[20px]">warning</span>
            <p className="text-amber-700 dark:text-amber-400 text-sm font-medium">
              Periode yang sudah ditutup tidak dapat diubah
            </p>
          </div>
        )}

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="name">
            Nama Periode <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            disabled={isDisabled}
            defaultValue={period?.name || ""}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm disabled:opacity-50"
            placeholder="cth: Evaluasi Semester I 2024"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="startDate">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">calendar_today</span>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                disabled={isDisabled}
                defaultValue={period ? formatDate(period.startDate) : ""}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="endDate">
              Tanggal Selesai <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">event</span>
              <input
                id="endDate"
                name="endDate"
                type="date"
                required
                disabled={isDisabled}
                defaultValue={period ? formatDate(period.endDate) : ""}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isDisabled ? "Tutup" : "Batal"}
          </button>
          {!isDisabled && (
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">{isEditing ? "save" : "add"}</span>
                  <span>{isEditing ? "Simpan Perubahan" : "Buat Periode"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
