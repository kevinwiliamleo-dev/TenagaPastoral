"use client"

import { useState, useRef } from "react"
import { Task, ChecklistItem, updateTaskChecklist, updateTaskStatus } from "@/lib/actions/tasks"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
// Need to install @radix-ui/react-checkbox or use standard input
// Standard input checkbox is fine for now

interface TaskDetailModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void // Trigger revalidation/refresh
}

export function TaskDetailModal({ task, isOpen, onClose, onUpdate }: TaskDetailModalProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklist || [])
  const [newItemText, setNewItemText] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleToggleItem = async (itemId: string, checked: boolean) => {
    const newChecklist = checklist.map(item => 
      item.id === itemId ? { ...item, isCompleted: checked } : item
    )
    setChecklist(newChecklist)
    // Auto save
    await saveData(newChecklist)
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemText.trim()) return

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      isCompleted: false
    }

    const newChecklist = [...checklist, newItem]
    setChecklist(newChecklist)
    setNewItemText("")
    await saveData(newChecklist)
  }

  const handleDeleteItem = async (itemId: string) => {
    const newChecklist = checklist.filter(item => item.id !== itemId)
    setChecklist(newChecklist)
    await saveData(newChecklist)
  }

  const saveData = async (newChecklist: ChecklistItem[]) => {
    setIsSaving(true)
    try {
      await updateTaskChecklist(task.id, newChecklist)
      // Check if all completed, maybe ask to complete task?
      onUpdate()
    } catch (error) {
      console.error("Failed to save checklist", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate progress
  const completedCount = checklist.filter(i => i.isCompleted).length
  const totalCount = checklist.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-between items-start mr-4">
             <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
             <span className={`text-xs px-2 py-1 rounded-full border ${
               task.priority === "HIGH" ? "bg-red-100 text-red-700 border-red-200" :
               task.priority === "MEDIUM" ? "bg-amber-100 text-amber-700 border-amber-200" :
               "bg-slate-100 text-slate-700 border-slate-200"
             }`}>
               {task.priority}
             </span>
          </div>
          <DialogDescription>
            {task.description || "Tidak ada deskripsi"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Progress Bar */}
          <div className="space-y-1">
             <div className="flex justify-between text-xs text-muted-foreground">
               <span>Progress</span>
               <span>{Math.round(progress)}%</span>
             </div>
             <Progress value={progress} className="h-2" />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Checklist</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className={`flex-1 text-sm ${item.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.text}
                  </span>
                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))}
              {checklist.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Belum ada item checklist</p>
              )}
            </div>

            {/* Add Item */}
            <form onSubmit={handleAddItem} className="flex gap-2 mt-2">
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Tambah item..."
                className="h-8 text-sm"
              />
              <Button type="submit" size="sm" variant="outline" className="h-8">
                <span className="material-symbols-outlined text-[16px]">add</span>
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
