'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileCheck, CheckCircle2, XCircle, Clock, MessageSquare, ChevronRight,
  User, Mail, Phone, Building2, BookOpen, AlertCircle, Filter, Search,
  ArrowRight, History
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { REGISTRATION_STATUSES, APPROVAL_STAGES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'
import { formatDistanceToNow } from 'date-fns'

export function ApprovalsView() {
  const { user } = useAuthStore()
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReg, setSelectedReg] = useState<any>(null)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')

  useEffect(() => { loadRegistrations() }, [])

  async function loadRegistrations() {
    try {
      const res = await apiFetch('/api/registrations')
      setRegistrations(res.registrations)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const filtered = registrations.filter(r => {
    if (search) {
      const term = search.toLowerCase()
      if (!r.student?.matricNumber?.toLowerCase().includes(term) &&
          !`${r.student?.user?.firstName} ${r.student?.user?.lastName}`.toLowerCase().includes(term)) return false
    }
    if (filter === 'pending') return ['PENDING_ADVISER', 'PENDING_COORDINATOR', 'PENDING_COLLEGE', 'PENDING_REGISTRY'].includes(r.status)
    if (filter === 'approved') return r.status === 'APPROVED'
    if (filter === 'rejected') return r.status === 'REJECTED'
    return true
  })

  const pendingCount = registrations.filter(r => ['PENDING_ADVISER', 'PENDING_COORDINATOR', 'PENDING_COLLEGE', 'PENDING_REGISTRY'].includes(r.status)).length

  if (loading) {
    return <div className="space-y-4">{Array.from({length: 3}).map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Course Approval Workflow</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {pendingCount} registration(s) pending your approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or matric..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Approval Stage Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {APPROVAL_STAGES.map((stage, i) => {
          const count = registrations.filter(r => r.status === `PENDING_${stage.value === 'ADVISER' ? 'ADVISER' : stage.value === 'COORDINATOR' ? 'COORDINATOR' : stage.value === 'COLLEGE_OFFICER' ? 'COLLEGE' : 'REGISTRY'}`).length
          return (
            <Card key={stage.value}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <Badge variant="secondary" className="font-bold">{count}</Badge>
                </div>
                <p className="text-sm font-semibold">{stage.label}</p>
                <p className="text-[10px] text-muted-foreground">Stage {i + 1}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-medium">No registrations found</p>
                <p className="text-sm text-muted-foreground mt-1">All caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(reg => (
                <RegistrationCard
                  key={reg.id}
                  registration={reg}
                  onView={() => setSelectedReg(reg)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedReg && (
            <RegistrationDetail
              registration={selectedReg}
              onClose={() => setSelectedReg(null)}
              onAction={() => {
                loadRegistrations()
                setSelectedReg(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RegistrationCard({ registration, onView }: { registration: any; onView: () => void }) {
  const statusInfo = REGISTRATION_STATUSES.find(s => s.value === registration.status)
  const initials = `${registration.student?.user?.firstName[0] || ''}${registration.student?.user?.lastName[0] || ''}`.toUpperCase()

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-semibold">{registration.student?.user?.firstName} {registration.student?.user?.lastName}</p>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs font-mono">{registration.student?.matricNumber}</span>
              {statusInfo && <Badge className={cn("text-[10px]", statusInfo.color)}>{statusInfo.label}</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {registration.student?.college?.code}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> {registration.student?.department?.code}
              </span>
              <span className="flex items-center gap-1">
                <FileCheck className="h-3 w-3" /> {registration.details?.length} courses · {registration.totalUnits} units
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {registration.submittedAt ? formatDistanceToNow(new Date(registration.submittedAt), { addSuffix: true }) : 'Not submitted'}
              </span>
            </div>

            {/* Approval Progress */}
            <div className="flex items-center gap-1 mt-3">
              {APPROVAL_STAGES.map((stage, i) => {
                const stageStatus = getStageStatus(registration.status, stage.value)
                return (
                  <div key={stage.value} className="flex items-center">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      stageStatus === 'done' && "bg-emerald-500",
                      stageStatus === 'current' && "bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/40",
                      stageStatus === 'pending' && "bg-muted-foreground/30"
                    )} />
                    {i < APPROVAL_STAGES.length - 1 && <div className="w-8 h-0.5 bg-muted" />}
                  </div>
                )
              })}
            </div>
          </div>
          <Button variant="ghost" size="sm">
            Review <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RegistrationDetail({ registration, onClose, onAction }: { registration: any; onClose: () => void; onAction: () => void }) {
  const { user } = useAuthStore()
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'MODIFICATION_REQUESTED'>('APPROVED')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Determine current stage
  const currentStage = APPROVAL_STAGES.find(s => `PENDING_${s.value === 'ADVISER' ? 'ADVISER' : s.value === 'COORDINATOR' ? 'COORDINATOR' : s.value === 'COLLEGE_OFFICER' ? 'COLLEGE' : 'REGISTRY'}` === registration.status)
  const canAct = !!currentStage && ['ACADEMIC_ADVISER', 'DEPARTMENT_COORDINATOR', 'COLLEGE_OFFICER', 'REGISTRY', 'SUPER_ADMIN'].includes(user?.role || '')

  async function handleAction() {
    setSubmitting(true)
    try {
      await apiFetch('/api/approvals', {
        method: 'POST',
        body: JSON.stringify({
          registrationId: registration.id,
          decision,
          comment,
          stage: currentStage?.value,
        })
      })
      toast.success(`Registration ${decision.toLowerCase().replace('_', ' ')}`)
      onAction()
    } catch (err: any) {
      toast.error(err.message || 'Failed to process approval')
    } finally {
      setSubmitting(false)
    }
  }

  const initials = `${registration.student?.user?.firstName[0] || ''}${registration.student?.user?.lastName[0] || ''}`.toUpperCase()

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Registration Review
        </DialogTitle>
        <DialogDescription>
          Review and approve course registration
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Student Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{registration.student?.user?.firstName} {registration.student?.user?.lastName}</p>
            <p className="text-sm text-muted-foreground font-mono">{registration.student?.matricNumber}</p>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {registration.student?.college?.name}</span>
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {registration.student?.department?.name}</span>
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {registration.student?.user?.email}</span>
            </div>
          </div>
        </div>

        {/* Approval Workflow Status */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Approval Workflow</p>
          <div className="grid grid-cols-4 gap-2">
            {APPROVAL_STAGES.map((stage, i) => {
              const stageStatus = getStageStatus(registration.status, stage.value)
              const stageApproval = registration.approvals?.find((a: any) => a.stage === stage.value)
              return (
                <div key={stage.value} className={cn(
                  "p-2 rounded-lg border text-center",
                  stageStatus === 'done' && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
                  stageStatus === 'current' && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                  stageStatus === 'pending' && "border-muted"
                )}>
                  <div className={cn(
                    "h-7 w-7 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold",
                    stageStatus === 'done' && "bg-emerald-500 text-white",
                    stageStatus === 'current' && "bg-blue-500 text-white",
                    stageStatus === 'pending' && "bg-muted text-muted-foreground"
                  )}>
                    {stageStatus === 'done' ? '✓' : i + 1}
                  </div>
                  <p className="text-[10px] font-medium">{stage.label}</p>
                  {stageApproval && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {stageApproval.approver?.firstName} {stageApproval.approver?.lastName}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Course List */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Registered Courses ({registration.details?.length})
          </p>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Code</th>
                  <th className="text-left p-2 font-medium">Title</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-center p-2 font-medium">Units</th>
                </tr>
              </thead>
              <tbody>
                {registration.details?.map((d: any) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{d.course?.code}</td>
                    <td className="p-2">{d.course?.title}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-[9px]">{d.course?.courseType}</Badge>
                    </td>
                    <td className="p-2 text-center font-semibold">{d.course?.creditUnits}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 border-t">
                <tr>
                  <td colSpan={3} className="p-2 font-semibold text-right">Total Credit Units:</td>
                  <td className="p-2 text-center font-bold">{registration.totalUnits}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Previous Approval Comments */}
        {registration.approvals && registration.approvals.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Approval History</p>
            <div className="space-y-2">
              {registration.approvals.map((a: any) => (
                <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0",
                    a.decision === 'APPROVED' ? "bg-emerald-500 text-white" :
                    a.decision === 'REJECTED' ? "bg-red-500 text-white" :
                    "bg-amber-500 text-white"
                  )}>
                    {a.decision === 'APPROVED' ? <CheckCircle2 className="h-4 w-4" /> :
                     a.decision === 'REJECTED' ? <XCircle className="h-4 w-4" /> :
                     <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{a.approver?.firstName} {a.approver?.lastName}</span>
                      <Badge variant="outline" className="text-[9px]">{a.stage.replace(/_/g, ' ')}</Badge>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                    </div>
                    {a.comment && <p className="text-xs text-muted-foreground mt-1">{a.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Form */}
        {canAct && (
          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">Your Decision ({currentStage?.label})</p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={decision === 'APPROVED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDecision('APPROVED')}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                </Button>
                <Button
                  variant={decision === 'MODIFICATION_REQUESTED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDecision('MODIFICATION_REQUESTED')}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> Request Modification
                </Button>
                <Button
                  variant={decision === 'REJECTED' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setDecision('REJECTED')}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
              <div>
                <Label htmlFor="comment" className="text-xs">Comment {decision !== 'APPROVED' && '(Required)'}</Label>
                <Textarea
                  id="comment"
                  placeholder="Add your comment or reason..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button
                  onClick={handleAction}
                  disabled={submitting || (decision !== 'APPROVED' && !comment)}
                  variant={decision === 'REJECTED' ? 'destructive' : 'default'}
                >
                  {submitting ? 'Processing...' : 'Submit Decision'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function getStageStatus(regStatus: string, stage: string): 'done' | 'current' | 'pending' {
  const statusMap: Record<string, number> = {
    'PENDING_ADVISER': 0, 'PENDING_COORDINATOR': 1, 'PENDING_COLLEGE': 2, 'PENDING_REGISTRY': 3, 'APPROVED': 4,
    'REJECTED': -1, 'MODIFICATION_REQUESTED': -2, 'DRAFT': -3, 'NOT_STARTED': -4
  }
  const stageMap: Record<string, number> = {
    'ADVISER': 0, 'COORDINATOR': 1, 'COLLEGE_OFFICER': 2, 'REGISTRY': 3
  }
  const currentIndex = statusMap[regStatus] ?? -1
  const stageIndex = stageMap[stage] ?? -1
  if (currentIndex > stageIndex) return 'done'
  if (currentIndex === stageIndex) return 'current'
  return 'pending'
}
