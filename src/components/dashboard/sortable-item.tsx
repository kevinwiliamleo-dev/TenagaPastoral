"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface SortableItemProps {
  id: string
  children: React.ReactNode
  isEditing?: boolean
}

export function SortableItem({ id, children, isEditing = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 5 : 1,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    touchAction: 'none' // Prevent scrolling while dragging on touch devices
  }

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      {isEditing && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 right-2 p-2 bg-background/80 hover:bg-background backdrop-blur rounded-lg cursor-grab active:cursor-grabbing border border-border shadow-sm z-10 transition-colors"
          title="Drag to reorder"
        >
           <span className="material-symbols-outlined text-muted-foreground">drag_indicator</span>
        </div>
      )}
      {children}
    </div>
  )
}
