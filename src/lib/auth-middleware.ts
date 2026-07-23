import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAccessToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export type AuthUser = {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('abuad_access_token')?.value
  if (!token) return null

  const payload = verifyAccessToken(token)
  if (!payload) return null

  const session = await db.userSession.findFirst({
    where: { token, revokedAt: null, expiresAt: { gt: new Date() } }
  })
  if (!session) return null

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true, firstName: true, lastName: true }
  })

  return user
}

export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}

export async function requireRole(...roles: string[]): Promise<AuthUser | NextResponse> {
  const result = await requireAuth()
  if (result instanceof NextResponse) return result
  if (!roles.includes(result.role)) {
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })
  }
  return result
}

export async function logAction(userId: string, action: string, category: string, description: string, req?: NextRequest, metadata?: any) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      category: category as any,
      description,
      ipAddress: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || 'unknown',
      deviceInfo: req?.headers.get('user-agent') || 'unknown',
      metadata: metadata ? JSON.stringify(metadata) : null,
    }
  })
}
