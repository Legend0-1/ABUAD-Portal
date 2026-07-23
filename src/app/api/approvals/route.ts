import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, logAction } from '@/lib/auth-middleware'

const STAGE_FLOW = {
  ADVISER: { next: 'PENDING_COORDINATOR', role: 'ACADEMIC_ADVISER', stage: 'COORDINATOR' },
  COORDINATOR: { next: 'PENDING_COLLEGE', role: 'DEPARTMENT_COORDINATOR', stage: 'COLLEGE_OFFICER' },
  COLLEGE_OFFICER: { next: 'PENDING_REGISTRY', role: 'COLLEGE_OFFICER', stage: 'REGISTRY' },
  REGISTRY: { next: 'APPROVED', role: 'REGISTRY', stage: null },
}

const STAGE_STATUS = {
  ADVISER: 'PENDING_ADVISER',
  COORDINATOR: 'PENDING_COORDINATOR',
  COLLEGE_OFFICER: 'PENDING_COLLEGE',
  REGISTRY: 'PENDING_REGISTRY',
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { registrationId, decision, comment, stage } = await req.json() // decision: APPROVED | REJECTED | MODIFICATION_REQUESTED

    if (!['APPROVED', 'REJECTED', 'MODIFICATION_REQUESTED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    }

    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: { student: { include: { user: true } } }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Verify the user's role matches the current stage
    const currentStage = Object.keys(STAGE_STATUS).find(k => STAGE_STATUS[k] === registration.status)
    if (!currentStage) {
      return NextResponse.json({ error: `Registration is not pending approval (status: ${registration.status})` }, { status: 400 })
    }

    // Validate approver role
    const expectedRole = STAGE_FLOW[currentStage as keyof typeof STAGE_FLOW].role
    if (user.role !== expectedRole && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        error: `Only ${expectedRole.replace(/_/g, ' ')} can approve at this stage`
      }, { status: 403 })
    }

    // Create approval record
    await db.approval.create({
      data: {
        registrationId,
        approverId: user.id,
        approverRole: user.role as any,
        stage: currentStage as any,
        decision: decision as any,
        comment,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      }
    })

    let newStatus = registration.status
    let lockedAt = registration.lockedAt

    if (decision === 'APPROVED') {
      newStatus = STAGE_FLOW[currentStage as keyof typeof STAGE_FLOW].next as any
      if (newStatus === 'APPROVED') {
        lockedAt = new Date()
      }
    } else if (decision === 'REJECTED') {
      newStatus = 'REJECTED'
    } else if (decision === 'MODIFICATION_REQUESTED') {
      newStatus = 'MODIFICATION_REQUESTED'
    }

    await db.registration.update({
      where: { id: registrationId },
      data: { status: newStatus, lockedAt, rejectionReason: decision !== 'APPROVED' ? comment : null }
    })

    await db.student.update({
      where: { id: registration.studentId },
      data: { registrationStatus: newStatus as any }
    })

    await logAction(user.id, 'APPROVAL_DECISION', 'APPROVAL',
      `${decision.replace('_',' ')} registration ${registration.id.substring(0,8)} at ${currentStage} stage`, req,
      { registrationId, decision, stage: currentStage, comment })

    // Notify student
    const messages = {
      APPROVED: newStatus === 'APPROVED'
        ? 'Your course registration has been fully approved and locked.'
        : `Your registration was approved at ${currentStage.replace('_',' ')} stage and forwarded to the next approver.`,
      REJECTED: `Your course registration was rejected at ${currentStage.replace('_',' ')} stage. Reason: ${comment || 'No reason provided'}`,
      MODIFICATION_REQUESTED: `Modification requested at ${currentStage.replace('_',' ')} stage. Please review and update your registration. Comment: ${comment || 'None'}`,
    }

    await db.notification.create({
      data: {
        userId: registration.student.userId,
        audience: 'STUDENT',
        title: `Registration ${decision.replace('_',' ')}`,
        message: messages[decision as keyof typeof messages],
        type: decision === 'APPROVED' ? 'SUCCESS' : decision === 'REJECTED' ? 'ERROR' : 'WARNING',
        metadata: JSON.stringify({ registrationId, decision, stage: currentStage }),
      }
    })

    // Notify next approver if forwarded
    if (decision === 'APPROVED' && newStatus !== 'APPROVED') {
      const nextStage = STAGE_FLOW[currentStage as keyof typeof STAGE_FLOW].stage
      if (nextStage) {
        // Find next approver based on role
        let nextApprovers: any[] = []
        if (nextStage === 'COORDINATOR') {
          const coord = await db.departmentCoordinator.findFirst({
            where: { department: { students: { some: { id: registration.studentId } } } }
          })
          if (coord) nextApprovers = [coord.userId]
        } else if (nextStage === 'COLLEGE_OFFICER') {
          const officers = await db.collegeOfficer.findMany({
            where: { college: { students: { some: { id: registration.studentId } } } }
          })
          nextApprovers = officers.map(o => o.userId)
        } else if (nextStage === 'REGISTRY') {
          const registry = await db.user.findMany({ where: { role: 'REGISTRY', status: 'ACTIVE' }})
          nextApprovers = registry.map(r => r.id)
        }

        for (const approverId of nextApprovers) {
          await db.notification.create({
            data: {
              userId: approverId,
              audience: 'STAFF',
              title: 'Registration Pending Your Approval',
              message: `${registration.student.matricNumber} - Registration awaiting your ${nextStage.replace('_',' ')} approval.`,
              type: 'APPROVAL_UPDATE',
              metadata: JSON.stringify({ registrationId }),
            }
          })
        }
      }
    }

    return NextResponse.json({
      message: `Registration ${decision.toLowerCase().replace('_',' ')}`,
      newStatus,
    })
  } catch (error: any) {
    console.error('Approval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
