"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? t('error_login_failed') : null
  )
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Re-validate schema with translations
  // Note: For full schema validation translation, we'd need to move schema inside component or pass t to it. 
  // For now, let's keep basic schema but usage of t() in UI is key.

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('error_login_failed'))
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError(t('error_generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background font-display min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(#cfdfe7_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]"></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent to-white/50 dark:to-background pointer-events-none"></div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-[420px] bg-card rounded-xl shadow-xl border border-border overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col items-center pt-10 pb-6 px-8 text-center">
          {/* Logo */}
          <div className="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center mb-5">
            <Image
              src="/logo.png"
              alt="Logo Pusat Pastoral Keuskupan Surabaya"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          {/* Headline */}
          <h1 className="text-foreground tracking-tight text-2xl font-bold leading-tight mb-1">
            {t('login_title')}
          </h1>
          {/* Subtitle */}
          <p className="text-muted-foreground text-sm font-medium">
            {t('login_subtitle')}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="px-8 pb-2">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-lg p-3 flex gap-3 items-start">
              <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium leading-tight">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 flex flex-col gap-5">
          {/* Email Input */}
          <div className="flex flex-col gap-2">
            <label className="text-foreground text-sm font-semibold" htmlFor="email">{t('email_label')}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">mail</span>
              <input 
                className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-normal ${
                  errors.email ? "border-red-500" : "border-border"
                }`}
                id="email" 
                placeholder={t('email_placeholder')}
                type="email"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-foreground text-sm font-semibold" htmlFor="password">{t('password_label')}</label>
              <a className="text-primary hover:text-primary/80 text-xs font-medium hover:underline" href="#">{t('forgot_password')}</a>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">lock</span>
              <input 
                className={`w-full pl-10 pr-12 py-3 rounded-lg border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-normal ${
                  errors.password ? "border-red-500" : "border-border"
                }`}
                id="password" 
                placeholder={t('password_placeholder')}
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t('login_processing')}</span>
              </>
            ) : (
              <>
                <span>{t('login_button')}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-muted px-8 py-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">{t('footer')}</p>
        </div>
      </div>
    </div>
  )
}
