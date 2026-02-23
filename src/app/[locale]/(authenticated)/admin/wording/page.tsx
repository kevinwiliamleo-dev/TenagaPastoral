import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getWordingsForLocale } from "@/lib/actions/wording"
import { WordingEditorClient } from "./wording-editor-client"

export default async function WordingPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { locale: selectedLocale } = await searchParams
  const locale = selectedLocale || "id"

  const items = await getWordingsForLocale(locale)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Teks</h1>
            <p className="text-muted-foreground">
              Ubah teks dan label pada aplikasi tanpa coding
            </p>
          </div>
          {/* Locale Switcher */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <a
              href="?locale=id"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                locale === "id"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇮🇩 Indonesia
            </a>
            <a
              href="?locale=en"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                locale === "en"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🇬🇧 English
            </a>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex gap-3">
        <span className="material-symbols-outlined text-blue-500 flex-shrink-0 mt-0.5">info</span>
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">Cara Penggunaan:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Ketik teks baru di kolom input untuk mengganti teks default.</li>
            <li>Klik <strong>✓ (centang)</strong> untuk menyimpan per-item, atau <strong>Simpan Semua</strong> untuk menyimpan sekaligus.</li>
            <li>Klik <strong>↺ (reset)</strong> untuk mengembalikan teks ke bawaan asli.</li>
            <li>Perubahan langsung terlihat setelah halaman di-refresh.</li>
          </ul>
        </div>
      </div>

      <WordingEditorClient items={items} locale={locale} />
    </div>
  )
}
