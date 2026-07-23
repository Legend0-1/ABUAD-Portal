'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap, BookOpen, Wallet, Award, Bell, Calendar, FileCheck,
  TrendingUp, AlertCircle, ChevronRight, BookMarked
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { apiFetch } from '@/lib/api-client'
import { REGISTRATION_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'

export function StudentDashboard({ setActiveView }: { setActiveView: (v: string) => void }) {
  const { user } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    try {
      const res = await apiFetch('/api/stats?scope=student')
      setData(res)
    } catch (err) {
      console.error('Failed to load stats', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} className="h-32 rounded-xl animate-shimmer" />
        ))}
      </div>
    )
  }

  const { student, registration, outstandingFees, unreadNotifications, carryOvers, registrationProgress } = data
  const statusInfo = REGISTRATION_STATUSES.find(s => s.value === student.registrationStatus)
  const initials = `${user?.firstName[0] || ''}${user?.lastName[0] || ''}`.toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {student.college.name} · {student.department.name} · {student.programme.name}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {statusInfo && (
            <Badge className={cn("px-3 py-1.5", statusInfo.color)}>{statusInfo.label}</Badge>
          )}
          {outstandingFees > 0 && (
            <Badge variant="destructive" className="px-3 py-1.5">
              <AlertCircle className="h-3 w-3 mr-1" /> Outstanding Fees
            </Badge>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden border-2">
        <div className="h-24 bg-abuad-gradient relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-10 w-20 h-20 bg-amber-300 rounded-full blur-2xl"></div>
          </div>
        </div>
        <CardContent className="pb-4 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-background rounded-2xl">
              <AvatarImage src={student.passportUrl || user?.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold rounded-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-muted-foreground">{student.matricNumber}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" /> {student.level.replace('LEVEL_', '')} Level
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {student.currentSemester?.name === 'FIRST' ? 'First Semester' : 'Second Semester'}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> {student.currentSession?.name}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveView('settings')}>
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Current CGPA" value={student.cgpa.toFixed(2)} subtitle="Out of 5.00" icon={Award} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard title="Credit Units" value={student.totalCreditUnits} subtitle="Total earned" icon={BookMarked} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard title="Outstanding Fees" value={`₦${outstandingFees.toLocaleString()}`} subtitle={outstandingFees > 0 ? "Action required" : "All cleared"} icon={Wallet} color={outstandingFees > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"} bg={outstandingFees > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"} />
        <StatCard title="Carry Overs" value={carryOvers} subtitle={carryOvers > 0 ? "Need attention" : "All passed"} icon={AlertCircle} color={carryOvers > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"} bg={carryOvers > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" /> Registration Progress
                </CardTitle>
                <CardDescription>
                  {student.currentSession?.name} · {student.currentSemester?.name === 'FIRST' ? 'First Semester' : 'Second Semester'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveView('registration')}>
                {registration ? 'View Details' : 'Start Registration'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {registration ? (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Course Selection Progress</span>
                    <span className="font-semibold">{registration.details.length} courses · {registration.totalUnits} units</span>
                  </div>
                  <Progress value={Math.min(registrationProgress, 100)} className="h-2" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Core</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{registration.coreUnits}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Elective</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{registration.electiveUnits}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">GST</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{registration.gstUnits}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{registration.totalUnits}</p>
                  </div>
                </div>
                {registration.status !== 'DRAFT' && registration.status !== 'NOT_STARTED' && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Approval Workflow</p>
                    <div className="flex items-center justify-between gap-1">
                      {['ADVISER', 'COORDINATOR', 'COLLEGE_OFFICER', 'REGISTRY'].map((stage, i) => {
                        const stageStatus = getStageStatus(registration.status, stage)
                        return (
                          <div key={stage} className="flex-1 flex items-center">
                            <div className="flex flex-col items-center gap-1 flex-1">
                              <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                                stageStatus === 'done' && "bg-emerald-500 text-white",
                                stageStatus === 'current' && "bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900/30",
                                stageStatus === 'pending' && "bg-muted text-muted-foreground"
                              )}>
                                {stageStatus === 'done' ? '✓' : i + 1}
                              </div>
                              <span className="text-[9px] text-center text-muted-foreground leading-tight">
                                {stage === 'ADVISER' ? 'Adviser' : stage === 'COORDINATOR' ? 'Coord.' : stage === 'COLLEGE_OFFICER' ? 'College' : 'Registry'}
                              </span>
                            </div>
                            {i < 3 && <div className={cn("h-0.5 w-4 -mt-4", stageStatus === 'done' ? "bg-emerald-500" : "bg-muted")} />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-semibold">No Registration Started</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Begin your course registration for the current semester
                </p>
                <Button onClick={() => setActiveView('registration')}>
                  <BookOpen className="h-4 w-4 mr-2" /> Start Registration
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifications
                {unreadNotifications > 0 && (
                  <Badge className="text-[10px] h-5 px-1.5">{unreadNotifications} new</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              <NotificationList />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveView('registration')} className="justify-start">
                <BookOpen className="h-4 w-4 mr-2" /> Register
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveView('results')} className="justify-start">
                <Award className="h-4 w-4 mr-2" /> Results
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveView('payments')} className="justify-start">
                <Wallet className="h-4 w-4 mr-2" /> Payments
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActiveView('timetable')} className="justify-start">
                <Calendar className="h-4 w-4 mr-2" /> Timetable
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, color, bg }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", bg)}>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function NotificationList() {
  const [notifications, setNotifications] = useState<any[]>([])
  useEffect(() => {
    apiFetch('/api/notifications').then(res => setNotifications(res.notifications.slice(0, 5))).catch(() => {})
  }, [])

  if (notifications.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
        No notifications
      </div>
    )
  }

  return notifications.map(n => (
    <div key={n.id} className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-2">
        <div className={cn("h-2 w-2 rounded-full mt-1.5 flex-shrink-0",
          n.type === 'SUCCESS' ? 'bg-emerald-500' :
          n.type === 'ERROR' ? 'bg-red-500' :
          n.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
        )} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-xs">{n.title}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-2">{n.message}</p>
        </div>
      </div>
    </div>
  ))
}

function getStageStatus(regStatus: string, stage: string): 'done' | 'current' | 'pending' {
  const flow = ['ADVISER', 'COORDINATOR', 'COLLEGE_OFFICER', 'REGISTRY']
  const statusMap: Record<string, number> = {
    'PENDING_ADVISER': 0, 'PENDING_COORDINATOR': 1, 'PENDING_COLLEGE': 2, 'PENDING_REGISTRY': 3, 'APPROVED': 4,
  }
  const currentIndex = statusMap[regStatus] ?? -1
  const stageIndex = flow.indexOf(stage)
  if (currentIndex > stageIndex) return 'done'
  if (currentIndex === stageIndex) return 'current'
  return 'pending'
}
