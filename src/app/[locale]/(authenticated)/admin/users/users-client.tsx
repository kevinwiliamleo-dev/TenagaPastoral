"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ConfirmDeleteModal } from "@/components/ui/modal"
import { UserFormModal } from "@/components/users/user-form-modal"
import { useToast } from "@/components/ui/toast"
import { deleteUser } from "@/lib/actions/user"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  jobTitle?: string | null
  createdAt: Date
}

interface UserStats {
  total: number
  active: number
  pastoral: number
  pendingEvaluations: number
}

interface UsersClientProps {
  initialUsers: User[]
  initialStats: UserStats
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  jobTitles?: { code: string; label: string }[]
}

export function UsersClient({ initialUsers, initialStats, pagination, jobTitles = [] }: UsersClientProps) {
  const router = useRouter()
  const { addToast } = useToast()
  
  const [users] = useState<User[]>(initialUsers)
  const [stats] = useState<UserStats>(initialStats)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Avatars for demo
  const avatars = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCWpv3gCnxGH50Ux3sa6xwaKs-E9-gaq19gGx53C7_M3iFWEEJMUXORrOKXHDf3Ky__3R1vsVtjyJwjjvIMaBQpqM58KFRW65ejGnXt1M4VLSF4lOJPj9xMUGd5fB_Qux9W4m-EZQS_JiamPAl2BytdA_g6EO37NubS_lzk786Djxs2S3K229OXTpkaP_J8kEc09CVHAOJ26qDd_Iq-qJtcP5S1s3eJpLSt9bbbwvXb1LOl4avQ_id8i0vyX3z2vMsvSR7GDVxIeUs",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC8SlzJV74saLoDTjnhN8HmeNPGrIhd5J8Tm3zQFJ8M4HuJrWvcJWZ2GHx6cu9gYGO1cOeI9bbPhYSz41yMPUhDp98kMaKUsFcVExSaY41S1w75kk5_59YQL2CwzP5I5Z9p4zeTQiBB1thnGTHd4V6Us9TNNnvCArgLyHvFhKcsQi3ltBr9UE1GkzSYN0_8g1nIaOncwtvRKiMiiUUBlhO7VldGzhfOPzAt73BTQE2EP5sF62xaHOgGJbcmt19rgaQY2VOUrQTEZLQ",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDcDz0Lbxr0hn6f74EUkff-UComy04pSlHmxP0d-mY_CqRjjY7SfFwpOh-BXUoW6nrJhmYJyAFQcezcgU0_rjOOt1JmG3heu7uGKBbmEdp1h0MJN3cSlvj7Jcddzi2b902I-eJffVphuKmP22vJk-JXm0KrCtxIXWRDlespktw3e60avEDPCSaZVXMbx6pHjvGkBvb2JQOhfXWuOw4tJK7yhQozUESWiHVH7O3Ts20IZ3kZjYkAxsxMS5QYcGeIid6SDnfQ4w0fd1U",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAFVfkP1N1k1L9PTES2-9ecQUZ837K9D6PbtS_tZ0I6lvQlloGv-SWKdGp2f-TkyVXmVdE_afl-g3uc1NiJC10m9sqEGN0hsRa2m5fJHsR-vsDHewLAfubD49ZHxPzfRr5d88GhLPo3adW0XQywRai9WubAfT4ksAwT3EQ7RkM2tfJf3rnQzFwbWeocGeqdXiqjRg_FgZTwHCP42CIv4zjGXQpsMWbBrjZIcxBlSm7OFK1NNBZIOY6_qtDOThQPhVVQYBS4D3g3tgk",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBOSNV2SoOYzzoE3wGB_wq6SZge6NdUsx0e-WfowaUlPJpdzmyXWDeWPGsBv54c5-TRDUhm2c0ZPCXp-Ui1zYPEIpXLmeYP7Kldbg961vLUWHNfwEY1VC182tizOu8aepRdFyRIEv7pUGEarltKBp-WkQzWakt3XzT-YqmpQKgXdZdacbmjYZAN9AYiVZiWepc-JQX68ccIyeH_K39FXYMyShMEF4l78Ov_0pTwi4Jk7BKg5EaP8xVQ-CiSw6OgokodGKj6D2o0Bgk",
  ]

  const handleOpenAddModal = () => {
    setSelectedUser(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user)
    setIsFormModalOpen(true)
  }

  const handleOpenDeleteModal = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    
    setIsDeleting(true)
    try {
      await deleteUser(selectedUser.id)
      addToast({ type: "success", title: "Berhasil", message: "Pengguna berhasil dihapus" })
      setIsDeleteModalOpen(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus pengguna"
      addToast({ type: "error", title: "Gagal", message })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    router.refresh()
  }

  // Filter users by search
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  })

  // Get role label
  const getRoleLabel = (role: string) => {
    return role === "ADMIN" ? "Administrator" : "Staf Pastoral"
  }

  const getJobTitleLabel = (code?: string | null) => {
    if (!code) return null
    return jobTitles.find(jt => jt.code === code)?.label || code
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
        <span className="text-foreground text-sm font-medium leading-normal">Manajemen Pengguna</span>
      </div>

      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-4 -mt-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-muted-foreground text-base font-normal">Kelola data pendeta dan staf untuk evaluasi kinerja pastoral.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground text-sm font-medium hover:bg-accent transition-colors">
            <span className="material-symbols-outlined text-[20px]">file_upload</span>
            Export
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-sky-600 shadow-md shadow-sky-500/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1 p-5 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">Total Pengguna</p>
            <span className="material-symbols-outlined text-primary text-[24px]">group</span>
          </div>
          <p className="text-foreground text-2xl font-bold mt-2">{stats.total}</p>
          <p className="text-green-500 text-xs font-medium flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            +12% bulan ini
          </p>
        </div>

        <div className="flex flex-col gap-1 p-5 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">Pengguna Aktif</p>
            <span className="material-symbols-outlined text-blue-500 text-[24px]">person_check</span>
          </div>
          <p className="text-foreground text-2xl font-bold mt-2">{stats.active}</p>
          <p className="text-muted-foreground text-xs font-medium mt-1">
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% dari total
          </p>
        </div>

        <div className="flex flex-col gap-1 p-5 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">Evaluasi Pending</p>
            <span className="material-symbols-outlined text-amber-500 text-[24px]">pending_actions</span>
          </div>
          <p className="text-foreground text-2xl font-bold mt-2">{stats.pendingEvaluations}</p>
          <p className="text-amber-500 text-xs font-medium flex items-center gap-1 mt-1">
            Perlu tindakan segera
          </p>
        </div>

        <div className="flex flex-col gap-1 p-5 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">Staf Pastoral</p>
            <span className="material-symbols-outlined text-purple-500 text-[24px]">person_pin</span>
          </div>
          <p className="text-foreground text-2xl font-bold mt-2">{stats.pastoral}</p>
          <p className="text-muted-foreground text-xs font-medium mt-1">
            Staf pastoral aktif
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Table Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input 
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground" 
              placeholder="Cari pengguna..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Lengkap</th>
                <th className="hidden sm:table-cell px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-accent/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="size-8 rounded-full bg-muted bg-cover bg-center"
                        style={{ backgroundImage: `url('${avatars[index % avatars.length]}')` }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{user.name || "Unnamed"}</span>
                        {user.jobTitle && (
                          <span className="text-xs text-muted-foreground">{getJobTitleLabel(user.jobTitle)}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "ADMIN" 
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEditModal(user)}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteModal(user)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Hapus"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-muted-foreground">search_off</span>
                      <p className="text-muted-foreground">Tidak ada pengguna ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Menampilkan {filteredUsers.length} dari {pagination.total} data
          </p>
          <div className="flex gap-2">
            <button 
              className="px-3 py-1 rounded border border-border text-muted-foreground text-sm hover:bg-accent disabled:opacity-50"
              disabled={pagination.page <= 1}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                className={`px-3 py-1 rounded text-sm ${
                  page === pagination.page 
                    ? "bg-primary text-primary-foreground" 
                    : "border border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              className="px-3 py-1 rounded border border-border text-muted-foreground text-sm hover:bg-accent disabled:opacity-50"
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Footer Spacer */}
      <div className="h-10"></div>

      {/* Modals */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        user={selectedUser}
        onSuccess={handleFormSuccess}
        jobTitles={jobTitles}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={selectedUser?.name || selectedUser?.email}
        isLoading={isDeleting}
      />
    </>
  )
}
