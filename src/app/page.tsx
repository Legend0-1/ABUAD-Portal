'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { apiFetch } from '@/lib/api-client'
import { LoginScreen } from '@/components/login-screen'
import { PortalLayout } from '@/components/portal-layout'
import { StudentDashboard } from '@/components/dashboards/student-dashboard'
import { AdminDashboard } from '@/components/dashboards/admin-dashboard'
import { CourseRegistration } from '@/components/views/course-registration'
import { CourseCatalog } from '@/components/views/course-catalog'
import { ApprovalsView } from '@/components/views/approvals'
import { StudentsView } from '@/components/views/students-view'
import { PaymentsView } from '@/components/views/payments-view'
import { CollegesView } from '@/components/views/colleges-view'
import { AuditView } from '@/components/views/audit-view'
import { UserManagementView } from '@/components/views/user-management'
import {
  NotificationsView, AnnouncementsView, SupportView,
  ResultsView, TimetableView, ReportsView, SettingsView
} from '@/components/views/other-views'

export default function Home() {
  const { user, isAuthenticated, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await apiFetch('/api/auth/me')
      setUser(res.user)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-12 rounded-xl bg-abuad-gradient mx-auto" />
          <div className="h-4 w-48 bg-muted rounded mx-auto" />
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginScreen />
  }

  // Determine dashboard scope based on role
  const getDashboardScope = () => {
    switch (user.role) {
      case 'STUDENT': return 'student'
      case 'BURSARY': return 'bursary'
      case 'REGISTRY': return 'registry'
      case 'COLLEGE_OFFICER': return 'college_officer'
      case 'DEPARTMENT_COORDINATOR': return 'coordinator'
      case 'ACADEMIC_ADVISER': return 'adviser'
      default: return 'super_admin'
    }
  }

  // Render active view
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return user.role === 'STUDENT'
          ? <StudentDashboard setActiveView={setActiveView} />
          : <AdminDashboard setActiveView={setActiveView} scope={getDashboardScope()} />

      case 'registration':
        return <CourseRegistration />

      case 'catalog':
        return <CourseCatalog />

      case 'approvals':
        return <ApprovalsView />

      case 'students':
        return <StudentsView />

      case 'payments':
        return <PaymentsView />

      case 'colleges':
        return <CollegesView />

      case 'reports':
        return <ReportsView />

      case 'audit':
        return <AuditView />

      case 'users':
        return <UserManagementView />

      case 'notifications':
        return <NotificationsView />

      case 'announcements':
        return <AnnouncementsView />

      case 'support':
        return <SupportView />

      case 'results':
        return <ResultsView />

      case 'timetable':
        return <TimetableView />

      case 'settings':
        return <SettingsView />

      default:
        return user.role === 'STUDENT'
          ? <StudentDashboard setActiveView={setActiveView} />
          : <AdminDashboard setActiveView={setActiveView} scope={getDashboardScope()} />
    }
  }

  return (
    <PortalLayout activeView={activeView} setActiveView={setActiveView}>
      {renderView()}
    </PortalLayout>
  )
}
