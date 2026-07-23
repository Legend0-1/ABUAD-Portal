'use client'

import { useState, useEffect } from 'react'
import { History, Search, User, Activity, Filter, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { format } from 'date-fns'

const CATEGORY_COLORS: Record<string, string> = {
  AUTH: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REGISTRATION: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  APPROVAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  PAYMENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PROFILE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  ADMIN_ACTION: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  COURSE_MANAGEMENT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
}

export function AuditView() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadLogs() }, [filter])

  async function loadLogs() {
    try {
      const url = filter !== 'all' ? `/api/audit?category=${filter}` : '/api/audit'
      const res = await apiFetch(url)
      setLogs(res.logs)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const filtered = logs.filter(l => {
    if (search) {
      const term = search.toLowerCase()
      if (!l.description.toLowerCase().includes(term) &&
          !l.action.toLowerCase().includes(term) &&
          !`${l.user?.firstName} ${l.user?.lastName}`.toLowerCase().includes(term)) return false
    }
    return true
  })

  function exportCSV() {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Category', 'Description', 'IP Address']
    const rows = filtered.map(l => [
      format(new Date(l.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System',
      l.user?.role || '',
      l.action,
      l.category,
      l.description,
      l.ipAddress || ''
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit logs exported')
  }

  if (loading) return <div className="space-y-4">{Array.from({length: 4}).map((_, i) => <div key={i} className="h-16 rounded-xl animate-shimmer" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground mt-1 text-sm">Complete activity log of all system actions</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export Logs
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, user, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="AUTH">Authentication</SelectItem>
            <SelectItem value="REGISTRATION">Registration</SelectItem>
            <SelectItem value="APPROVAL">Approval</SelectItem>
            <SelectItem value="PAYMENT">Payment</SelectItem>
            <SelectItem value="PROFILE">Profile</SelectItem>
            <SelectItem value="ADMIN_ACTION">Admin Actions</SelectItem>
            <SelectItem value="COURSE_MANAGEMENT">Course Mgmt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No audit logs found</p>
              </div>
            ) : (
              filtered.slice(0, 100).map(log => (
                <div key={log.id} className="p-3 hover:bg-muted/30 transition-colors flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {log.user ? `${log.user.firstName[0]}${log.user.lastName[0]}` : 'SY'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-medium">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                        <span className="text-xs text-muted-foreground ml-2 font-normal">{log.user?.role?.replace(/_/g, ' ').toLowerCase()}</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[9px] ${CATEGORY_COLORS[log.category] || ''}`}>
                        {log.category.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">{log.action}</span>
                      {log.ipAddress && log.ipAddress !== 'unknown' && (
                        <span className="text-[10px] font-mono text-muted-foreground">{log.ipAddress}</span>
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
  )
}
