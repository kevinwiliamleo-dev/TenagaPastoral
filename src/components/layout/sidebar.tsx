import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import LanguageSwitcher from "@/components/language-switcher"

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  userRole?: "ADMIN" | "PASTORAL_STAFF"
  className?: string
}

interface NavItem {
  key: string
  href: string
  icon: string
  iconFilled?: boolean
  roles: ("ADMIN" | "PASTORAL_STAFF")[]
}

const navItems: NavItem[] = [
  // Common - Dashboard
  { key: "dashboard", href: "/dashboard", icon: "dashboard", iconFilled: true, roles: ["ADMIN", "PASTORAL_STAFF"] },
  
  // Admin Management
  { key: "users", href: "/admin/users", icon: "group", roles: ["ADMIN"] },
  { key: "master_data", href: "/admin/master-data", icon: "database", roles: ["ADMIN"] },
  { key: "periods", href: "/admin/periods", icon: "date_range", roles: ["ADMIN"] },
  
  // Core Operations (Admin View)
  { key: "admin_activities", href: "/admin/activities", icon: "category", roles: ["ADMIN"] },
  { key: "admin_tasks", href: "/admin/tasks", icon: "assignment", roles: ["ADMIN"] },
  { key: "goal_review", href: "/admin/goal-review", icon: "verified", roles: ["ADMIN"] },
  
  // Core Operations (Staff View)
  { key: "activities", href: "/panca-tugas", icon: "category", roles: ["PASTORAL_STAFF"] },
  { key: "tasks", href: "/tasks", icon: "assignment", roles: ["PASTORAL_STAFF"] }, // Changed icon to match Admin
  { key: "goals", href: "/goals", icon: "flag", roles: ["PASTORAL_STAFF"] },
  
  // Common - Calendar & Tools
  { key: "calendar", href: "/calendar", icon: "calendar_month", roles: ["ADMIN", "PASTORAL_STAFF"] },

  // Evaluation & Results
  { key: "evaluations", href: "/evaluations", icon: "description", roles: ["PASTORAL_STAFF"] },
  { key: "results", href: "/results", icon: "assignment_turned_in", roles: ["PASTORAL_STAFF"] },
  
  // Reports & Analytics
  { key: "analytics", href: "/admin/analytics", icon: "query_stats", roles: ["ADMIN"] },
  { key: "scoring_config", href: "/admin/scoring-config", icon: "tune", roles: ["ADMIN"] },
  { key: "wording", href: "/admin/wording", icon: "translate", roles: ["ADMIN"] },
  { key: "reports", href: "/reports", icon: "bar_chart", roles: ["ADMIN"] },
  
  // Rankings
  { key: "leaderboard", href: "/leaderboard", icon: "leaderboard", roles: ["ADMIN", "PASTORAL_STAFF"] },
  
  // Account
  { key: "profile", href: "/profile", icon: "person", roles: ["ADMIN", "PASTORAL_STAFF"] },
]

export function Sidebar({ isCollapsed = false, onToggle, userRole = "ADMIN", className }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations("Sidebar")
  
  // Filter items
  const items = navItems.filter(item => item.roles.includes(userRole))

  return (
    <aside className={cn("hidden lg:flex w-72 flex-col justify-between border-r border-border bg-card", className)}>
      <div className="flex flex-col">
        {/* Brand */}
        <div className="p-6 pb-2">
          <div className="flex gap-3 items-center mb-8">
            <div className="flex items-center justify-center size-10 rounded-xl overflow-hidden">
              <Image
                src="/logo.png"
                alt="Logo Pusat Pastoral"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-foreground text-base font-bold leading-tight">Sistem Evaluasi</h1>
              <p className="text-muted-foreground text-xs font-medium">Kinerja Pastoral</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 flex flex-col gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className={cn("material-symbols-outlined", isActive && item.iconFilled && "fill-1")}>
                  {item.icon}
                </span>
                <span className={cn("text-sm", isActive ? "font-bold" : "font-medium")}>
                  {t(item.key as any)}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border flex flex-col gap-4">
        <div className="px-4">
           <LanguageSwitcher />
        </div>
        
        <Link
          href="/help"
          className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span className="text-sm font-medium">{t("help")}</span>
        </Link>
      </div>
    </aside>
  )
}
