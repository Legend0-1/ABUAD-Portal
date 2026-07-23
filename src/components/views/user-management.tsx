'use client'

import { useState, useEffect } from 'react'
import { UserCog, Search, Plus, Shield, Mail, MoreVertical, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth-store'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export function UserManagementView() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    try {
      // For now, we'll get users via students endpoint and admin accounts
      const [studentsRes] = await Promise.all([
        apiFetch('/api/students?limit=100'),
      ])
      // Combine with admin info from stats endpoint
      const allUsers = studentsRes.students.map((s: any) => ({
        id: s.user.id,
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        email: s.user.email,
        role: s.user.role,
        status: s.user.status,
        lastLoginAt: s.user.lastLoginAt,
        student: s,
      }))
      setUsers(allUsers)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filtered = users.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false
    if (search) {
      const term = search.toLowerCase()
      if (!u.email.toLowerCase().includes(term) &&
          !`${u.firstName} ${u.lastName}`.toLowerCase().includes(term)) return false
    }
    return true
  })

  if (loading) return <div className="space-y-4">{Array.from({length: 4}).map((_, i) => <div key={i} className="h-16 rounded-xl animate-shimmer" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage all portal users and their roles</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add New User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ROLE_LABELS).slice(0, 4).map(([role, label]) => {
          const count = users.filter(u => u.role === role).length
          return (
            <Card key={role}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", ROLE_COLORS[role as keyof typeof ROLE_COLORS])}>
                    <Users className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Last Login</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 50).map(u => (
                    <tr key={u.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {u.firstName[0]}{u.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={cn("text-[10px]", ROLE_COLORS[u.role as keyof typeof ROLE_COLORS])}>
                          {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={u.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {u.lastLoginAt ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true }) : 'Never'}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
