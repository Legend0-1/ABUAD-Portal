'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, BookOpen, ChevronRight, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api-client'

export function CollegesView() {
  const [colleges, setColleges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/colleges').then(res => setColleges(res.colleges)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <div key={i} className="h-32 rounded-xl animate-shimmer" />)}</div>

  const totalStudents = colleges.reduce((s, c) => s + c._count.students, 0)
  const totalCourses = colleges.reduce((s, c) => s + c._count.courses, 0)
  const totalDepts = colleges.reduce((s, c) => s + c.departments.length, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Colleges & Departments</h1>
        <p className="text-muted-foreground mt-1 text-sm">Academic structure of ABUAD</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Colleges" value={colleges.length} icon={Building2} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard label="Departments" value={totalDepts} icon={Layers} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard label="Total Students" value={totalStudents} icon={Users} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20" />
        <StatCard label="Total Courses" value={totalCourses} icon={BookOpen} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-900/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {colleges.map(college => (
          <Card key={college.id} className="overflow-hidden">
            <CardHeader className="bg-abuad-gradient text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{college.name}</CardTitle>
                  <CardDescription className="text-white/80">Code: {college.code}</CardDescription>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="p-2 rounded-lg bg-muted/40">
                  <p className="text-[10px] text-muted-foreground">Departments</p>
                  <p className="text-xl font-bold">{college.departments.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/40">
                  <p className="text-[10px] text-muted-foreground">Students</p>
                  <p className="text-xl font-bold">{college._count.students}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/40">
                  <p className="text-[10px] text-muted-foreground">Courses</p>
                  <p className="text-xl font-bold">{college._count.courses}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Departments</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {college.departments.map(dept => (
                    <div key={dept.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{dept.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{dept.code}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px]">{dept.code}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
