"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ConfirmDeleteModal } from "@/components/ui/modal"
import { PeriodFormModal } from "@/components/periods/period-form-modal"
import { useToast } from "@/components/ui/toast"
import { deletePeriod, activatePeriod, closePeriod } from "@/lib/actions/period"

interface Period {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: string
  questionsCount: number
  submissionsCount: number
  completedCount: number
}

interface PeriodsClientProps {
  initialPeriods: Period[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20">
          <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
          ACTIVE
        </span>
      )
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
          <span className="size-1.5 rounded-full bg-muted-foreground"></span>
          DRAFT
        </span>
      )
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
          <span className="material-symbols-outlined text-[14px] font-bold">lock</span>
          CLOSED
        </span>
      )
    default:
      return null
  }
}

function formatDateRange(startDate: Date, endDate: Date) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
  return `${start.toLocaleDateString("id-ID", options)} - ${end.toLocaleDateString("id-ID", options)}`
}

export function PeriodsClient({ initialPeriods }: PeriodsClientProps) {
  const router = useRouter()
  const { addToast } = useToast()
  
  const [periods] = useState<Period[]>(initialPeriods)
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  const handleOpenAddModal = () => {
    setSelectedPeriod(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (period: Period) => {
    setSelectedPeriod(period)
    setIsFormModalOpen(true)
  }

  const handleOpenDeleteModal = (period: Period) => {
    setSelectedPeriod(period)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedPeriod) return
    
    setIsDeleting(true)
    try {
      await deletePeriod(selectedPeriod.id)
      addToast({ type: "success", title: "Berhasil", message: "Periode berhasil dihapus" })
      setIsDeleteModalOpen(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus periode"
      addToast({ type: "error", title: "Gagal", message })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleActivate = async (period: Period) => {
    setIsProcessing(period.id)
    try {
      await activatePeriod(period.id)
      addToast({ type: "success", title: "Berhasil", message: `Periode "${period.name}" berhasil diaktifkan` })
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengaktifkan periode"
      addToast({ type: "error", title: "Gagal", message })
    } finally {
      setIsProcessing(null)
    }
  }

  const handleClose = async (period: Period) => {
    setIsProcessing(period.id)
    try {
      await closePeriod(period.id)
      addToast({ type: "success", title: "Berhasil", message: `Periode "${period.name}" berhasil ditutup` })
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menutup periode"
      addToast({ type: "error", title: "Gagal", message })
    } finally {
      setIsProcessing(null)
    }
  }

  const handleFormSuccess = () => {
    router.refresh()
  }

  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 items-center -mt-4 mb-2">
        <Link href="/dashboard" className="text-muted-foreground hover:text-primary text-sm font-medium leading-normal flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">home</span>
          Beranda
        </Link>
        <span className="text-muted-foreground text-sm font-medium leading-normal">/</span>
        <span className="text-foreground text-sm font-medium leading-normal">Manajemen Periode</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 -mt-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Manajemen Periode Evaluasi</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola siklus penilaian kinerja pastoral Anda.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="group flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Buat Periode Baru</span>
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {periods.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-card rounded-xl border border-border">
            <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4">calendar_month</span>
            <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Periode</h3>
            <p className="text-muted-foreground text-sm mb-4">Buat periode evaluasi pertama Anda</p>
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Buat Periode Baru
            </button>
          </div>
        ) : (
          periods.map((period) => {
            const progressPercent = period.submissionsCount > 0 
              ? Math.round((period.completedCount / period.submissionsCount) * 100) 
              : 0
            const isClosed = period.status === "CLOSED"
            const isDraft = period.status === "DRAFT"
            const isActive = period.status === "ACTIVE"
            const isProcessingThis = isProcessing === period.id

            return (
              <article 
                key={period.id}
                className={`flex flex-col bg-card rounded-lg shadow-sm border border-border overflow-hidden group hover:border-primary/50 transition-colors ${isClosed ? 'opacity-90 hover:opacity-100' : ''}`}
              >
                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Status Badge & Menu */}
                  <div className="flex justify-between items-start">
                    {getStatusBadge(period.status)}
                    <button 
                      onClick={() => handleOpenDeleteModal(period)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                      title="Hapus"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>

                  {/* Title & Date */}
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-2 leading-tight">{period.name}</h2>
                    <div className="flex items-center text-muted-foreground text-sm gap-2">
                      <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                      <span className="font-medium">{formatDateRange(period.startDate, period.endDate)}</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-muted p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        <span className="material-symbols-outlined text-[16px]">quiz</span>
                        Soal
                      </div>
                      <p className="text-base font-bold text-foreground">{period.questionsCount} Items</p>
                    </div>
                    <div className={`bg-muted p-3 rounded-lg border border-border ${isDraft ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        <span className="material-symbols-outlined text-[16px]">inbox</span>
                        Progress
                      </div>
                      <div className="flex justify-between items-end mb-1">
                        <p className="text-base font-bold text-foreground">{period.completedCount}/{period.submissionsCount || 0}</p>
                        <span className={`text-xs font-bold ${progressPercent === 100 ? 'text-green-600 dark:text-green-400' : progressPercent > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${progressPercent === 100 ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="px-5 py-4 border-t border-border bg-muted/50 flex items-center justify-between gap-2">
                  <button 
                    onClick={() => handleOpenEditModal(period)}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${isClosed ? 'text-muted-foreground cursor-not-allowed' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                    disabled={isClosed}
                    title={isClosed ? "Cannot Edit Closed Period" : "Edit Period"}
                  >
                    <span className="material-symbols-outlined text-[20px]">{isClosed ? 'edit_off' : 'edit'}</span>
                  </button>
                  <div className="flex gap-2">
                    {isClosed ? (
                      <Link 
                        href={`/admin/reports?periodId=${period.id}`}
                        className="px-3 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                      >
                        Lihat Laporan
                      </Link>
                    ) : (
                      <Link 
                        href={`/admin/periods/${period.id}/questions`}
                        className="px-3 py-2 rounded-lg text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                      >
                        {isDraft ? 'Setup Pertanyaan' : 'Kelola Pertanyaan'}
                      </Link>
                    )}
                    
                    {isDraft && (
                      <button
                        onClick={() => handleActivate(period)}
                        disabled={isProcessingThis || period.questionsCount === 0}
                        className="px-3 py-2 rounded-lg text-sm font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title={period.questionsCount === 0 ? "Tambahkan pertanyaan terlebih dahulu" : "Aktifkan periode"}
                      >
                        {isProcessingThis ? "..." : "Aktifkan"}
                      </button>
                    )}
                    
                    {isActive && (
                      <button 
                        onClick={() => handleClose(period)}
                        disabled={isProcessingThis}
                        className="px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground border border-border hover:border-red-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-card transition-all disabled:opacity-50"
                      >
                        {isProcessingThis ? "..." : "Tutup Periode"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Footer Spacer */}
      <div className="h-10"></div>

      {/* Modals */}
      <PeriodFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        period={selectedPeriod}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={selectedPeriod?.name}
        message="Apakah Anda yakin ingin menghapus periode ini? Semua data pertanyaan akan ikut terhapus."
        isLoading={isDeleting}
      />
    </>
  )
}
