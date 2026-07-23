'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search, BookOpen, Layers, Calendar, MapPin, User, Filter,
  ChevronRight, X, GraduationCap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api-client'
import { COURSE_TYPES, LEVELS, SEMESTERS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([])
  const [colleges, setColleges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)

  const [search, setSearch] = useState('')
  const [filterCollege, setFilterCollege] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterSemester, setFilterSemester] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [coursesRes, collegesRes] = await Promise.all([
        apiFetch('/api/courses?limit=500'),
        apiFetch('/api/colleges')
      ])
      setCourses(coursesRes.courses)
      setColleges(collegesRes.colleges)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const departments = useMemo(() => {
    const college = colleges.find(c => c.id === filterCollege)
    return college?.departments || []
  }, [colleges, filterCollege])

  const filtered = useMemo(() => {
    return courses.filter(c => {
      if (search && !c.code.toLowerCase().includes(search.toLowerCase()) && !c.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterCollege !== 'all' && c.collegeId !== filterCollege) return false
      if (filterDept !== 'all' && c.departmentId !== filterDept) return false
      if (filterLevel !== 'all' && c.level !== filterLevel) return false
      if (filterType !== 'all' && c.courseType !== filterType) return false
      if (filterSemester !== 'all' && c.semester !== filterSemester) return false
      return true
    })
  }, [courses, search, filterCollege, filterDept, filterLevel, filterType, filterSemester])

  if (loading) {
    return <div className="space-y-4">{Array.from({length: 4}).map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Course Catalog</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse all available courses across colleges and departments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Core Courses</p>
                <p className="text-2xl font-bold text-emerald-600">{courses.filter(c => c.courseType === 'CORE').length}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Electives</p>
                <p className="text-2xl font-bold text-amber-600">{courses.filter(c => c.courseType === 'ELECTIVE').length}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Layers className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">GST Courses</p>
                <p className="text-2xl font-bold text-purple-600">{courses.filter(c => c.courseType === 'GST').length}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Select value={filterCollege} onValueChange={(v) => { setFilterCollege(v); setFilterDept('all') }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Colleges" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterDept} onValueChange={setFilterDept} disabled={filterCollege === 'all'}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Levels" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {COURSE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Semesters" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {SEMESTERS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 60).map(course => {
          const typeInfo = COURSE_TYPES.find(t => t.value === course.courseType)
          return (
            <Card key={course.id} className="cursor-pointer hover:border-primary/30 hover:shadow-md transition-all" onClick={() => setSelectedCourse(course)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{course.code}</span>
                    {typeInfo && <Badge className={cn("text-[9px] py-0", typeInfo.color)}>{typeInfo.label}</Badge>}
                  </div>
                  <Badge variant="outline" className="text-[9px]">{course.creditUnits}U</Badge>
                </div>
                <p className="text-sm font-medium line-clamp-2">{course.title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {course.level.replace('LEVEL_', '')}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {course.semester === 'FIRST' ? '1st Sem' : '2nd Sem'}</span>
                  {course.department && <span className="truncate">· {course.department.code}</span>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="font-medium">No courses found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Course Detail Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-2xl">
          {selectedCourse && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedCourse.code}</Badge>
                  <Badge className={cn("text-[10px]", COURSE_TYPES.find(t => t.value === selectedCourse.courseType)?.color)}>
                    {COURSE_TYPES.find(t => t.value === selectedCourse.courseType)?.label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{selectedCourse.creditUnits} Credit Units</Badge>
                </div>
                <DialogTitle className="text-xl mt-2">{selectedCourse.title}</DialogTitle>
                <DialogDescription>{selectedCourse.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">College</p>
                    <p className="font-semibold text-sm">{selectedCourse.college?.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-semibold text-sm">{selectedCourse.department?.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="font-semibold text-sm">{selectedCourse.level.replace('LEVEL_', '')} Level</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Semester</p>
                    <p className="font-semibold text-sm">{selectedCourse.semester === 'FIRST' ? 'First Semester' : 'Second Semester'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lecturer</p>
                      <p className="text-sm font-medium">{selectedCourse.lecturer || 'TBD'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Venue</p>
                      <p className="text-sm font-medium">{selectedCourse.venue || 'TBD'}</p>
                    </div>
                  </div>
                </div>

                {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Prerequisites</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourse.prerequisites.map((p: any) => (
                        <Badge key={p.id} variant="outline" className="text-xs">
                          {p.prerequisite.code} - {p.prerequisite.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCourse.offerings && selectedCourse.offerings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Schedule</p>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <pre className="text-xs whitespace-pre-wrap">
                        {selectedCourse.offerings[0].timetable ? JSON.stringify(JSON.parse(selectedCourse.offerings[0].timetable), null, 2) : 'No schedule available'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
