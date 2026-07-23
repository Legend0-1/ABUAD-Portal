'use client'

import { useState, useEffect } from 'react'
import {
  Wallet, CheckCircle2, XCircle, Clock, Search, Download, Filter,
  Receipt, User, Calendar, DollarSign, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { FEE_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'
import { format } from 'date-fns'

export function PaymentsView() {
  const { user } = useAuthStore()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [verifyDialog, setVerifyDialog] = useState<any>(null)
  const [receiptNo, setReceiptNo] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => { loadPayments() }, [])

  async function loadPayments() {
    try {
      const res = await apiFetch('/api/payments')
      setPayments(res.payments)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const filtered = payments.filter(p => {
    if (filter === 'verified' && p.status !== 'VERIFIED') return false
    if (filter === 'pending' && p.status !== 'PENDING') return false
    if (filter === 'rejected' && p.status !== 'REJECTED') return false
    if (search) {
      const term = search.toLowerCase()
      if (!p.reference?.toLowerCase().includes(term) &&
          !p.student?.matricNumber?.toLowerCase().includes(term) &&
          !`${p.student?.user?.firstName} ${p.student?.user?.lastName}`.toLowerCase().includes(term)) return false
    }
    return true
  })

  const totalVerified = payments.filter(p => p.status === 'VERIFIED').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0)

  async function handleVerify(action: 'verify' | 'reject') {
    if (!verifyDialog) return
    try {
      await apiFetch('/api/payments', {
        method: 'PATCH',
        body: JSON.stringify({
          paymentId: verifyDialog.id,
          action,
          receiptNo,
          comment,
        })
      })
      toast.success(`Payment ${action === 'verify' ? 'verified' : 'rejected'}`)
      setVerifyDialog(null)
      setReceiptNo('')
      setComment('')
      loadPayments()
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify payment')
    }
  }

  const canVerify = ['BURSARY', 'SUPER_ADMIN'].includes(user?.role || '')

  if (loading) {
    return <div className="space-y-4">{Array.from({length: 4}).map((_, i) => <div key={i} className="h-24 rounded-xl animate-shimmer" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {user?.role === 'STUDENT' ? 'My Payments' : 'Payment Management'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {user?.role === 'STUDENT' ? 'View and track your fee payments' : 'Verify and manage student payments'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Verified</p>
                <p className="text-2xl font-bold text-emerald-600">₦{totalVerified.toLocaleString()}</p>
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
                <p className="text-xs text-muted-foreground">Pending Verification</p>
                <p className="text-2xl font-bold text-amber-600">₦{totalPending.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference, name, or matric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Student</th>
                  <th className="text-left p-3 font-medium">Fee Type</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Reference</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  {canVerify && <th className="text-right p-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={canVerify ? 7 : 6} className="p-8 text-center text-muted-foreground">
                      <Wallet className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 50).map(p => (
                    <tr key={p.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                              {p.student?.user?.firstName[0]}{p.student?.user?.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{p.student?.user?.firstName} {p.student?.user?.lastName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{p.student?.matricNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {p.feeType.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-semibold">₦{p.amount.toLocaleString()}</td>
                      <td className="p-3 text-xs font-mono text-muted-foreground">{p.reference}</td>
                      <td className="p-3">
                        {p.status === 'VERIFIED' && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">Verified</Badge>}
                        {p.status === 'PENDING' && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">Pending</Badge>}
                        {p.status === 'REJECTED' && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">Rejected</Badge>}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM yyyy') : '—'}
                      </td>
                      {canVerify && (
                        <td className="p-3 text-right">
                          {p.status === 'PENDING' && (
                            <Button size="sm" variant="outline" onClick={() => setVerifyDialog(p)}>
                              Verify
                            </Button>
                          )}
                          {p.status === 'VERIFIED' && p.receiptNo && (
                            <span className="text-xs font-mono text-muted-foreground">{p.receiptNo}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={!!verifyDialog} onOpenChange={() => setVerifyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Verify Payment
            </DialogTitle>
            <DialogDescription>
              Review and verify this payment transaction
            </DialogDescription>
          </DialogHeader>
          {verifyDialog && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-medium">{verifyDialog.student?.user?.firstName} {verifyDialog.student?.user?.lastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Matric Number</span>
                  <span className="font-mono text-xs">{verifyDialog.student?.matricNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee Type</span>
                  <span className="font-medium">{verifyDialog.feeType.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{verifyDialog.reference}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-semibold">Amount</span>
                  <span className="font-bold text-lg">₦{verifyDialog.amount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="receipt" className="text-xs">Receipt Number</Label>
                <Input
                  id="receipt"
                  placeholder="Enter receipt number..."
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="comment" className="text-xs">Comment (Optional)</Label>
                <Input
                  id="comment"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="destructive" onClick={() => handleVerify('reject')}>
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button onClick={() => handleVerify('verify')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Verify Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
