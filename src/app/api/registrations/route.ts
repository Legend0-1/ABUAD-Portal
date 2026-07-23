import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, logAction } from '@/lib/auth-middleware'

const MIN_CREDIT_UNITS = 15
const MAX_CREDIT_UNITS = 24
const MAX_CREDIT_UNITS_500 = 18

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const stage = searchParams.get('stage')

    // For staff, get registrations pending their action
    let where: any = {}
    if (user.role === 'STUDENT') {
      const student = await db.student.findUnique({ where: { userId: user.id }})
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      where.studentId = student.id
    } else if (user.role === 'ACADEMIC_ADVISER') {
      where.status = 'PENDING_ADVISER'
    } else if (user.role === 'DEPARTMENT_COORDINATOR') {
      where.status = 'PENDING_COORDINATOR'
    } else if (user.role === 'COLLEGE_OFFICER') {
      where.status = 'PENDING_COLLEGE'
    } else if (user.role === 'REGISTRY') {
      where.status = status || { in: ['PENDING_REGISTRY', 'APPROVED'] }
    }

    if (status) where.status = status

    const registrations = await db.registration.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
            college: true,
            department: true,
            programme: true,
          }
        },
        session: true,
        semester: true,
        details: { include: { course: true } },
        approvals: { include: { approver: { select: { firstName: true, lastName: true, role: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ registrations })
  } catch (error: any) {
    console.error('Get registrations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can create registrations' }, { status: 403 })
    }

    const { courseIds, action } = await req.json() // action: 'save_draft' | 'submit'

    const student = await db.student.findUnique({
      where: { userId: user.id },
      include: {
        payments: { where: { session: { isActive: true } } },
        registrations: {
          where: { session: { isActive: true } },
          include: { details: true }
        }
      }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    // Payment verification
    const unpaidFees = student.payments.filter(p => p.status !== 'VERIFIED')
    if (unpaidFees.length > 0) {
      return NextResponse.json({
        error: `Payment verification required. Outstanding fees: ${unpaidFees.map(f => f.feeType.replace('_', ' ')).join(', ')}`,
        outstandingFees: unpaidFees,
      }, { status: 400 })
    }

    // Find active session & semester
    const activeSession = await db.academicSession.findFirst({ where: { isActive: true }})
    if (!activeSession) return NextResponse.json({ error: 'No active academic session' }, { status: 400 })

    const activeSemester = await db.semester.findFirst({
      where: { sessionId: activeSession.id, isActive: true }
    })
    if (!activeSemester) return NextResponse.json({ error: 'No active semester' }, { status: 400 })

    // Get courses with validation
    const courses = await db.course.findMany({
      where: { id: { in: courseIds } },
      include: { prerequisites: { include: { prerequisite: true } } }
    })

    // Validation: Prevent duplicate registration
    const existingReg = student.registrations.find(r => r.sessionId === activeSession.id)
    if (existingReg && existingReg.status === 'APPROVED') {
      return NextResponse.json({ error: 'Registration already approved and locked' }, { status: 400 })
    }

    // Validation: Check prerequisites
    for (const course of courses) {
      for (const prereq of course.prerequisites) {
        const result = await db.result.findFirst({
          where: { studentId: student.id, courseId: prereq.prerequisiteId, grade: { in: ['A','B','C','D','E'] } }
        })
        if (!result) {
          return NextResponse.json({
            error: `Prerequisite not met: ${prereq.prerequisite.code} (${prereq.prerequisite.title}) is required for ${course.code}`
          }, { status: 400 })
        }
      }
    }

    // Validation: Credit units
    const totalUnits = courses.reduce((s, c) => s + c.creditUnits, 0)
    const maxUnits = student.level === 'LEVEL_500' ? MAX_CREDIT_UNITS_500 : MAX_CREDIT_UNITS
    if (totalUnits > maxUnits) {
      return NextResponse.json({
        error: `Total credit units (${totalUnits}) exceeds maximum allowed (${maxUnits})`
      }, { status: 400 })
    }
    if (action === 'submit' && totalUnits < MIN_CREDIT_UNITS) {
      return NextResponse.json({
        error: `Total credit units (${totalUnits}) is below minimum required (${MIN_CREDIT_UNITS})`
      }, { status: 400 })
    }

    // Validation: Level & Semester match
    for (const course of courses) {
      if (course.level !== student.level && course.level !== 'LEVEL_100') {
        // Allow 100-level GST courses for all levels
        if (course.courseType !== 'GST') {
          return NextResponse.json({
            error: `${course.code} is for ${course.level.replace('LEVEL_','')} level students only`
          }, { status: 400 })
        }
      }
      if (course.semester !== activeSemester.name) {
        return NextResponse.json({
          error: `${course.code} is not offered in ${activeSemester.name.replace('FIRST','First').replace('SECOND','Second')} semester`
        }, { status: 400 })
      }
    }

    // Calculate units by type
    const coreUnits = courses.filter(c => c.courseType === 'CORE').reduce((s, c) => s + c.creditUnits, 0)
    const electiveUnits = courses.filter(c => c.courseType === 'ELECTIVE').reduce((s, c) => s + c.creditUnits, 0)
    const gstUnits = courses.filter(c => c.courseType === 'GST').reduce((s, c) => s + c.creditUnits, 0)

    // Delete existing draft and create new
    if (existingReg && existingReg.status === 'DRAFT') {
      await db.registrationDetail.deleteMany({ where: { registrationId: existingReg.id } })
      await db.registration.delete({ where: { id: existingReg.id } })
    }

    const newStatus = action === 'submit' ? 'PENDING_ADVISER' : 'DRAFT'

    const registration = await db.registration.create({
      data: {
        studentId: student.id,
        sessionId: activeSession.id,
        semesterId: activeSemester.id,
        status: newStatus,
        totalUnits,
        coreUnits,
        electiveUnits,
        gstUnits,
        submittedAt: action === 'submit' ? new Date() : null,
      },
      include: { student: true, session: true, semester: true }
    })

    // Create registration details
    for (const course of courses) {
      const offering = await db.courseOffering.findFirst({
        where: { courseId: course.id, sessionId: activeSession.id, semesterId: activeSemester.id }
      })
      await db.registrationDetail.create({
        data: {
          registrationId: registration.id,
          courseId: course.id,
          courseOfferingId: offering?.id,
        }
      })
    }

    // Update student registration status
    await db.student.update({
      where: { id: student.id },
      data: { registrationStatus: newStatus }
    })

    await logAction(user.id, 'COURSE_REGISTRATION', 'REGISTRATION',
      `${action === 'submit' ? 'Submitted' : 'Saved draft'} course registration with ${courseIds.length} courses (${totalUnits} units)`, req,
      { registrationId: registration.id, totalUnits })

    // Send notification to student
    await db.notification.create({
      data: {
        userId: user.id,
        audience: 'STUDENT',
        title: action === 'submit' ? 'Registration Submitted' : 'Draft Saved',
        message: action === 'submit'
          ? `Your course registration has been submitted for adviser approval. Total: ${totalUnits} units across ${courseIds.length} courses.`
          : `Your course registration draft has been saved. Submit when ready.`,
        type: action === 'submit' ? 'APPROVAL_UPDATE' : 'INFO',
        metadata: JSON.stringify({ registrationId: registration.id }),
      }
    })

    // Notify adviser if submitted
    if (action === 'submit') {
      const adviser = await db.studentAdviser.findFirst({
        where: { studentId: student.id },
        include: { adviser: true }
      })
      if (adviser) {
        await db.notification.create({
          data: {
            userId: adviser.adviser.userId,
            audience: 'STAFF',
            title: 'New Registration Pending Approval',
            message: `${student.matricNumber} - Course registration awaiting your approval.`,
            type: 'APPROVAL_UPDATE',
            metadata: JSON.stringify({ registrationId: registration.id }),
          }
        })
      }
    }

    return NextResponse.json({
      registration,
      message: action === 'submit' ? 'Registration submitted for approval' : 'Draft saved successfully'
    })
  } catch (error: any) {
    console.error('Create registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
