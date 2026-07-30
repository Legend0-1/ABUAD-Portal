import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope'); // 'super_admin' | 'college_officer' | 'coordinator' | 'registry' | 'bursary' | 'student'

    if (scope === 'student') {
      // Get student-specific stats
      const student = await db.student.findUnique({
        where: { userId: user.id },
        include: {
          college: true,
          department: true,
          programme: true,
          currentSession: true,
          currentSemester: true,
        },
      });
      if (!student)
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );

      const registration = await db.registration.findFirst({
        where: {
          studentId: student.id,
          sessionId: student.currentSessionId || undefined,
          semesterId: student.currentSemesterId || undefined,
        },
        include: {
          details: { include: { course: true } },
          approvals: true,
        },
      });

      const payments = await db.payment.findMany({
        where: {
          studentId: student.id,
          sessionId: student.currentSessionId || undefined,
        },
      });

      const outstandingFees = payments
        .filter((p) => p.status !== 'VERIFIED')
        .reduce((s, p) => s + p.amount, 0);
      const totalFees = payments.reduce((s, p) => s + p.amount, 0);

      const notifications = await db.notification.count({
        where: { userId: user.id, isRead: false },
      });

      const results = await db.result.findMany({
        where: { studentId: student.id },
        include: { course: true },
      });

      const carryOvers = results.filter((r) => r.grade === 'F').length;

      return NextResponse.json({
        student,
        registration,
        payments,
        outstandingFees,
        totalFees,
        unreadNotifications: notifications,
        totalResults: results.length,
        carryOvers,
        registrationProgress: registration
          ? (registration.details.length / 8) * 100
          : 0,
      });
    }

    // Admin scopes
    let collegeFilter: any = {};
    let deptFilter: any = {};

    if (scope === 'college_officer') {
      const co = await db.collegeOfficer.findFirst({
        where: { userId: user.id },
      });
      if (co) {
        collegeFilter = { collegeId: co.collegeId };
        deptFilter = { collegeId: co.collegeId };
      }
    } else if (scope === 'coordinator') {
      const dc = await db.departmentCoordinator.findFirst({
        where: { userId: user.id },
        include: { department: true },
      });
      if (dc) {
        deptFilter = { departmentId: dc.departmentId };
        collegeFilter = { collegeId: dc.department.collegeId };
      }
    } else if (scope === 'adviser') {
      const aa = await db.academicAdviser.findFirst({
        where: { userId: user.id },
        include: { department: true },
      });
      if (aa) {
        deptFilter = { departmentId: aa.departmentId };
        collegeFilter = { collegeId: aa.department.collegeId };
      }
    }

    const [
      totalStudents,
      totalRegistrations,
      pendingRegistrations,
      approvedRegistrations,
      rejectedRegistrations,
      draftRegistrations,
      totalCourses,
      totalDepartments,
      totalColleges,
      totalPayments,
      verifiedPayments,
      pendingPayments,
    ] = await Promise.all([
      db.student.count({ where: collegeFilter }),
      db.registration.count(),
      db.registration.count({
        where: {
          status: {
            in: [
              'PENDING_ADVISER',
              'PENDING_COORDINATOR',
              'PENDING_COLLEGE',
              'PENDING_REGISTRY',
            ],
          },
        },
      }),
      db.registration.count({ where: { status: 'APPROVED' } }),
      db.registration.count({ where: { status: 'REJECTED' } }),
      db.registration.count({ where: { status: 'DRAFT' } }),
      db.course.count(),
      db.department.count({
        where: deptFilter.collegeId ? { collegeId: deptFilter.collegeId } : {},
      }),
      db.college.count(),
      db.payment.aggregate({ _sum: { amount: true } }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'VERIFIED' },
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' },
      }),
    ]);

    // Get registration trend by status
    const registrationsByStatus = await db.registration.groupBy({
      by: ['status'],
      _count: true,
    });

    const studentsByLevel = await db.student.groupBy({
      by: ['level'],
      _count: true,
      where: collegeFilter,
    });

    const studentsByDepartment = await db.student.groupBy({
      by: ['departmentId'],
      _count: true,
      where: collegeFilter,
      take: 10,
    });

    // Get department names
    const departmentIds = studentsByDepartment.map((s) => s.departmentId);
    const departments = await db.department.findMany({
      where: { id: { in: departmentIds } },
    });
    const deptMap: Record<string, string> = {};
    for (const d of departments) deptMap[d.id] = d.name;

    const recentActivity = await db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    const pendingApprovalsByStage = {
      adviser: await db.registration.count({
        where: { status: 'PENDING_ADVISER' },
      }),
      coordinator: await db.registration.count({
        where: { status: 'PENDING_COORDINATOR' },
      }),
      college: await db.registration.count({
        where: { status: 'PENDING_COLLEGE' },
      }),
      registry: await db.registration.count({
        where: { status: 'PENDING_REGISTRY' },
      }),
    };

    return NextResponse.json({
      stats: {
        totalStudents,
        totalRegistrations,
        pendingRegistrations,
        approvedRegistrations,
        rejectedRegistrations,
        draftRegistrations,
        totalCourses,
        totalDepartments,
        totalColleges,
        totalRevenue: totalPayments._sum.amount || 0,
        verifiedRevenue: verifiedPayments._sum.amount || 0,
        pendingRevenue: pendingPayments._sum.amount || 0,
      },
      charts: {
        registrationsByStatus: registrationsByStatus.map((r) => ({
          name: r.status,
          value: r._count,
        })),
        studentsByLevel: studentsByLevel.map((s) => ({
          name: s.level,
          value: s._count,
        })),
        studentsByDepartment: studentsByDepartment.map((s) => ({
          name: deptMap[s.departmentId] || 'Unknown',
          value: s._count,
        })),
      },
      pendingApprovalsByStage,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        category: a.category,
        user: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System',
        role: a.user?.role,
        createdAt: a.createdAt,
        ipAddress: a.ipAddress,
      })),
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error?.message || 'unknown'}` },
      { status: 500 }
    );
  }
}
