'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, BookOpen, Plus, Trash2, Save, Send, Download,
  AlertCircle, CheckCircle2, Clock, X, FileText, Info, BookMarked,
  Layers, Calendar, MapPin, User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { COURSE_TYPES, LEVELS, SEMESTERS, MIN_CREDIT_UNITS, MAX_CREDIT_UNITS, MAX_CREDIT_UNITS_500 } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'

export function CourseRegistration() {
  const { user } = useAuthStore()
  const [student, setStudent] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourses, setSelectedCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterSemester, setFilterSemester] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [statsRes, coursesRes] = await Promise.all([
        apiFetch('/api/stats?scope=student'),
        apiFetch('/api/courses?limit=200')
      ])
      setStudent(statsRes.student)
      setCourses(coursesRes.courses)
      if (statsRes.registration) {
        const coursesById = new Map(coursesRes.courses.map((c: any) => [c.id, c]))
        setSelectedCourses(statsRes.registration.details.map((d: any) => coursesById.get(d.courseId) || d.course).filter(Boolean))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (search && !c.code.toLowerCase().includes(search.toLowerCase()) && !c.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterLevel !== 'all' && c.level !== filterLevel) return false
      if (filterType !== 'all' && c.courseType !== filterType) return false
      if (filterSemester !== 'all' && c.semester !== filterSemester) return false
      return true
    })
  }, [courses, search, filterLevel, filterType, filterSemester])

  const totalUnits = selectedCourses.reduce((s, c) => s + c.creditUnits, 0)
  const coreUnits = selectedCourses.filter(c => c.courseType === 'CORE').reduce((s, c) => s + c.creditUnits, 0)
  const electiveUnits = selectedCourses.filter(c => c.courseType === 'ELECTIVE').reduce((s, c) => s + c.creditUnits, 0)
  const gstUnits = selectedCourses.filter(c => c.courseType === 'GST').reduce((s, c) => s + c.creditUnits, 0)

  const maxUnits = student?.level === 'LEVEL_500' ? MAX_CREDIT_UNITS_500 : MAX_CREDIT_UNITS
  const exceedsMax = totalUnits > maxUnits
  const belowMin = totalUnits < MIN_CREDIT_UNITS
  const registrationLocked = student?.registrationStatus === 'APPROVED' || student?.registrationStatus === 'PENDING_REGISTRY'

  function toggleCourse(course: any) {
    if (registrationLocked) return
    setSelectedCourses(prev => {
      const exists = prev.find(c => c.id === course.id)
      if (exists) return prev.filter(c => c.id !== course.id)
      return [...prev, course]
    })
  }

  async function handleSave(action: 'save_draft' | 'submit') {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course')
      return
    }
    if (action === 'submit' && belowMin) {
      toast.error(`Minimum ${MIN_CREDIT_UNITS} credit units required`)
      return
    }
    if (exceedsMax) {
      toast.error(`Maximum ${maxUnits} credit units exceeded`)
      return
    }

    setSubmitting(true)
    try {
      const res = await apiFetch('/api/registrations', {
        method: 'POST',
        body: JSON.stringify({
          courseIds: selectedCourses.map(c => c.id),
          action,
        })
      })
      toast.success(res.message)
      if (action === 'submit') {
        // Reload to reflect changes
        await loadData()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save registration')
    } finally {
      setSubmitting(false)
      setShowConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-xl animate-shimmer" />
          <div className="h-96 rounded-xl animate-shimmer" />
        </div>
      </div>
    )
  }

  if (!student) return <div>Student profile not found</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Course Registration</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {student.currentSession?.name} · {student.currentSemester?.name === 'FIRST' ? 'First Semester' : 'Second Semester'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={registrationLocked || submitting} onClick={() => handleSave('save_draft')}>
            <Save className="h-4 w-4 mr-2" /> Save Draft
          </Button>
          <Button size="sm" disabled={registrationLocked || submitting} onClick={() => setShowConfirm(true)}>
            <Send className="h-4 w-4 mr-2" /> Submit Registration
          </Button>
        </div>
      </div>

      {/* Payment Status Alert */}
      {student && (
        <PaymentAlert student={student} />
      )}

      {/* Validation Alerts */}
      {exceedsMax && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Credit Limit Exceeded</AlertTitle>
          <AlertDescription>
            You have selected {totalUnits} credit units, but the maximum allowed is {maxUnits}. Please remove some courses.
          </AlertDescription>
        </Alert>
      )}

      {registrationLocked && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Registration Locked</AlertTitle>
          <AlertDescription>
            Your registration is currently in approval workflow or has been approved. Modifications are not permitted at this stage.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Catalog */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by course code or title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {COURSE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterSemester} onValueChange={setFilterSemester}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Semesters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      {SEMESTERS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCourses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="font-medium">No courses found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            ) : (
              filteredCourses.slice(0, 50).map(course => {
                const isSelected = selectedCourses.some(c => c.id === course.id)
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    selected={isSelected}
                    onToggle={() => toggleCourse(course)}
                    disabled={registrationLocked}
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Selected Courses Summary */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookMarked className="h-4 w-4" />
                Selected Courses
                <Badge variant="secondary" className="ml-auto">{selectedCourses.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Credit Units Progress</span>
                  <span className={cn("font-bold", exceedsMax ? "text-red-600" : belowMin ? "text-amber-600" : "text-emerald-600")}>
                    {totalUnits} / {maxUnits}
                  </span>
                </div>
                <Progress
                  value={(totalUnits / maxUnits) * 100}
                  className="h-2"
                />
                {belowMin && (
                  <p className="text-[10px] text-amber-600 mt-1">Min: {MIN_CREDIT_UNITS} units required to submit</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-[10px] text-muted-foreground">Core</p>
                  <p className="text-base font-bold text-emerald-600">{coreUnits}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-[10px] text-muted-foreground">Elective</p>
                  <p className="text-base font-bold text-amber-600">{electiveUnits}</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-[10px] text-muted-foreground">GST</p>
                  <p className="text-base font-bold text-purple-600">{gstUnits}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedCourses.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No courses selected
                  </div>
                ) : (
                  <AnimatePresence>
                    {selectedCourses.map(course => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{course.code}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{course.title}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{course.creditUnits}U</Badge>
                        {!registrationLocked && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => toggleCourse(course)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  disabled={registrationLocked || submitting || selectedCourses.length === 0}
                  onClick={() => handleSave('save_draft')}
                >
                  <Save className="h-4 w-4 mr-2" /> Save as Draft
                </Button>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={registrationLocked || submitting || selectedCourses.length === 0 || belowMin}
                  onClick={() => setShowConfirm(true)}
                >
                  <Send className="h-4 w-4 mr-2" /> Submit for Approval
                </Button>
              </div>

              <div className="text-[10px] text-muted-foreground space-y-1 pt-2 border-t">
                <p className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Min {MIN_CREDIT_UNITS} units to submit</p>
                <p className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> Max {maxUnits} units allowed</p>
                <p className="flex items-center gap-1"><Info className="h-3 w-3 text-blue-500" /> Prerequisites will be checked</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Confirm Registration Submission
            </DialogTitle>
            <DialogDescription>
              You are about to submit your course registration for adviser approval. This will start the approval workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Courses</span>
                <span className="font-semibold">{selectedCourses.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Credit Units</span>
                <span className="font-semibold">{totalUnits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approval Flow</span>
                <span className="font-semibold text-xs">Adviser → Coord → College → Registry</span>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Once submitted, you cannot modify your course selection until approved or modification is requested.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={() => handleSave('submit')} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Confirm & Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PaymentAlert({ student }: { student: any }) {
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    apiFetch('/api/payments').then(res => setPayments(res.payments)).catch(() => {})
  }, [])

  const unpaid = payments.filter(p => p.status !== 'VERIFIED')

  if (unpaid.length === 0) return null

  const total = unpaid.reduce((s, p) => s + p.amount, 0)

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Payment Verification Required</AlertTitle>
      <AlertDescription>
        You have {unpaid.length} unpaid fee(s) totaling ₦{total.toLocaleString()}. Course registration requires all fees to be verified.
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unpaid.map(p => (
            <Badge key={p.id} variant="outline" className="text-[10px] bg-red-50 dark:bg-red-900/20">
              {p.feeType.replace(/_/g, ' ')}: ₦{p.amount.toLocaleString()}
            </Badge>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}

function CourseCard({ course, selected, onToggle, disabled }: { course: any; selected: boolean; onToggle: () => void; disabled: boolean }) {
  const typeInfo = COURSE_TYPES.find(t => t.value === course.courseType)

  return (
    <Card className={cn("transition-all cursor-pointer hover:border-primary/30", selected && "border-primary bg-primary/5", disabled && "opacity-60 cursor-not-allowed")} onClick={disabled ? undefined : onToggle}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Checkbox checked={selected} disabled={disabled} className="mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm">{course.code}</span>
                  {typeInfo && <Badge className={cn("text-[9px] py-0", typeInfo.color)}>{typeInfo.label}</Badge>
                  }
                  <Badge variant="outline" className="text-[9px] py-0">{course.creditUnits} Units</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{course.title}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {course.level.replace('LEVEL_', '')} Level</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {course.semester === 'FIRST' ? '1st Sem' : '2nd Sem'}</span>
                  {course.lecturer && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {course.lecturer}</span>}
                  {course.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {course.venue}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
