'use client'

import { useState, useEffect } from 'react'
import {
  Bell, ScrollText, HelpCircle, Settings, Award, Calendar, FileText,
  Download, MessageSquare, Send, CheckCircle2, AlertCircle, BookOpen,
  TrendingUp, Users, Wallet, BookMarked
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899']

export function NotificationsView() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  async function load() {
    try {
      const res = await apiFetch('/api/notifications')
      setNotifications(res.notifications)
    } catch {} finally { setLoading(false) }
  }

  async function markAllRead() {
    try {
      await apiFetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ action: 'read_all' }) })
      setNotifications(n => n.map(x => ({ ...x, isRead: true })))
      toast.success('All notifications marked as read')
    } catch {}
  }

  if (loading) return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1 text-sm">{notifications.filter(n => !n.isRead).length} unread</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <CheckCircle2 className="h-4 w-4 mr-2" /> Mark all read
        </Button>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="font-medium">No notifications</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map(n => (
            <Card key={n.id} className={cn("hover:shadow-sm transition-shadow", !n.isRead && "border-primary/30 bg-primary/5")}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                  n.type === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                  n.type === 'ERROR' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                  n.type === 'WARNING' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                  n.type === 'APPROVAL_UPDATE' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                )}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                </div>
                {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  async function load() {
    try {
      const res = await apiFetch('/api/announcements')
      setAnnouncements(res.announcements)
    } catch {} finally { setLoading(false) }
  }

  if (loading) return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" />)}</div>

  const PRIORITY_COLORS: any = {
    URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    HIGH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    NORMAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground mt-1 text-sm">Official updates from ABUAD administration</p>
      </div>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ScrollText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="font-medium">No announcements</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map(a => (
            <Card key={a.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start gap-3 p-4">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    a.priority === 'URGENT' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                    a.priority === 'HIGH' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  )}>
                    <ScrollText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold">{a.title}</h3>
                      <Badge className={cn("text-[9px]", PRIORITY_COLORS[a.priority])}>{a.priority}</Badge>
                      <Badge variant="outline" className="text-[9px]">{a.audience}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{a.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <span>By {a.author?.firstName} {a.author?.lastName}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export function SupportView() {
  const { user } = useAuthStore()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [submitting, setSubmitting] = useState(false)

  const faqs = [
    { q: 'How do I register for courses?', a: 'Navigate to Course Registration from the sidebar menu. Browse available courses, select those you want to register for, and click Submit when ready. Make sure your school fees are paid and verified first.' },
    { q: 'What is the minimum credit unit requirement?', a: 'The minimum credit units for registration is 15 per semester. The maximum is 24 (or 18 for 500 level students).' },
    { q: 'How long does approval take?', a: 'Registration goes through 4 approval stages: Academic Adviser → Department Coordinator → College Officer → Registry. Each stage typically takes 1-2 business days.' },
    { q: 'Can I modify my registration after submission?', a: 'You cannot modify your registration once submitted. However, if an approver requests modification, you will be notified and given the opportunity to update your courses.' },
    { q: 'What if my payment shows as pending?', a: 'Payment verification is done by the Bursary Department. If your payment has been made but not verified, please allow 24-48 hours or contact the Bursary directly.' },
    { q: 'How do I reset my password?', a: 'Contact the ICT Unit or your department coordinator for password reset assistance.' },
  ]

  async function submitTicket() {
    if (!subject || !description) {
      toast.error('Please fill in all fields')
      return
    }
    setSubmitting(true)
    try {
      // For demo purposes, we just show a success message
      toast.success('Support ticket submitted. We will get back to you shortly.')
      setSubject('')
      setDescription('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground mt-1 text-sm">Get help with the portal or submit a support ticket</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" /> Submit a Ticket
            </CardTitle>
            <CardDescription>Get personalized assistance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="subject" className="text-xs">Subject</Label>
              <Input id="subject" placeholder="Brief description of issue..." value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="registration">Course Registration</SelectItem>
                  <SelectItem value="payment">Payment Issue</SelectItem>
                  <SelectItem value="technical">Technical Problem</SelectItem>
                  <SelectItem value="account">Account Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="desc" className="text-xs">Description</Label>
              <Textarea id="desc" placeholder="Describe your issue in detail..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1" />
            </div>
            <Button className="w-full" onClick={submitTicket} disabled={submitting}>
              <Send className="h-4 w-4 mr-2" /> {submitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
            </CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {faqs.map((faq, i) => (
              <div key={i} className="p-3 rounded-lg border bg-muted/30">
                <p className="font-medium text-sm mb-1">{faq.q}</p>
                <p className="text-xs text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function ResultsView() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/stats?scope=student').then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" />)}</div>
  if (!data) return null

  const { student } = data
  const cgpaClass = student.cgpa >= 4.5 ? 'First Class' : student.cgpa >= 3.5 ? 'Second Class Upper' : student.cgpa >= 2.4 ? 'Second Class Lower' : student.cgpa >= 1.5 ? 'Third Class' : 'Probation'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Results & Academic Performance</h1>
        <p className="text-muted-foreground mt-1 text-sm">{student.matricNumber} · {student.department.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
            <p className="text-xs text-muted-foreground">Current CGPA</p>
            <p className="text-3xl font-bold text-emerald-600">{student.cgpa.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{cgpaClass}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookMarked className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-muted-foreground">Total Units</p>
            <p className="text-3xl font-bold">{student.totalCreditUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-xs text-muted-foreground">Quality Points</p>
            <p className="text-3xl font-bold">{student.totalQualityPoints.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-600" />
            <p className="text-xs text-muted-foreground">Carry Overs</p>
            <p className="text-3xl font-bold">{data.carryOvers}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Standing</CardTitle>
          <CardDescription>Your CGPA progression and class of degree projection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">CGPA (out of 5.00)</span>
                <span className="font-bold">{student.cgpa.toFixed(2)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-abuad-gradient" style={{ width: `${(student.cgpa / 5) * 100}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
              {[
                { label: 'First Class', min: 4.5, color: 'bg-emerald-500' },
                { label: '2nd Upper', min: 3.5, color: 'bg-blue-500' },
                { label: '2nd Lower', min: 2.4, color: 'bg-amber-500' },
                { label: 'Third Class', min: 1.5, color: 'bg-orange-500' },
                { label: 'Probation', min: 0, color: 'bg-red-500' },
              ].map(c => (
                <div key={c.label} className={cn("p-2 rounded-lg text-center text-white text-xs font-medium", c.color, student.cgpa >= c.min ? 'opacity-100' : 'opacity-30')}>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TimetableView() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/stats?scope=student').then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" />)}</div>
  if (!data?.registration) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-medium">No timetable available</p>
          <p className="text-sm text-muted-foreground mt-1">Register for courses to view your timetable</p>
        </CardContent>
      </Card>
    )
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00']

  // Sample timetable from registered courses
  const courses = data.registration.details.map((d: any) => d.course)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Weekly Timetable</h1>
        <p className="text-muted-foreground mt-1 text-sm">{data.student.currentSession?.name} · {data.student.currentSemester?.name === 'FIRST' ? 'First Semester' : 'Second Semester'}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium w-32">Time</th>
                  {days.map(day => <th key={day} className="text-left p-3 font-medium">{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, i) => (
                  <tr key={slot} className="border-t">
                    <td className="p-3 text-xs font-mono text-muted-foreground">{slot}</td>
                    {days.map((day, j) => {
                      const course = courses[(i * 5 + j) % Math.max(courses.length, 1)]
                      const hasClass = (i + j) % 3 === 0 && course
                      return (
                        <td key={day} className="p-2">
                          {hasClass ? (
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                              <p className="font-semibold text-xs">{course.code}</p>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{course.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{course.venue}</p>
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground/40 text-center">—</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registered Courses Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {courses.map((course: any) => (
              <div key={course.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {course.code.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{course.code}</p>
                  <p className="text-xs text-muted-foreground truncate">{course.title}</p>
                </div>
                <Badge variant="outline" className="text-[9px]">{course.venue}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ReportsView() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/stats?scope=super_admin').then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <div key={i} className="h-32 rounded-xl animate-shimmer" />)}</div>
  if (!data) return null

  const reportTypes = [
    { id: 'students', title: 'Student Report', desc: 'Comprehensive list of all students', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'registrations', title: 'Registration Report', desc: 'Course registration statistics', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'payments', title: 'Financial Report', desc: 'Payment and revenue analysis', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { id: 'approvals', title: 'Approval Report', desc: 'Workflow and approval metrics', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'departments', title: 'Department Report', desc: 'Department-wise statistics', icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { id: 'courses', title: 'Course Report', desc: 'Course catalog and enrollment', icon: BookMarked, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  ]

  function exportReport(type: string) {
    // Generate a CSV report
    let csv = ''
    if (type === 'students') {
      csv = 'Report Type: Student Statistics\n'
      csv += `Total Students: ${data.stats.totalStudents}\n`
      csv += `Total Departments: ${data.stats.totalDepartments}\n`
      csv += `Total Colleges: ${data.stats.totalColleges}\n\n`
      csv += 'Students by Level:\n'
      data.charts.studentsByLevel.forEach((s: any) => {
        csv += `${s.name},${s.value}\n`
      })
    } else if (type === 'registrations') {
      csv = 'Report Type: Registration Statistics\n'
      csv += `Total Registrations: ${data.stats.totalRegistrations}\n`
      csv += `Pending: ${data.stats.pendingRegistrations}\n`
      csv += `Approved: ${data.stats.approvedRegistrations}\n`
      csv += `Rejected: ${data.stats.rejectedRegistrations}\n`
      csv += `Draft: ${data.stats.draftRegistrations}\n`
    } else if (type === 'payments') {
      csv = 'Report Type: Financial Report\n'
      csv += `Total Revenue: ₦${data.stats.totalRevenue}\n`
      csv += `Verified: ₦${data.stats.verifiedRevenue}\n`
      csv += `Pending: ₦${data.stats.pendingRevenue}\n`
    } else {
      csv = `Report Type: ${type}\nGenerated: ${new Date().toISOString()}\n`
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `abuad-${type}-report-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported successfully')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">Generate and export comprehensive reports</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{data.stats.totalStudents}</p>
            <p className="text-[10px] text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
            <p className="text-2xl font-bold">{data.stats.totalCourses}</p>
            <p className="text-[10px] text-muted-foreground">Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-purple-600" />
            <p className="text-2xl font-bold">{data.stats.approvedRegistrations}</p>
            <p className="text-[10px] text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="h-6 w-6 mx-auto mb-1 text-amber-600" />
            <p className="text-2xl font-bold">₦{(data.stats.verifiedRevenue / 1000000).toFixed(1)}M</p>
            <p className="text-[10px] text-muted-foreground">Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-cyan-600" />
            <p className="text-2xl font-bold">{data.stats.totalDepartments}</p>
            <p className="text-[10px] text-muted-foreground">Depts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookMarked className="h-6 w-6 mx-auto mb-1 text-pink-600" />
            <p className="text-2xl font-bold">{data.stats.totalColleges}</p>
            <p className="text-[10px] text-muted-foreground">Colleges</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Registrations by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.charts.registrationsByStatus}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.charts.registrationsByStatus.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Students by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.charts.studentsByLevel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                  {data.charts.studentsByLevel.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Generate Report</CardTitle>
          <CardDescription>Export detailed reports in CSV format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportTypes.map(r => (
              <Card key={r.id} className="cursor-pointer hover:border-primary/30 hover:shadow-md transition-all" onClick={() => exportReport(r.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0", r.bg)}>
                      <r.icon className={cn("h-5 w-5", r.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{r.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.desc}</p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-primary">
                        <Download className="h-3 w-3" /> Export CSV
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function SettingsView() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch('/api/stats?scope=student').then(res => setProfile(res.student)).catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await apiFetch('/api/students', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: user?.firstName,
          lastName: user?.lastName,
          phone: profile?.user?.phone,
          address: profile?.address,
          stateOfOrigin: profile?.stateOfOrigin,
          lga: profile?.lga,
          maritalStatus: profile?.maritalStatus,
          emergencyContact: profile?.emergencyContact,
          emergencyPhone: profile?.emergencyPhone,
          parentName: profile?.parentName,
          parentPhone: profile?.parentPhone,
        })
      })
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" />)}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Settings & Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account and personal information</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">First Name</Label>
                  <Input value={user?.firstName || ''} readOnly className="mt-1 bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs">Last Name</Label>
                  <Input value={user?.lastName || ''} readOnly className="mt-1 bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={user?.email || ''} readOnly className="mt-1 bg-muted/30" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={profile.user?.phone || ''}
                    onChange={(e) => setProfile({ ...profile, user: { ...profile.user, phone: e.target.value } })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">State of Origin</Label>
                  <Input
                    value={profile.stateOfOrigin || ''}
                    onChange={(e) => setProfile({ ...profile, stateOfOrigin: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">LGA</Label>
                  <Input
                    value={profile.lga || ''}
                    onChange={(e) => setProfile({ ...profile, lga: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Marital Status</Label>
                  <Input
                    value={profile.maritalStatus || ''}
                    onChange={(e) => setProfile({ ...profile, maritalStatus: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input
                    value={profile.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Contact Name</Label>
                    <Input
                      value={profile.emergencyContact || ''}
                      onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Contact Phone</Label>
                    <Input
                      value={profile.emergencyPhone || ''}
                      onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Parent / Guardian</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Parent Name</Label>
                    <Input
                      value={profile.parentName || ''}
                      onChange={(e) => setProfile({ ...profile, parentName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Parent Phone</Label>
                    <Input
                      value={profile.parentPhone || ''}
                      onChange={(e) => setProfile({ ...profile, parentPhone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground mt-1">Last changed: Never</p>
                <Button variant="outline" size="sm" className="mt-2">Change Password</Button>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground mt-1">Add an extra layer of security</p>
                <Button variant="outline" size="sm" className="mt-2">Enable 2FA</Button>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-xs text-muted-foreground mt-1">Manage devices logged into your account</p>
                <Button variant="outline" size="sm" className="mt-2">View Sessions</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your portal experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive email updates about your account</p>
                </div>
                <Button variant="outline" size="sm">Enabled</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive SMS alerts (future feature)</p>
                </div>
                <Button variant="outline" size="sm" disabled>Coming Soon</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-xs text-muted-foreground">Portal display language</p>
                </div>
                <Button variant="outline" size="sm">English</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
