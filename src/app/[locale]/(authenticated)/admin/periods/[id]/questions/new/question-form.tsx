"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { createQuestion } from "@/lib/actions/questions"
import { QUESTION_TYPE_LABELS, type QuestionFormState } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

interface QuestionFormProps {
  periodId: string
}

const initialState: QuestionFormState = {
  success: false,
  message: "",
}

export function QuestionForm({ periodId }: QuestionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [state, formAction, isPending] = useActionState(createQuestion, initialState)
  const [isRequired, setIsRequired] = useState(true)

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Berhasil",
          description: state.message,
        })
        router.push(`/admin/periods/${periodId}/questions`)
      } else {
        toast({
          title: "Gagal",
          description: state.message,
          variant: "destructive",
        })
      }
    }
  }, [state, router, periodId, toast])

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="periodId" value={periodId} />
      <input type="hidden" name="isRequired" value={isRequired.toString()} />
      
      {/* Question Text */}
      <div className="space-y-2">
        <Label htmlFor="text">Pertanyaan *</Label>
        <textarea
          id="text"
          name="text"
          rows={3}
          required
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Masukkan pertanyaan evaluasi..."
        />
        {state.errors?.text && (
          <p className="text-sm text-destructive">{state.errors.text[0]}</p>
        )}
      </div>

      {/* Question Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Tipe Jawaban *</Label>
        <select
          id="type"
          name="type"
          required
          defaultValue="SCALE_1_TO_5"
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Skala 1-5 untuk rating, Teks untuk jawaban panjang, Ya/Tidak untuk konfirmasi
        </p>
        {state.errors?.type && (
          <p className="text-sm text-destructive">{state.errors.type[0]}</p>
        )}
      </div>

      {/* Weight & Category Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight">Bobot Nilai</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            min={1}
            defaultValue={1}
            required
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Faktor pengali nilai (Default: 1)
          </p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Kategori/Pilar</Label>
          <select
            id="category"
            name="category"
            required
            defaultValue="General"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="General">General (Umum)</option>
            <option value="Liturgia">Liturgia (Peribadatan)</option>
            <option value="Diakonia">Diakonia (Pelayanan)</option>
            <option value="Kerygma">Kerygma (Pewartaan)</option>
            <option value="Koinonia">Koinonia (Persekutuan)</option>
            <option value="Martyria">Martyria (Kesaksian)</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Kategori kompetensi pastoral
          </p>
        </div>
      </div>

      {/* Order */}
      <div className="space-y-2">
        <Label htmlFor="order">Urutan</Label>
        <Input
          id="order"
          name="order"
          type="number"
          min={1}
          defaultValue={1}
          className="w-full md:w-1/2"
        />
        <p className="text-xs text-muted-foreground">
          Urutan pertanyaan dalam form evaluasi (kosongkan untuk urutan otomatis)
        </p>
      </div>

      {/* Is Required */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isRequiredCheck"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="isRequiredCheck" className="font-normal">
          Wajib Dijawab
        </Label>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Pertanyaan"
          )}
        </Button>
      </div>
    </form>
  )
}
