import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const announcements = await db.announcement.findMany({
      where: {
        AND: [
          { startDate: { lte: new Date() } },
          {
            OR: [
              { audience: 'ALL' },
              { audience: user.role === 'STUDENT' ? 'STUDENT' : 'STAFF' },
              { audience: user.role as any },
            ]
          }
        ]
      },
      include: {
        author: { select: { firstName: true, lastName: true, role: true } }
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    })

    return NextResponse.json({ announcements })
  } catch (error: any) {
    console.error('Get announcements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
