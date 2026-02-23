"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MasterData, createMasterData, updateMasterData, deleteMasterData, MasterDataType } from "@/lib/actions/master-data"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toast"
import Link from "next/link"

interface MasterDataClientProps {
  initialData: MasterData[]
}

export function MasterDataClient({ initialData }: MasterDataClientProps) {
  const router = useRouter()
  const { addToast } = useToast()
  
  const [activeTab, setActiveTab] = useState<MasterDataType>("JOB_TITLE")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MasterData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const filteredData = initialData.filter(d => d.type === activeTab)
  
  const tabs: { id: MasterDataType; label: string; icon: string }[] = [
    { id: "JOB_TITLE", label: "Jabatan (Job Titles)", icon: "badge" },
    { id: "FAQ_CATEGORY", label: "Kategori FAQ", icon: "category" },
  ]

  const handleCreate = async (formData: FormData) => {
    setIsLoading(true)
    const label = formData.get("label") as string
    const code = formData.get("code") as string || label.toUpperCase().replace(/\s+/g, '_')
    const order = Number(formData.get("order") || 0)

    try {
      const result = await createMasterData({
        type: activeTab,
        code,
        label,
        order
      })

      if (result.success) {
        addToast({ type: "success", title: "Berhasil", message: result.message })
        setIsModalOpen(false)
        router.refresh()
      } else {
        addToast({ type: "error", title: "Gagal", message: result.message || "Terjadi kesalahan" })
      }
    } catch (error) {
      addToast({ type: "error", title: "Error", message: "Terjadi kesalahan sistem" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (formData: FormData) => {
    if (!editingItem) return
    setIsLoading(true)
    const label = formData.get("label") as string
    const order = Number(formData.get("order") || 0)
    const isActive = formData.get("status") === "active"

    try {
      const result = await updateMasterData(editingItem.id, {
        label,
        order,
        isActive
      })

      if (result.success) {
        addToast({ type: "success", title: "Berhasil", message: result.message })
        setIsModalOpen(false)
        setEditingItem(null)
        router.refresh()
      } else {
        addToast({ type: "error", title: "Gagal", message: result.message })
      }
    } catch (error) {
      addToast({ type: "error", title: "Error", message: "Terjadi kesalahan sistem" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return
    setIsDeleting(id)
    try {
      const result = await deleteMasterData(id)
      if (result.success) {
        addToast({ type: "success", title: "Berhasil", message: result.message })
        router.refresh()
      } else {
        addToast({ type: "error", title: "Gagal", message: result.message })
      }
    } catch (error) {
      addToast({ type: "error", title: "Error", message: "Gagal menghapus data" })
    } finally {
      setIsDeleting(null)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const openEditModal = (item: MasterData) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
           <div className="flex flex-wrap gap-2 items-center -mt-4 mb-2">
             <Link href="/dashboard" className="text-muted-foreground hover:text-primary text-sm font-medium leading-normal flex items-center gap-1">
               <span className="material-symbols-outlined text-[18px]">home</span>
               Beranda
             </Link>
             <span className="text-muted-foreground text-sm font-medium leading-normal">/</span>
             <span className="text-foreground text-sm font-medium leading-normal">Master Data</span>
           </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-foreground text-3xl font-bold tracking-tight">Master Data Management</h1>
              <p className="text-muted-foreground">Kelola data referensi dinamis untuk aplikasi.</p>
            </div>
            <button 
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Tambah Item
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table/List */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-3 min-w-[50px]">Order</th>
                  <th className="px-6 py-3 min-w-[150px]">Kode</th>
                  <th className="px-6 py-3 w-full">Label/Nama</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Belum ada data untuk kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-accent/50 group">
                      <td className="px-6 py-3 font-mono text-muted-foreground">{item.order}</td>
                      <td className="px-6 py-3 font-mono font-medium">{item.code}</td>
                      <td className="px-6 py-3 font-medium text-foreground">{item.label}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.isActive 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditModal(item)}
                            className="p-1 text-muted-foreground hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            disabled={isDeleting === item.id}
                            className="p-1 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Hapus"
                          >
                            {isDeleting === item.id ? (
                               <span className="animate-spin material-symbols-outlined text-[18px]">refresh</span>
                            ) : (
                               <span className="material-symbols-outlined text-[18px]">delete</span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Item" : "Tambah Item Baru"}
        description={editingItem ? `Edit data ${editingItem.label}` : `Tambahkan data baru ke ${activeTab}`}
      >
        <form action={editingItem ? handleUpdate : handleCreate} className="flex flex-col gap-4">
          {!editingItem && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Kode (Opsional, Auto-generated)</label>
              <input 
                name="code" 
                placeholder="Contoh: BENDAHARA (Kosongkan utk auto)" 
                className="px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm"
              />
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Label / Nama <span className="text-red-500">*</span></label>
            <input 
              name="label" 
              required
              defaultValue={editingItem?.label}
              placeholder="Contoh: Bendahara Paroki" 
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Urutan (Order)</label>
              <input 
                name="order" 
                type="number"
                defaultValue={editingItem?.order || 0}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 ring-primary/20"
              />
            </div>
            {editingItem && (
               <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  name="status"
                  defaultValue={editingItem?.isActive ? "active" : "inactive"}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg flex items-center gap-2"
            >
              {isLoading && <span className="animate-spin material-symbols-outlined text-[16px]">refresh</span>}
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
