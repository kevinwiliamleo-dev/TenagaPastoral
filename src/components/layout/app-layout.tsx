"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface AppLayoutProps {
  children: React.ReactNode
  userName?: string
  userRole?: "ADMIN" | "PASTORAL_STAFF"
  userImage?: string
}

export function AppLayout({
  children,
  userName = "Administrator",
  userRole = "ADMIN",
  userImage,
}: AppLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar - Desktop */}
      <Sidebar userRole={userRole} />

      {/* Sidebar - Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar userRole={userRole} className="flex h-full" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-background">
        <Header
          userName={userName}
          userRole={userRole}
          userImage={userImage}
          showMenuButton={true}
          onMenuClick={() => setIsMobileOpen(!isMobileOpen)}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
