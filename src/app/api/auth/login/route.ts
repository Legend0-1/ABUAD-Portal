import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { student: { include: { college: true, department: true, programme: true } } }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: `Account is ${user.status.toLowerCase()}. Contact administrator.` }, { status: 403 })
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: 'Account is temporarily locked. Try again later.' }, { status: 403 })
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      await db.user.update({
        where: { id: user.id },
        data: { failedLoginCount: user.failedLoginCount + 1 }
      })
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const device = req.headers.get('user-agent') || 'unknown'

    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        lastLoginDevice: device,
      }
    })

    const payload = { userId: user.id, role: user.role, email: user.email }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    await db.userSession.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        deviceInfo: device,
        ipAddress: ip,
        expiresAt: new Date(Date.now() + (rememberMe ? 7 : 1) * 24 * 60 * 60 * 1000),
      }
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        category: 'AUTH',
        description: `User logged in as ${user.role}`,
        ipAddress: ip,
        deviceInfo: device,
      }
    })

    const cookieStore = await cookies()
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60
    const isProd = process.env.NODE_ENV === 'production'
    cookieStore.set('abuad_access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge,
      path: '/',
    })
    cookieStore.set('abuad_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    const { passwordHash, resetToken, resetTokenExpiry, emailVerifyToken, twoFactorSecret, ...userWithoutSensitive } = user
    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutSensitive,
      accessToken,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
