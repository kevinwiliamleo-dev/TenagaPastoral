"use client"

import { useState } from "react"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from "@dnd-kit/core"
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable"
import { DashboardWidgetId, DEFAULT_LAYOUT } from "./dashboard-layout-types"
import { SortableItem } from "./sortable-item"
import { saveDashboardLayout, resetDashboardLayout } from "@/lib/actions/dashboard-layout"
import { useRouter } from "next/navigation"

interface DashboardGridProps {
  layout: DashboardWidgetId[]
  widgets: Record<DashboardWidgetId, React.ReactNode>
  role: "ADMIN" | "PASTORAL_STAFF"
}

export function DashboardGrid({ layout, widgets, role }: DashboardGridProps) {
  const [items, setItems] = useState(layout)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as DashboardWidgetId)
        const newIndex = items.indexOf(over!.id as DashboardWidgetId)
        
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    await saveDashboardLayout(items)
    setIsSaving(false)
    setIsEditing(false)
    router.refresh()
  }

  const handleReset = async () => {
    if (!confirm("Kembalikan layout ke pengaturan awal?")) return
    setIsSaving(true)
    await resetDashboardLayout()
    setItems(DEFAULT_LAYOUT) // Optimistic update to default
    setIsSaving(false)
    router.refresh()
  }

  // Filter out widgets that are null (e.g. charts if not admin)
  const activeItems = items.filter(id => widgets[id] !== null && widgets[id] !== undefined)

  return (
    <div className="space-y-4">
      {/* Edit Controls */}
      <div className="flex justify-end gap-2 mb-2">
        {isEditing ? (
          <>
            <button 
              onClick={handleReset}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Reset Default
            </button>
            <button 
              onClick={() => {
                setItems(layout) // Cancel changes
                setIsEditing(false)
              }}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {isSaving ? "Menyimpan..." : "Simpan Susunan"}
            </button>
          </>
        ) : (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">edit_note</span>
            Atur Layout
          </button>
        )}
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={activeItems} 
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {activeItems.map((id) => (
              <SortableItem key={id} id={id} isEditing={isEditing}>
                <div className={isEditing ? "pointer-events-none select-none" : ""}>
                   {widgets[id]}
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
