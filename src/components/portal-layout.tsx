'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, GraduationCap, Users, FileText, Wallet,
  Bell, ShieldCheck, LogOut, Menu, X, Search, ChevronDown,
  Settings, BarChart3, ClipboardList, Building2, Calendar, MessageSquare,
  History, FileCheck, CreditCard, Award, HelpCircle, UserCog, ScrollText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuthStore, ROLE_LABELS, ROLE_COLORS } from '@/lib/auth-store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { ABUAD_INFO } from '@/lib/constants'
import { cn } from '@/lib/utils'

export type NavItem = {
  id: string
  label: string
  icon: any
  roles?: string[]
  badge?: number
}

export type NavSection = {
  title?: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Academics',
    items: [
      { id: 'registration', label: 'Course Registration', icon: BookOpen, roles: ['STUDENT'] },
      { id: 'catalog', label: 'Course Catalog', icon: GraduationCap },
      { id: 'approvals', label: 'Approvals', icon: FileCheck, roles: ['ACADEMIC_ADVISER', 'DEPARTMENT_COORDINATOR', 'COLLEGE_OFFICER', 'REGISTRY', 'SUPER_ADMIN'] },
      { id: 'results', label: 'Results & CGPA', icon: Award, roles: ['STUDENT'] },
      { id: 'timetable', label: 'Timetable', icon: Calendar, roles: ['STUDENT', 'ACADEMIC_ADVISER'] },
    ]
  },
  {
    title: 'Management',
    items: [
      { id: 'students', label: 'Students', icon: Users, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY', 'COLLEGE_OFFICER', 'DEPARTMENT_COORDINATOR', 'ACADEMIC_ADVISER'] },
      { id: 'payments', label: 'Payments', icon: Wallet, roles: ['BURSARY', 'SUPER_ADMIN', 'STUDENT'] },
      { id: 'colleges', label: 'Colleges & Depts', icon: Building2, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY'] },
      { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY', 'COLLEGE_OFFICER', 'BURSARY'] },
      { id: 'audit', label: 'Audit Logs', icon: History, roles: ['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY'] },
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'users', label: 'User Management', icon: UserCog, roles: ['SUPER_ADMIN', 'ICT_ADMIN'] },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'announcements', label: 'Announcements', icon: ScrollText },
      { id: 'support', label: 'Help & Support', icon: HelpCircle },
      { id: 'settings', label: 'Settings', icon: Settings, roles: ['SUPER_ADMIN', 'ICT_ADMIN'] },
    ]
  }
]

export function PortalLayout({ children, activeView, setActiveView }: {
  children: React.ReactNode
  activeView: string
  setActiveView: (v: string) => void
}) {
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const fetchNotifs = async () => {
      try {
        const res = await apiFetch('/api/notifications?unreadOnly=true')
        setNotifications(res.notifications.slice(0, 8))
        setUnreadCount(res.notifications.length)
      } catch {}
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [user])

  async function markAllRead() {
    try {
      await apiFetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'read_all' })
      })
      setUnreadCount(0)
      setNotifications([])
      toast.success('All notifications marked as read')
    } catch {}
  }

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    logout()
    toast.success('Signed out successfully')
  }

  if (!user) return null

  const userRoles = [user.role]
  const filteredSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => !item.roles || item.roles.some(r => userRoles.includes(r)))
  })).filter(section => section.items.length > 0)

  const displayName = `${user.firstName} ${user.lastName}`
  const initials = `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase()

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-40">
        <SidebarContent
          user={user}
          filteredSections={filteredSections}
          activeView={activeView}
          setActiveView={setActiveView}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent
            user={user}
            filteredSections={filteredSections}
            activeView={activeView}
            setActiveView={(v) => { setActiveView(v); setMobileOpen(false) }}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur-md border-b flex items-center px-4 lg:px-6 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students, courses, registrations..."
                className="pl-10 h-9 bg-muted/50"
              />
            </div>
          </div>

          <div className="flex-1 md:hidden">
            <h2 className="font-semibold text-sm">{ABUAD_INFO.shortName} Portal</h2>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <ThemeToggle />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem key={n.id} className="p-3 cursor-pointer flex-col items-start">
                        <div className="flex items-start gap-2 w-full">
                          <div className={cn("h-2 w-2 rounded-full mt-1.5 flex-shrink-0",
                            n.type === 'SUCCESS' ? 'bg-emerald-500' :
                            n.type === 'ERROR' ? 'bg-red-500' :
                            n.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{n.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 px-2 gap-2 hover:bg-accent">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold leading-tight">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                    <Badge className={cn("w-fit text-[10px]", ROLE_COLORS[user.role as keyof typeof ROLE_COLORS])}>
                      {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveView('settings')}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('support')}>
                  <HelpCircle className="h-4 w-4 mr-2" /> Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t bg-background py-4 px-6 text-center text-xs text-muted-foreground">
          © 2025 {ABUAD_INFO.name} · {ABUAD_INFO.motto} · Powered by ABUAD ICT Unit
        </footer>
      </div>
    </div>
  )
}

function SidebarContent({ user, filteredSections, activeView, setActiveView }: any) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-xl bg-abuad-gradient flex items-center justify-center text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight">ABUAD Portal</h1>
          <p className="text-[10px] text-muted-foreground">Part-Time Students</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {filteredSections.map((section: NavSection, i: number) => (
          <div key={i}>
            {section.title && (
              <h3 className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User info footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent/50">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
