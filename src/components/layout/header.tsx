"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import Image from "next/image"
import { NotificationBell } from "./notification-bell"
import { useTheme } from "next-themes"

interface HeaderProps {
  userName?: string
  userRole?: string
  userImage?: string
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function Header({
  userName = "Administrator",
  userRole = "Super Admin",
  userImage,
  onMenuClick,
  showMenuButton = true,
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const displayRole = userRole === "ADMIN" ? "Super Admin" : "Staf Pastoral"

  return (
    <header className="flex-shrink-0 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4 sticky top-0 z-20">
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-primary"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Mobile Brand */}
      <div className="flex items-center gap-2 lg:hidden">
        <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
        <span className="font-bold text-foreground">Pastoral Eval</span>
      </div>

      {/* Desktop Spacer */}
      <div className="hidden lg:block"></div>

      {/* Right Side */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* User Info */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-bold text-foreground">{userName}</span>
          <span className="text-xs text-muted-foreground">{displayRole}</span>
        </div>

        <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mounted && theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Avatar */}
          <div
            className="size-10 rounded-full bg-cover bg-center border-2 border-border shadow-sm"
            style={{
              backgroundImage: userImage 
                ? `url('${userImage}')` 
                : `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAdGcdC2LlgAOCJWjScsNP4IwQUETWgGfo_43LMvEGxrftUfTJALZHhg2kS5sB2aLtp3WLebZOfTeplEwiSkfJ-XB9YfFf86DEbXnhMBAdTyZBreMrG0MCtbsGw5QPuQvKVW78l7xWV6QdjSPuii7BLSC7TF0kD6zf27Xe9RpwpqCwYwHYRKv-uxYWC0WouSAidKS98h7b5imW5qk01R88-BVP1qgfbjS817RSflo52005hhw3Dt48taq5k1Rj864W1nxTQiFAztPs')`
            }}
          />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-2"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm font-medium hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
