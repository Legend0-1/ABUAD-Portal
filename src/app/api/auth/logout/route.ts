import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('abuad_access_token')?.value

    if (token) {
      // Revoke session
      await db.userSession.updateMany({
        where: { token },
        data: { revokedAt: new Date() }
      })

      // Find the user for audit log
      const session = await db.userSession.findFirst({ where: { token }})
      if (session) {
        await db.auditLog.create({
          data: {
            userId: session.userId,
            action: 'LOGOUT',
            category: 'AUTH',
            description: 'User logged out',
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
            deviceInfo: req.headers.get('user-agent') || 'unknown',
          }
        })
      }
    }

    cookieStore.delete('abuad_access_token')
    cookieStore.delete('abuad_refresh_token')

    return NextResponse.json({ message: 'Logout successful' })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
