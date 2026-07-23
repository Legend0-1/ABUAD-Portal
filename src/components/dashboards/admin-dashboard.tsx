'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, BookOpen, Wallet, FileCheck, TrendingUp, AlertCircle,
  Clock, CheckCircle2, XCircle, BarChart3, Building2, Activity,
  ChevronRight, UserPlus, FileText, DollarSign
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/lib/auth-store'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export function AdminDashboard({ setActiveView, scope = 'super_admin' }: { setActiveView: (v: string) => void; scope?: string }) {
  const { user } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [scope])

  async function loadStats() {
    try {
      const res = await apiFetch(`/api/stats?scope=${scope}`)
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

  const { stats, charts, pendingApprovalsByStage, recentActivity } = data

  const greetingName = user?.firstName
  const scopeTitle = scope === 'super_admin' ? 'System Overview' :
    scope === 'bursary' ? 'Bursary Dashboard' :
    scope === 'registry' ? 'Registry Dashboard' :
    scope === 'college_officer' ? 'College Officer Dashboard' :
    scope === 'coordinator' ? 'Department Coordinator Dashboard' :
    scope === 'adviser' ? 'Academic Adviser Dashboard' : 'Dashboard'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Welcome, {greetingName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{scopeTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveView('reports')}>
            <FileText className="h-4 w-4 mr-2" /> Generate Report
          </Button>
          {scope === 'super_admin' && (
            <Button size="sm" onClick={() => setActiveView('users')}>
              <UserPlus className="h-4 w-4 mr-2" /> Add User
            </Button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} subtitle="Enrolled" icon={Users} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" trend="+12% this session" />
        <StatCard title="Pending Approvals" value={stats.pendingRegistrations} subtitle="Awaiting review" icon={Clock} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" trend={`${pendingApprovalsByStage.adviser} at adviser stage`} />
        <StatCard title="Approved" value={stats.approvedRegistrations} subtitle="This session" icon={CheckCircle2} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" trend="+5 today" />
        <StatCard title="Total Courses" value={stats.totalCourses} subtitle="Available" icon={BookOpen} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-900/20" trend={`${stats.totalDepartments} departments`} />
      </div>

      {/* Revenue Stats - only for bursary and super admin */}
      {(scope === 'super_admin' || scope === 'bursary') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Verified Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600">₦{stats.verifiedRevenue.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Revenue</p>
                  <p className="text-2xl font-bold text-amber-600">₦{stats.pendingRevenue.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Registrations by Status
            </CardTitle>
            <CardDescription>Current distribution of registration statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.registrationsByStatus}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {charts.registrationsByStatus.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Students by Level
            </CardTitle>
            <CardDescription>Distribution across academic levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={charts.studentsByLevel}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ value }) => value}
                >
                  {charts.studentsByLevel.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Approval Pipeline + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Approval Pipeline
            </CardTitle>
            <CardDescription>Registrations pending at each stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { stage: 'Adviser', count: pendingApprovalsByStage.adviser, color: 'bg-blue-500' },
              { stage: 'Coordinator', count: pendingApprovalsByStage.coordinator, color: 'bg-amber-500' },
              { stage: 'College Officer', count: pendingApprovalsByStage.college, color: 'bg-purple-500' },
              { stage: 'Registry', count: pendingApprovalsByStage.registry, color: 'bg-pink-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-2">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold", item.color)}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium">{item.stage}</span>
                </div>
                <Badge variant="secondary" className="font-bold">{item.count}</Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full" size="sm" onClick={() => setActiveView('approvals')}>
              View All Pending <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions across the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No recent activity
                </div>
              ) : (
                recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <Avatar className="h-8 w-8 mt-0.5">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {activity.user?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{activity.user || 'System'}</p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                          {activity.category}
                        </Badge>
                        {activity.ipAddress && activity.ipAddress !== 'unknown' && (
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {activity.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Students by Department
          </CardTitle>
          <CardDescription>Top departments by enrollment</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.studentsByDepartment} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, color, bg, trend }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
              {trend && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {trend}
                </p>
              )}
            </div>
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0", bg)}>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
