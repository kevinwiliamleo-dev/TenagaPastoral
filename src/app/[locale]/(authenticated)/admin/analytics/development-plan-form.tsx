"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { saveDevelopmentPlan } from "@/lib/actions/development-plan"
import { CommentThread } from "@/components/feedback/comment-thread"
import type { CommentWithAuthor } from "@/lib/actions/feedback"

interface DevelopmentPlanFormProps {
  userId: string
  periodId: string
  initialData?: {
    id: string
    strengths: string | null
    areasOfImprovement: string | null
    recommendations: string | null
    status: string
    comments: CommentWithAuthor[]
  } | null
  currentUserEmail: string
  currentUserRole: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <div className="flex justify-end gap-3 mt-4">
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Recommendation"}
      </button>
    </div>
  )
}

export function DevelopmentPlanForm({ 
  userId, 
  periodId, 
  initialData, 
  currentUserEmail, 
  currentUserRole 
}: DevelopmentPlanFormProps) {
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  async function clientAction(formData: FormData) {
    const result = await saveDevelopmentPlan(formData)
    if (result.success) {
      setMessage({ type: "success", text: result.message })
      // Hide message after 3s
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ type: "error", text: result.message })
    }
  }

  return (
    <>
    <form action={clientAction} className="space-y-6">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="periodId" value={periodId} />
      
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Strengths */}
      <div>
        <label htmlFor="strengths" className="block text-sm font-medium text-slate-700 mb-2">
          Kekuatan / Hal Positif
        </label>
        <textarea
          id="strengths"
          name="strengths"
          rows={4}
          defaultValue={initialData?.strengths || ""}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          placeholder="Tuliskan kekuatan dan hal positif yang perlu dipertahankan..."
        />
      </div>

      {/* Areas of Improvement */}
      <div>
        <label htmlFor="areasOfImprovement" className="block text-sm font-medium text-slate-700 mb-2">
          Area Pengembangan / Kelemahan
        </label>
        <textarea
          id="areasOfImprovement"
          name="areasOfImprovement"
          rows={4}
          defaultValue={initialData?.areasOfImprovement || ""}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          placeholder="Tuliskan area yang perlu ditingkatkan..."
        />
      </div>

      {/* Recommendations */}
      <div>
        <label htmlFor="recommendations" className="block text-sm font-medium text-slate-700 mb-2">
          Rekomendasi / Rencana Tindak Lanjut
        </label>
        <textarea
          id="recommendations"
          name="recommendations"
          rows={4}
          defaultValue={initialData?.recommendations || ""}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
          placeholder="Saran konkret atau langkah yang disarankan..."
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
         <select 
            name="status" 
            defaultValue={initialData?.status || "DRAFT"}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="DRAFT">Draft</option>
            <option value="FINAL">Final</option>
         </select>
         <span className="text-xs text-muted-foreground">Set ke Final agar dapat dilihat oleh staf.</span>
      </div>

      <SubmitButton />

      {/* Comment thread moved outside form to avoid nested form issues */}
    </form>

    {initialData?.id && (
        <div className="pt-8 mt-8 border-t border-slate-200">
           <CommentThread 
             planId={initialData.id}
             initialComments={initialData.comments || []}
             currentUserEmail={currentUserEmail}
             currentUserRole={currentUserRole}
           />
        </div>
    )}
    </>
  )
}
