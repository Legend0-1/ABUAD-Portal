import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, logAction } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')

    let where: any = {}
    if (user.role === 'STUDENT') {
      const student = await db.student.findUnique({ where: { userId: user.id }})
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      where.studentId = student.id
    } else if (studentId) {
      where.studentId = studentId
    }
    if (status) where.status = status

    const payments = await db.payment.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            college: true,
            department: true,
          }
        },
        history: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ payments })
  } catch (error: any) {
    console.error('Get payments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['BURSARY', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Only Bursary can verify payments' }, { status: 403 })
    }

    const { paymentId, action, receiptNo, comment } = await req.json() // action: 'verify' | 'reject'

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { student: { include: { user: true } } }
    })

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    const newStatus = action === 'verify' ? 'VERIFIED' : 'REJECTED'
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        receiptNo: action === 'verify' ? (receiptNo || `RCP-${Date.now()}`) : null,
        verifiedById: user.id,
        verifiedAt: new Date(),
        paymentDate: payment.paymentDate || new Date(),
      }
    })

    await db.paymentHistory.create({
      data: {
        paymentId,
        action: action.toUpperCase(),
        performedById: user.id,
        comment: comment || `Payment ${action === 'verify' ? 'verified' : 'rejected'} by bursary`,
      }
    })

    await logAction(user.id, 'PAYMENT_VERIFICATION', 'PAYMENT',
      `${action === 'verify' ? 'Verified' : 'Rejected'} payment ${payment.reference}`, req,
      { paymentId, action, amount: payment.amount })

    // Notify student
    await db.notification.create({
      data: {
        userId: payment.student.userId,
        audience: 'STUDENT',
        title: `Payment ${action === 'verify' ? 'Verified' : 'Rejected'}`,
        message: action === 'verify'
          ? `Your ${payment.feeType.replace('_',' ')} payment of ₦${payment.amount.toLocaleString()} has been verified. Receipt No: ${receiptNo || 'Generated'}`
          : `Your ${payment.feeType.replace('_',' ')} payment was rejected. Please contact the Bursary.`,
        type: action === 'verify' ? 'PAYMENT_CONFIRMATION' : 'ERROR',
        metadata: JSON.stringify({ paymentId, amount: payment.amount }),
      }
    })

    return NextResponse.json({ message: `Payment ${action === 'verify' ? 'verified' : 'rejected'}` })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
