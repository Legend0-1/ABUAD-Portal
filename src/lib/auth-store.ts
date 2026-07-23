'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'SUPER_ADMIN' | 'ICT_ADMIN' | 'REGISTRY' | 'COLLEGE_OFFICER' | 'DEPARTMENT_COORDINATOR' | 'ACADEMIC_ADVISER' | 'BURSARY' | 'STUDENT'

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  avatarUrl?: string
  student?: any
  collegeOfficers?: any[]
  departmentCoordinators?: any[]
  academicAdvisers?: any[]
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  setUser: (user: AuthUser | null, token?: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setUser: (user, token) => set({
        user,
        accessToken: token ?? null,
        isAuthenticated: !!user,
      }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'abuad-auth' }
  )
)

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Administrator',
  ICT_ADMIN: 'ICT Administrator',
  REGISTRY: 'Registry Officer',
  COLLEGE_OFFICER: 'College Officer',
  DEPARTMENT_COORDINATOR: 'Department Coordinator',
  ACADEMIC_ADVISER: 'Academic Adviser',
  BURSARY: 'Bursary Officer',
  STUDENT: 'Student',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ICT_ADMIN: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  REGISTRY: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  COLLEGE_OFFICER: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DEPARTMENT_COORDINATOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ACADEMIC_ADVISER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  BURSARY: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  STUDENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}
