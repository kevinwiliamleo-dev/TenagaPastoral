"use client"

import { useState } from "react"
import Link from "next/link"

import { getStaffReportSummary, getReportStats } from "@/lib/actions/reports"
import { useToast } from "@/hooks/use-toast"
import { EmptyReports, EmptySearch } from "@/components/ui/empty-state"

interface Period {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: string
}

interface StaffReport {
  userId: string
  userName: string
  userEmail: string
  averageScore: number
  totalEvaluations: number
  status: "completed" | "pending" | "not_started"
}

interface Stats {
  totalStaff: number
  completed: number
  pending: number
  notStarted: number
  averageScore: number
}

interface ReportsClientProps {
  periods: Period[]
  initialStaffReports: StaffReport[]
  initialStats: Stats
  userRole: "ADMIN" | "PASTORAL_STAFF"
  userId: string
  userName: string
}

export function ReportsClient({
  periods,
  initialStaffReports,
  initialStats,
  userRole,
  userId,
  userName,
}: ReportsClientProps) {
  const { toast } = useToast()
  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0]?.id || "")
  const [staffReports, setStaffReports] = useState(initialStaffReports)
  const [stats, setStats] = useState(initialStats)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handlePeriodChange = async (periodId: string) => {
    setSelectedPeriodId(periodId)
    setIsLoading(true)

    try {
      const [newReports, newStats] = await Promise.all([
        getStaffReportSummary(periodId),
        getReportStats(periodId),
      ])
      setStaffReports(newReports)
      setStats(newStats)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data laporan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredReports = staffReports.filter((report) =>
    report.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getScoreBadge = (score: number) => {
    if (score >= 4.5) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          {score} (Excellent)
        </span>
      )
    } else if (score >= 3.5) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {score} (Good)
        </span>
      )
    } else if (score >= 2.5) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          {score} (Average)
        </span>
      )
    } else if (score > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          {score} (Needs Improvement)
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
        N/A
      </span>
    )
  }

  const getStatusBadge = (status: StaffReport["status"]) => {
    switch (status) {
      case "completed":
        return (
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <span className="size-2 rounded-full bg-green-500"></span>
            Selesai
          </div>
        )
      case "pending":
        return (
          <div className="flex items-center gap-1.5 text-sm text-foreground">
            <span className="size-2 rounded-full bg-orange-500"></span>
            Pending
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-gray-400"></span>
            Belum Mulai
          </div>
        )
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Staff view - show only their own results
  if (userRole === "PASTORAL_STAFF") {
    return (
      <>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Hasil Evaluasi Saya</h1>
            <p className="text-muted-foreground text-sm">
              Lihat hasil evaluasi kinerja Anda per periode
            </p>
          </div>

          {/* Period Selection */}
          {periods.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Pilih Periode</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {periods.map((period) => (
                    <Link
                      key={period.id}
                      href={`/reports/${period.id}`}
                      className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all"
                    >
                      <h3 className="font-semibold text-foreground">{period.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </p>
                      <div className="mt-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          period.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}>
                          {period.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyReports />
          )}
        </div>
      </>
    )
  }

  // Admin view
  return (
    <>
      <div className="p-6 lg:p-8">
        {/* Page Heading */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Laporan Hasil Evaluasi</h1>
          <p className="text-muted-foreground text-sm">
            Tinjau kinerja staf dan hasil evaluasi pastoral secara keseluruhan.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Staf</p>
            <p className="text-3xl font-bold text-foreground mt-2">{stats.totalStaff}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Selesai</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Pending</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pending}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Rata-rata Skor</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-foreground">{stats.averageScore}</span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-border mb-6">
          <div className="flex flex-1 flex-wrap gap-4 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                placeholder="Cari nama staf..."
              />
            </div>

            {/* Period Dropdown */}
            <div className="relative w-full sm:w-64">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <span className="material-symbols-outlined">calendar_today</span>
              </span>
              <select
                value={selectedPeriodId}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full h-12 pl-12 pr-10 appearance-none rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer transition"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <span className="material-symbols-outlined">expand_more</span>
              </span>
            </div>
          </div>

          {/* Export Button */}
          <button className="h-12 px-6 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition shadow-sm w-full lg:w-auto">
            <span className="material-symbols-outlined">download</span>
            <span>Export Data</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
              <p className="mt-4 text-muted-foreground">Memuat data...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            searchQuery ? (
              <EmptySearch query={searchQuery} />
            ) : (
              <EmptyReports />
            )
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Nama Staf
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Total Evaluasi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Rata-rata Skor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReports.map((report) => (
                  <tr key={report.userId} className="group hover:bg-accent/50 transition cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="material-symbols-outlined text-muted-foreground">person</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{report.userName}</p>
                          <p className="text-xs text-muted-foreground">{report.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {report.totalEvaluations} evaluasi
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getScoreBadge(report.averageScore)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/reports/${selectedPeriodId}/${report.userId}`}
                        className="text-primary hover:text-primary/80 font-semibold flex items-center justify-end gap-1 ml-auto"
                      >
                        Detail
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination info */}
        {filteredReports.length > 0 && (
          <div className="flex justify-between items-center px-2 mt-4">
            <p className="text-sm text-muted-foreground">
              Menampilkan {filteredReports.length} dari {staffReports.length} staf
            </p>
          </div>
        )}
      </div>
    </>
  )
}
