import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('abuad_access_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token expired or invalid' }, { status: 401 })
    }

    // Check session is still valid
    const session = await db.userSession.findFirst({
      where: { token, revokedAt: null, expiresAt: { gt: new Date() } }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        student: {
          include: {
            college: true,
            department: true,
            programme: true,
            currentSession: true,
            currentSemester: true,
          }
        },
        collegeOfficers: { include: { college: true } },
        departmentCoordinators: { include: { department: { include: { college: true } } } },
        academicAdvisers: { include: { department: { include: { college: true } } } },
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { passwordHash, resetToken, resetTokenExpiry, emailVerifyToken, twoFactorSecret, ...userWithoutSensitive } = user
    return NextResponse.json({ user: userWithoutSensitive })
  } catch (error: any) {
    console.error('Get me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
