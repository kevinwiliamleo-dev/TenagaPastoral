"use client"

import { useState, useRef, useEffect } from "react"
import { createComment, deleteComment, type CommentWithAuthor } from "@/lib/actions/feedback"
import { useRouter } from "next/navigation"

interface CommentThreadProps {
  planId: string
  initialComments: CommentWithAuthor[]
  currentUserEmail: string
  currentUserRole: string
}

export function CommentThread({ planId, initialComments, currentUserEmail, currentUserRole }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    
    // Optimistic update could go here but let's stick to safe server action
    const result = await createComment(planId, content)
    
    if (result.success && result.comment) {
      setContent("")
      // Add the new comment locally (it has the author included from server action)
      setComments(prev => [...prev, result.comment as any]) // Type casting bit loose here but fine for now
      router.refresh()
    } else {
      alert(result.error || "Failed to post comment")
    }
    
    setIsSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("Hapus komentar ini?")) return

    const result = await deleteComment(commentId)
    if (result.success) {
      setComments(prev => prev.filter(c => c.id !== commentId))
      router.refresh()
    } else {
      alert("Gagal menghapus komentar")
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <span className="material-symbols-outlined">forum</span>
        Diskusi & Feedback
      </h3>

      {/* Comment List */}
      <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
            Belum ada diskusi. Mulai percakapan sekarang.
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                {comment.author.name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 bg-muted/40 rounded-lg p-3 border border-border/50">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-foreground">
                    {comment.author.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                    {(comment.author.email === currentUserEmail || currentUserRole === "ADMIN") && (
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3 items-start bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
          <span className="material-symbols-outlined text-[20px]">person</span>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis tanggapan atau feedback..."
            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm min-h-[60px] resize-none placeholder:text-muted-foreground"
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Markdown supported</span>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">send</span>
              )}
              Kirim
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
