'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Search, Users, Filter, ChevronRight, Mail, Phone, GraduationCap,
  Building2, BookOpen, Download
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { LEVELS, REGISTRATION_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function StudentsView() {
  const [students, setStudents] = useState<any[]>([])
  const [colleges, setColleges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  const [search, setSearch] = useState('')
  const [filterCollege, setFilterCollege] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => { loadData() }, [search, filterCollege, filterDept, filterLevel, page])

  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterCollege !== 'all') params.set('collegeId', filterCollege)
      if (filterDept !== 'all') params.set('departmentId', filterDept)
      if (filterLevel !== 'all') params.set('level', filterLevel)
      params.set('page', String(page))
      params.set('limit', '50')

      const [studentsRes, collegesRes] = await Promise.all([
        apiFetch(`/api/students?${params}`),
        apiFetch('/api/colleges')
      ])
      setStudents(studentsRes.students)
      setColleges(collegesRes.colleges)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const departments = useMemo(() => {
    const college = colleges.find(c => c.id === filterCollege)
    return college?.departments || []
  }, [colleges, filterCollege])

  function exportCSV() {
    const headers = ['Matric Number', 'Name', 'Email', 'College', 'Department', 'Level', 'CGPA', 'Status']
    const rows = students.map(s => [
      s.matricNumber,
      `${s.user.firstName} ${s.user.lastName}`,
      s.user.email,
      s.college?.name || '',
      s.department?.name || '',
      s.level.replace('LEVEL_', ''),
      s.cgpa,
      s.registrationStatus
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `abuad-students-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Students Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm">View and manage student records</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, matric number, or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={filterCollege} onValueChange={(v) => { setFilterCollege(v); setFilterDept('all'); setPage(1) }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Colleges" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterDept} onValueChange={(v) => { setFilterDept(v); setPage(1) }} disabled={filterCollege === 'all'}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterLevel} onValueChange={(v) => { setFilterLevel(v); setPage(1) }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Levels" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {loading ? (
        <div className="space-y-2">{Array.from({length: 5}).map((_, i) => <div key={i} className="h-16 rounded-xl animate-shimmer" />)}</div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="font-medium">No students found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map(student => {
            const statusInfo = REGISTRATION_STATUSES.find(s => s.value === student.registrationStatus)
            const initials = `${student.user.firstName[0]}${student.user.lastName[0]}`.toUpperCase()
            return (
              <Card key={student.id} className="cursor-pointer hover:border-primary/30 hover:shadow-md transition-all" onClick={() => setSelectedStudent(student)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{student.user.firstName} {student.user.lastName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{student.matricNumber}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {statusInfo && <Badge className={cn("text-[9px] py-0", statusInfo.color)}>{statusInfo.label}</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {student.college?.code}</span>
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {student.department?.code}</span>
                        <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {student.level.replace('LEVEL_', '')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Student Detail */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle>Student Profile</DialogTitle>
                <DialogDescription>{selectedStudent.matricNumber}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {selectedStudent.user.firstName[0]}{selectedStudent.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedStudent.user.firstName} {selectedStudent.user.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedStudent.matricNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{selectedStudent.level.replace('LEVEL_', '')} Level</Badge>
                      <Badge variant="outline">{selectedStudent.programme?.name}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">College</p>
                    <p className="font-semibold text-sm">{selectedStudent.college?.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-semibold text-sm">{selectedStudent.department?.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-sm truncate">{selectedStudent.user.email}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium text-sm">{selectedStudent.user.phone || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Current CGPA</p>
                    <p className="font-bold text-lg text-emerald-600">{selectedStudent.cgpa.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Credit Units</p>
                    <p className="font-bold text-lg">{selectedStudent.totalCreditUnits}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">State of Origin</p>
                    <p className="font-medium text-sm">{selectedStudent.stateOfOrigin || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="font-medium text-sm">{selectedStudent.gender || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-2">Registration Status</p>
                  {(() => {
                    const statusInfo = REGISTRATION_STATUSES.find(s => s.value === selectedStudent.registrationStatus)
                    return statusInfo ? <Badge className={cn("text-xs", statusInfo.color)}>{statusInfo.label}</Badge> : null
                  })()}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
