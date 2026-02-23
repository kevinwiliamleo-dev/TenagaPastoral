"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "next/navigation"
import { ChangeEvent, useTransition } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleCreate = (nextLocale: string) => {
    startTransition(() => {
      // Split pathname to replace locale segment
      // Pathname usually starts with /id or /en or nothing (if handled by middleware rewriting)
      // But with our middleware config, it should be /id/... or /en/...
      
      const segments = pathname.split('/')
      if (segments.length > 1 && (segments[1] === 'id' || segments[1] === 'en')) {
         segments[1] = nextLocale
      } else {
         segments.unshift(nextLocale)
      }
      
      const newPath = segments.join('/').replace('//', '/')
      router.replace(newPath)
    })
  }

  return (
    <Select defaultValue={locale} onValueChange={handleCreate} disabled={isPending}>
      <SelectTrigger className="w-[100px] h-8 text-xs bg-transparent border-border">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="id">Bahasa</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  )
}
