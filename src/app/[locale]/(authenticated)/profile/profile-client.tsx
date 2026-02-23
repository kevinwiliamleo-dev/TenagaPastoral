"use client"

import { useState } from "react"
import { updateProfile, changePassword } from "@/lib/actions/profile"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

interface ProfileClientProps {
  profile: {
    id: string
    email: string
    name: string
    role: string
    birthDate?: Date | null
    joinDate?: Date | null
  }
}

export function ProfileClient({ profile }: ProfileClientProps) {
  const t = useTranslations("Profile")
  const { toast } = useToast()
  
  const [name, setName] = useState(profile.name)
  // Store dates as YYYY-MM-DD strings for input[type="date"]
  const [birthDate, setBirthDate] = useState(profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : "")
  const [joinDate, setJoinDate] = useState(profile.joinDate ? new Date(profile.joinDate).toISOString().split('T')[0] : "")
  
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  // Calculate Age
  const calculateAge = (dateString: string) => {
    if (!dateString) return null
    const today = new Date()
    const birthDate = new Date(dateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Calculate Tenure (Lama Berkarya)
  const calculateTenure = (dateString: string) => {
    if (!dateString) return null
    const today = new Date()
    const joinDate = new Date(dateString)
    
    let years = today.getFullYear() - joinDate.getFullYear()
    let months = today.getMonth() - joinDate.getMonth()
    
    if (months < 0) {
      years--
      months += 12
    }

    return { years, months }
  }

  const age = calculateAge(birthDate)
  const tenure = calculateTenure(joinDate)


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    
    try {
      const result = await updateProfile({ 
        name,
        birthDate: birthDate || null,
        joinDate: joinDate || null
      })
      toast({
        title: t("messages.success"),
        description: result.message,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: t("messages.error"),
        description: error instanceof Error ? error.message : t("messages.update_error"),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t("messages.error"),
        description: t("messages.password_mismatch"),
        variant: "destructive",
      })
      return
    }
    
    setIsChangingPassword(true)
    
    try {
      const result = await changePassword({ currentPassword, newPassword, confirmPassword })
      toast({
        title: t("messages.success"),
        description: result.message,
        variant: "default",
      })
      // Clear password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({
        title: t("messages.error"),
        description: error instanceof Error ? error.message : t("messages.password_error"),
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === "ADMIN") {
      return (
        <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/20 dark:bg-purple-900/30 dark:text-purple-400 dark:ring-purple-400/30">
          {t("roles.admin")}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
        {t("roles.staff")}
      </span>
    )
  }

  return (
    <>
      <div className="p-6 lg:p-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap gap-2 items-center -mt-4 mb-4">
          <Link href="/dashboard" className="text-muted-foreground hover:text-primary text-sm font-medium leading-normal flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">home</span>
            Beranda
          </Link>
          <span className="text-muted-foreground text-sm font-medium leading-normal">/</span>
          <span className="text-foreground text-sm font-medium leading-normal">{t("title")}</span>
        </div>

        {/* Page Heading */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-base font-normal">{t("subtitle")}</p>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col md:flex-row overflow-hidden">
          {/* LEFT SIDE: Profile Info */}
          <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border bg-muted/30 p-8 flex flex-col items-center">
            {/* Avatar Section */}
            <div className="relative group mb-6">
              <div className="size-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-card shadow-md">
                <span className="material-symbols-outlined text-[64px] text-primary">person</span>
              </div>
            </div>

            {/* Identity */}
            <h2 className="text-xl font-bold text-foreground mb-2 text-center">{profile.name || t("info.name_placeholder")}</h2>
            {getRoleBadge(profile.role)}

            {/* Read-only Email */}
            <div className="w-full mt-6">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                {t("info.email_label")}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </span>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-lg border border-border bg-muted text-muted-foreground text-sm py-2.5 pl-10 pr-3 cursor-not-allowed"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                {t("info.contact_admin")}
              </p>
            </div>
          </aside>

          {/* RIGHT SIDE: Settings Forms */}
          <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col gap-8">
            {/* Section: Edit Profil */}
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                <span className="material-symbols-outlined text-primary">badge</span>
                <h3 className="text-lg font-bold text-foreground">{t("edit_profile.title")}</h3>
              </div>
              <form onSubmit={handleUpdateProfile} className="max-w-md">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">{t("edit_profile.name_label")}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm py-2.5 px-3"
                    placeholder={t("edit_profile.name_placeholder")}
                    required
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {t("edit_profile.name_help")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Birth Date & Age */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm py-2.5 px-3"
                    />
                    {age !== null && (
                      <p className="mt-1.5 text-xs text-primary font-medium">
                        Usia: {age} Tahun
                      </p>
                    )}
                  </div>

                  {/* Join Date & Tenure */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Mulai Berkarya</label>
                    <input
                      type="date"
                      value={joinDate}
                      onChange={(e) => setJoinDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm py-2.5 px-3"
                    />
                    {tenure && (
                      <p className="mt-1.5 text-xs text-primary font-medium">
                        Lama: {tenure.years} Tahun {tenure.months > 0 ? `${tenure.months} Bulan` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex justify-center items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <span className="material-symbols-outlined animate-spin mr-2 text-[18px]">progress_activity</span>
                      {t("edit_profile.saving")}
                    </>
                  ) : (
                    t("edit_profile.save")
                  )}
                </button>
              </form>
            </section>

            {/* Section: Keamanan */}
            <section>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                <span className="material-symbols-outlined text-primary">lock</span>
                <h3 className="text-lg font-bold text-foreground">{t("security.title")}</h3>
              </div>
              <form onSubmit={handleChangePassword} className="max-w-md">
                <div className="grid grid-cols-1 gap-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t("security.current_password")}</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm py-2.5 px-3 pr-10"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  {/* New Passwords */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{t("security.new_password")}</label>
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm py-2.5 px-3"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{t("security.confirm_password")}</label>
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm py-2.5 px-3"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  {/* Show Password Toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showPasswords"
                      checked={showPasswords}
                      onChange={(e) => setShowPasswords(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="showPasswords" className="text-sm text-muted-foreground">
                      {t("security.show_password")}
                    </label>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    {t("security.min_chars")}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="mt-4 inline-flex justify-center items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? (
                    <>
                      <span className="material-symbols-outlined animate-spin mr-2 text-[18px]">progress_activity</span>
                      {t("security.changing")}
                    </>
                  ) : (
                    t("security.change_password")
                  )}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
      </>
  )
}
