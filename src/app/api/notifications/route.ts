import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, logAction } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: any = { OR: [{ userId: user.id }, { audience: 'ALL' }] }
    if (unreadOnly) {
      where.isRead = false
      where.OR = [{ userId: user.id }]
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ notifications })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { notificationId, action } = await req.json() // action: 'read' | 'read_all'

    if (action === 'read_all') {
      await db.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true }
      })
    } else if (notificationId) {
      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ message: 'Notifications updated' })
  } catch (error: any) {
    console.error('Update notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
