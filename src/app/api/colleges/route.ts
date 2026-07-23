import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const colleges = await db.college.findMany({
      include: {
        departments: true,
        _count: { select: { students: true, courses: true } }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ colleges })
  } catch (error: any) {
    console.error('Get colleges error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
