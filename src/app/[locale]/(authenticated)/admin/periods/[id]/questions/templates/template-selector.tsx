"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, FileText } from "lucide-react"
import { bulkCreateQuestions } from "@/lib/actions/questions"
import { QUESTION_TYPE_LABELS } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { QuestionType } from "@prisma/client"

interface Template {
  name: string
  description: string
  questions: Array<{ text: string; type: QuestionType; isRequired?: boolean }>
}

interface TemplateSelectorProps {
  periodId: string
  templates: Record<string, Template>
}

export function TemplateSelector({ periodId, templates }: TemplateSelectorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return

    const template = templates[selectedTemplate]
    if (!template) return

    setIsApplying(true)
    try {
      const result = await bulkCreateQuestions(periodId, template.questions)
      
      if (result.success) {
        toast({
          title: "Berhasil",
          description: result.message,
        })
        router.push(`/admin/periods/${periodId}/questions`)
      } else {
        toast({
          title: "Gagal",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menerapkan template",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Template Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(templates).map(([key, template]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === key
                ? "ring-2 ring-primary border-primary"
                : "hover:border-primary/50"
            }`}
            onClick={() => setSelectedTemplate(key)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="h-8 w-8 text-primary mb-2" />
                {selectedTemplate === key && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {template.questions.length} pertanyaan
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview */}
      {selectedTemplate && templates[selectedTemplate] && (
        <Card>
          <CardHeader>
            <CardTitle>Preview: {templates[selectedTemplate].name}</CardTitle>
            <CardDescription>
              Pertanyaan yang akan ditambahkan ke periode evaluasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {templates[selectedTemplate].questions.map((q, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {QUESTION_TYPE_LABELS[q.type]}
                      </span>
                      {q.isRequired !== false && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          Wajib
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{q.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isApplying}
        >
          Batal
        </Button>
        <Button
          onClick={handleApplyTemplate}
          disabled={!selectedTemplate || isApplying}
        >
          {isApplying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menerapkan Template...
            </>
          ) : (
            "Terapkan Template"
          )}
        </Button>
      </div>
    </div>
  )
}
