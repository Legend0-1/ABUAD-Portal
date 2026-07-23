import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (category) where.category = category

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where })
    ])

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error: any) {
    console.error('Get audit logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
