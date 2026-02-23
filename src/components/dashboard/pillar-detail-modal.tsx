"use client"

import { useEffect, useState } from "react"
import { getPillarDetails } from "@/lib/actions/analytics"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface PillarDetailModalProps {
  isOpen: boolean
  onClose: () => void
  periodId: string
  category: string
}

interface PillarData {
  category: string
  average: number
  questions: {
    question: string
    average: number
    count: number
  }[]
}

export function PillarDetailModal({ isOpen, onClose, periodId, category }: PillarDetailModalProps) {
  const [data, setData] = useState<PillarData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && category && periodId) {
      setLoading(true)
      getPillarDetails(periodId, category)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isOpen, category, periodId])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span>Detail Kategori: {category}</span>
            {!loading && data && (
               <span className={`text-sm px-2 py-0.5 rounded-full ${
                 data.average >= 4 ? "bg-green-100 text-green-700" :
                 data.average >= 3 ? "bg-blue-100 text-blue-700" :
                 "bg-orange-100 text-orange-700"
               }`}>
                 Avg: {data.average}
               </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Analisis mendalam berdasarkan rata-rata skor per pertanyaan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : data ? (
            <div className="space-y-4">
              {data.questions.map((q, i) => (
                <div key={i} className="bg-card border border-border p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                    <div className="flex flex-col items-end">
                      <span className={`text-lg font-bold ${
                        q.average >= 4 ? "text-green-600" :
                        q.average >= 3 ? "text-blue-600" :
                        "text-orange-600"
                      }`}>
                        {q.average}
                      </span>
                      <span className="text-xs text-muted-foreground">{q.count} ulasan</span>
                    </div>
                  </div>
                  {/* Progress bar visual */}
                  <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        q.average >= 4 ? "bg-green-500" :
                        q.average >= 3 ? "bg-blue-500" :
                        "bg-orange-500"
                      }`} 
                      style={{ width: `${(q.average / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {data.questions.length === 0 && (
                 <p className="text-center text-muted-foreground py-8">Belum ada data untuk kategori ini.</p>
              )}
            </div>
          ) : (
            <p className="text-center text-red-500">Gagal memuat data.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
