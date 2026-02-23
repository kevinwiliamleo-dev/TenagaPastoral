"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import { createUser, updateUser, type CreateUserInput, type UpdateUserInput } from "@/lib/actions/user"

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  user?: {
    id: string
    email: string
    name: string | null
    role: string
    jobTitle?: string | null
  } | null
  onSuccess?: () => void
  jobTitles?: { code: string; label: string }[]
}

export function UserFormModal({ isOpen, onClose, user, onSuccess, jobTitles = [] }: UserFormModalProps) {
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!user

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)

    try {
      if (isEditing) {
        const data: UpdateUserInput = {
          id: user.id,
          email: formData.get("email") as string,
          name: formData.get("name") as string,
          role: formData.get("role") as "ADMIN" | "PASTORAL_STAFF",
          jobTitle: formData.get("jobTitle") as string,
        }
        await updateUser(data)
        addToast({ type: "success", title: "Berhasil", message: "Data pengguna berhasil diperbarui" })
      } else {
        const data: CreateUserInput = {
          email: formData.get("email") as string,
          name: formData.get("name") as string,
          password: formData.get("password") as string,
          role: formData.get("role") as "ADMIN" | "PASTORAL_STAFF",
          jobTitle: formData.get("jobTitle") as string,
        }
        await createUser(data)
        addToast({ type: "success", title: "Berhasil", message: "Pengguna baru berhasil ditambahkan" })
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
      title={isEditing ? "Edit Pengguna" : "Tambah Pengguna Baru"}
      description={isEditing ? "Perbarui informasi pengguna" : "Isi informasi untuk pengguna baru"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="name">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={user?.name || ""}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            placeholder="Masukkan nama lengkap"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground" htmlFor="email">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">mail</span>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={user?.email || ""}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              placeholder="email@gereja.org"
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Password (only for new users) */}
        {!isEditing && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="password">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">lock</span>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="Minimal 6 karakter"
              />
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>
        )}

        {/* Role & Job Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="role">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              name="role"
              required
              defaultValue={user?.role || "PASTORAL_STAFF"}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            >
              <option value="PASTORAL_STAFF">Staf Pastoral</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="jobTitle">
              Jabatan
            </label>
            <select
              id="jobTitle"
              name="jobTitle"
              defaultValue={user?.jobTitle || ""}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            >
              <option value="">- Pilih Jabatan -</option>
              {jobTitles.map((jt) => (
                <option key={jt.code} value={jt.code}>
                  {jt.label}
                </option>
              ))}
            </select>
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
            Batal
          </button>
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
                <span>{isEditing ? "Simpan Perubahan" : "Tambah Pengguna"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
