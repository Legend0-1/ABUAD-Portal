import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const collegeId = searchParams.get('collegeId')
    const departmentId = searchParams.get('departmentId')
    const level = searchParams.get('level')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { matricNumber: { contains: search } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { user: { email: { contains: search } } },
      ]
    }
    if (collegeId) where.collegeId = collegeId
    if (departmentId) where.departmentId = departmentId
    if (level) where.level = level

    // Restrict by role
    if (user.role === 'STUDENT') {
      const student = await db.student.findUnique({ where: { userId: user.id }})
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      where.id = student.id
    } else if (user.role === 'COLLEGE_OFFICER') {
      const co = await db.collegeOfficer.findFirst({ where: { userId: user.id }})
      if (co) where.collegeId = co.collegeId
    } else if (user.role === 'DEPARTMENT_COORDINATOR') {
      const dc = await db.departmentCoordinator.findFirst({ where: { userId: user.id }})
      if (dc) where.departmentId = dc.departmentId
    } else if (user.role === 'ACADEMIC_ADVISER') {
      const aa = await db.academicAdviser.findFirst({ where: { userId: user.id }})
      if (aa) where.departmentId = aa.departmentId
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, role: true, status: true } },
          college: true,
          department: true,
          programme: true,
          currentSession: true,
          currentSemester: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.student.count({ where })
    ])

    return NextResponse.json({
      students,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error: any) {
    console.error('Get students error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json()

    if (user.role === 'STUDENT') {
      // Student updates own profile
      const student = await db.student.findUnique({ where: { userId: user.id }})
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

      const updated = await db.student.update({
        where: { id: student.id },
        data: {
          phone: data.phone,
          address: data.address,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          stateOfOrigin: data.stateOfOrigin,
          lga: data.lga,
          maritalStatus: data.maritalStatus,
          employmentInfo: data.employmentInfo,
          passportUrl: data.passportUrl,
        },
        include: { user: true, college: true, department: true, programme: true }
      })

      if (data.firstName || data.lastName) {
        await db.user.update({
          where: { id: user.id },
          data: { firstName: data.firstName, lastName: data.lastName }
        })
      }

      return NextResponse.json({ student: updated, message: 'Profile updated successfully' })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (error: any) {
    console.error('Update student error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
