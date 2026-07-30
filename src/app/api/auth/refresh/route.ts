import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('abuad_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Refresh token expired or invalid' },
        { status: 401 }
      );
    }

    // Confirm the session behind this refresh token is still valid (not revoked / not past its remember-me window)
    const session = await db.userSession.findFirst({
      where: { refreshToken, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Mint a new short-lived access token and keep it in sync with the session record,
    // since /api/auth/me looks sessions up by the access token value.
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    });

    await db.userSession.update({
      where: { id: session.id },
      data: { token: newAccessToken },
    });

    const isProd = process.env.NODE_ENV === 'production';
    cookieStore.set('abuad_access_token', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    return NextResponse.json({ message: 'Token refreshed' });
  } catch (error: any) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
