import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const departmentId = searchParams.get('departmentId')
    const collegeId = searchParams.get('collegeId')
    const level = searchParams.get('level')
    const semester = searchParams.get('semester')
    const courseType = searchParams.get('courseType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
      ]
    }
    if (departmentId) where.departmentId = departmentId
    if (collegeId) where.collegeId = collegeId
    if (level) where.level = level
    if (semester) where.semester = semester
    if (courseType) where.courseType = courseType

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        include: {
          department: true,
          college: true,
          prerequisites: { include: { prerequisite: true } },
          offerings: {
            include: { session: true, semester: true },
            where: { session: { isActive: true } }
          },
        },
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      db.course.count({ where })
    ])

    return NextResponse.json({
      courses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error: any) {
    console.error('Get courses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['SUPER_ADMIN', 'ICT_ADMIN', 'REGISTRY', 'DEPARTMENT_COORDINATOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await req.json()

    // Generate course code if not provided
    const course = await db.course.create({
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        creditUnits: parseInt(data.creditUnits),
        level: data.level,
        courseType: data.courseType,
        departmentId: data.departmentId,
        collegeId: data.collegeId,
        semester: data.semester,
        lecturer: data.lecturer,
        venue: data.venue,
        maxStudents: parseInt(data.maxStudents) || 100,
      },
      include: { department: true, college: true }
    })

    return NextResponse.json({ course, message: 'Course created successfully' })
  } catch (error: any) {
    console.error('Create course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
