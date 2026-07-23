import { NextRequest, NextResponse } from 'next/server'

// Set CORS_ORIGIN to your exact Vercel frontend URL in production, e.g.
// https://abuad-portal.vercel.app
// (Access-Control-Allow-Origin can't be "*" when credentials are used,
// so in production this must be an explicit origin, not a wildcard.)
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN

function corsHeaders(origin: string | null) {
  const allowOrigin = ALLOWED_ORIGIN || origin || '*'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  // Preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers })
  }

  const res = NextResponse.next()
  for (const [key, value] of Object.entries(headers)) {
    res.headers.set(key, value)
  }
  return res
}

export const config = {
  matcher: '/api/:path*',
}
