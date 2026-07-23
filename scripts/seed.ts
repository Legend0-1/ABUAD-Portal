import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

async function main() {
  console.log('🌱 Seeding ABUAD Portal...')

  // Clear existing data (in proper dependency order)
  await db.userSession.deleteMany()
  await db.notification.deleteMany()
  await db.announcement.deleteMany()
  await db.auditLog.deleteMany()
  await db.supportTicket.deleteMany()
  await db.adviserNote.deleteMany()
  await db.studentAdviser.deleteMany()
  await db.academicAdviser.deleteMany()
  await db.departmentCoordinator.deleteMany()
  await db.collegeOfficer.deleteMany()
  await db.result.deleteMany()
  await db.paymentHistory.deleteMany()
  await db.payment.deleteMany()
  await db.approval.deleteMany()
  await db.registrationDetail.deleteMany()
  await db.registration.deleteMany()
  await db.coursePrerequisite.deleteMany()
  await db.courseOffering.deleteMany()
  await db.course.deleteMany()
  await db.semester.deleteMany()
  await db.academicSession.deleteMany()
  await db.student.deleteMany()
  await db.department.deleteMany()
  await db.college.deleteMany()
  await db.user.deleteMany()
  await db.setting.deleteMany()
  await db.programme.deleteMany()

  // ===================== PROGRAMMES =====================
  const programmes = await Promise.all([
    db.programme.create({ data: { code: 'PT', name: 'Part-Time' } }),
    db.programme.create({ data: { code: 'WP', name: 'Weekend Programme' } }),
    db.programme.create({ data: { code: 'EP', name: 'Evening Programme' } }),
    db.programme.create({ data: { code: 'DL', name: 'Distance Learning' } }),
  ])
  console.log(`✅ Created ${programmes.length} programmes`)

  // ===================== COLLEGES & DEPARTMENTS =====================
  const collegesData = [
    { code: 'COS', name: 'College of Sciences', departments: [
      { code: 'CSC', name: 'Computer Science' },
      { code: 'MCB', name: 'Microbiology' },
      { code: 'BCH', name: 'Biochemistry' },
      { code: 'PHY', name: 'Physics' },
      { code: 'MTH', name: 'Mathematics' },
    ]},
    { code: 'COE', name: 'College of Engineering', departments: [
      { code: 'MEE', name: 'Mechanical Engineering' },
      { code: 'EEE', name: 'Electrical Engineering' },
      { code: 'CIE', name: 'Civil Engineering' },
      { code: 'CPE', name: 'Computer Engineering' },
      { code: 'MTE', name: 'Mechatronics' },
    ]},
    { code: 'COL', name: 'College of Law', departments: [
      { code: 'PUL', name: 'Public Law' },
      { code: 'PRL', name: 'Private Law' },
      { code: 'ICL', name: 'International & Comparative Law' },
    ]},
    { code: 'COM', name: 'College of Medicine', departments: [
      { code: 'MED', name: 'Medicine & Surgery' },
      { code: 'NUR', name: 'Nursing Sciences' },
      { code: 'ANS', name: 'Anatomy' },
      { code: 'PHS', name: 'Physiology' },
    ]},
    { code: 'CSM', name: 'College of Social and Management Sciences', departments: [
      { code: 'ACC', name: 'Accounting' },
      { code: 'BUS', name: 'Business Administration' },
      { code: 'ECO', name: 'Economics' },
      { code: 'POL', name: 'Political Science' },
      { code: 'SOC', name: 'Sociology' },
    ]},
    { code: 'CAH', name: 'College of Arts and Humanities', departments: [
      { code: 'ENG', name: 'English & Literary Studies' },
      { code: 'HIS', name: 'History & International Studies' },
      { code: 'PHI', name: 'Philosophy' },
      { code: 'LNG', name: 'Languages & Linguistics' },
    ]},
  ]

  const colleges: any[] = []
  const departments: any[] = []

  for (const cData of collegesData) {
    const college = await db.college.create({ data: { code: cData.code, name: cData.name, description: `${cData.name} - ABUAD` }})
    colleges.push(college)
    for (const dData of cData.departments) {
      const dept = await db.department.create({ data: { code: dData.code, name: dData.name, collegeId: college.id, description: `${dData.name} department` }})
      departments.push(dept)
    }
  }
  console.log(`✅ Created ${colleges.length} colleges and ${departments.length} departments`)

  // ===================== ACADEMIC SESSION & SEMESTERS =====================
  const session = await db.academicSession.create({
    data: {
      name: '2025/2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-08-31'),
      isActive: true,
    }
  })
  const semester1 = await db.semester.create({
    data: { name: 'FIRST', sessionId: session.id, startDate: new Date('2025-09-01'), endDate: new Date('2025-12-31'), isActive: true, registrationDeadline: new Date('2025-09-30') }
  })
  const semester2 = await db.semester.create({
    data: { name: 'SECOND', sessionId: session.id, startDate: new Date('2026-01-15'), endDate: new Date('2026-05-15') }
  })
  console.log('✅ Created academic session & semesters')

  // ===================== COURSES =====================
  const courseTemplates: Record<string, { code: string; title: string; units: number; type: string; semester: string }[]> = {
    'CSC': [
      { code: 'CSC101', title: 'Introduction to Computer Science', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'CSC103', title: 'Introduction to Problem Solving', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'MTH101', title: 'Elementary Mathematics I', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'GST101', title: 'Use of English & Communication Skills', units: 2, type: 'GST', semester: 'FIRST' },
      { code: 'GST103', title: 'Nigerian Peoples & Culture', units: 2, type: 'GST', semester: 'FIRST' },
      { code: 'CSC102', title: 'Introduction to Programming (Python)', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'CSC104', title: 'Computer Hardware Organization', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'MTH102', title: 'Elementary Mathematics II', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'GST102', title: 'Philosophy & Logic', units: 2, type: 'GST', semester: 'SECOND' },
      { code: 'CSC201', title: 'Data Structures & Algorithms', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'CSC203', title: 'Discrete Structures', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'CSC205', title: 'Object Oriented Programming (Java)', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'GST201', title: 'Entrepreneurial Studies', units: 2, type: 'GST', semester: 'FIRST' },
      { code: 'CSC202', title: 'Database Management Systems', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'CSC204', title: 'Computer Architecture', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'CSC206', title: 'Operating Systems Concepts', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'CSC208', title: 'Web Application Development', units: 2, type: 'ELECTIVE', semester: 'SECOND' },
      { code: 'CSC301', title: 'Software Engineering', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'CSC303', title: 'Computer Networks', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'CSC305', title: 'System Analysis & Design', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'CSC307', title: 'Mobile Application Development', units: 2, type: 'ELECTIVE', semester: 'FIRST' },
      { code: 'CSC302', title: 'Artificial Intelligence', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'CSC304', title: 'Cybersecurity Fundamentals', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'CSC306', title: 'Cloud Computing', units: 2, type: 'ELECTIVE', semester: 'SECOND' },
      { code: 'CSC401', title: 'Final Year Project I', units: 4, type: 'CORE', semester: 'FIRST' },
      { code: 'CSC403', title: 'Machine Learning', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'CSC405', title: 'Data Science & Analytics', units: 3, type: 'ELECTIVE', semester: 'FIRST' },
      { code: 'CSC402', title: 'Final Year Project II', units: 4, type: 'CORE', semester: 'SECOND' },
      { code: 'CSC404', title: 'Human-Computer Interaction', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'CSC406', title: 'Professional Ethics in Computing', units: 2, type: 'GST', semester: 'SECOND' },
    ],
    'EEE': [
      { code: 'EEE101', title: 'Introduction to Electrical Engineering', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'EEE103', title: 'Engineering Mathematics I', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'GST101', title: 'Use of English & Communication Skills', units: 2, type: 'GST', semester: 'FIRST' },
      { code: 'EEE102', title: 'Circuit Theory I', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'EEE104', title: 'Electronics I', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'EEE201', title: 'Circuit Theory II', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'EEE203', title: 'Signals & Systems', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'EEE205', title: 'Digital Electronics', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'EEE202', title: 'Electromagnetics', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'EEE204', title: 'Electrical Machines', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'EEE301', title: 'Power Systems I', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'EEE303', title: 'Control Systems', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'EEE302', title: 'Communication Systems', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'EEE304', title: 'Microprocessors & Microcontrollers', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'EEE401', title: 'Final Year Project I', units: 4, type: 'CORE', semester: 'FIRST' },
      { code: 'EEE403', title: 'Power Electronics', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'EEE402', title: 'Final Year Project II', units: 4, type: 'CORE', semester: 'SECOND' },
    ],
    'ACC': [
      { code: 'ACC101', title: 'Principles of Accounting I', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ACC103', title: 'Introduction to Business', units: 2, type: 'CORE', semester: 'FIRST' },
      { code: 'GST101', title: 'Use of English & Communication Skills', units: 2, type: 'GST', semester: 'FIRST' },
      { code: 'ACC102', title: 'Principles of Accounting II', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'ACC104', title: 'Business Mathematics', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'ACC201', title: 'Financial Accounting I', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ACC203', title: 'Cost Accounting I', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ACC202', title: 'Financial Accounting II', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'ACC204', title: 'Auditing I', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'ACC301', title: 'Taxation', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ACC303', title: 'Management Accounting', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ACC302', title: 'Auditing & Assurance Services', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'ACC401', title: 'Financial Reporting', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ACC403', title: 'Corporate Accounting', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ACC402', title: 'Advanced Financial Reporting', units: 3, type: 'CORE', semester: 'SECOND' },
    ],
    'PUL': [
      { code: 'PUL101', title: 'Introduction to Legal Studies', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'PUL103', title: 'Nigerian Legal System I', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'GST101', title: 'Use of English & Communication Skills', units: 2, type: 'GST', semester: 'FIRST' },
      { code: 'PUL102', title: 'Constitutional Law I', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'PUL104', title: 'Nigerian Legal System II', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'PUL201', title: 'Constitutional Law II', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'PUL203', title: 'Administrative Law I', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'PUL202', title: 'Administrative Law II', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'PUL301', title: 'Jurisprudence', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'PUL303', title: 'Public International Law', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'PUL401', title: 'Human Rights Law', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'PUL402', title: 'Energy & Environmental Law', units: 3, type: 'ELECTIVE', semester: 'SECOND' },
    ],
    'MED': [
      { code: 'MED101', title: 'Human Anatomy I', units: 4, type: 'CORE', semester: 'FIRST' },
      { code: 'MED103', title: 'Medical Biochemistry I', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'GST101', title: 'Use of English & Communication Skills', units: 2, type: 'GST', semester: 'FIRST' },
      { code: 'MED102', title: 'Human Physiology I', units: 4, type: 'CORE', semester: 'SECOND' },
      { code: 'MED104', title: 'Medical Biochemistry II', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'MED201', title: 'General Pathology', units: 4, type: 'CORE', semester: 'FIRST' },
      { code: 'MED203', title: 'Medical Microbiology', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'MED202', title: 'Pharmacology I', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'MED301', title: 'Internal Medicine', units: 4, type: 'CORE', semester: 'FIRST' },
      { code: 'MED303', title: 'Surgery', units: 4, type: 'CORE', semester: 'FIRST' },
      { code: 'MED302', title: 'Obstetrics & Gynaecology', units: 4, type: 'CORE', semester: 'SECOND' },
      { code: 'MED401', title: 'Paediatrics', units: 4, type: 'CORE', semester: 'FIRST' },
      { code: 'MED402', title: 'Community Medicine', units: 4, type: 'CORE', semester: 'SECOND' },
    ],
    'ENG': [
      { code: 'ENG101', title: 'Introduction to English Literature', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ENG103', title: 'Oral Literature', units: 2, type: 'CORE', semester: 'FIRST' },
      { code: 'GST101', title: 'Use of English & Communication Skills', units: 2, type: 'GST', semester: 'FIRST' },
      { code: 'ENG102', title: 'African Poetry & Drama', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'ENG104', title: 'English Composition', units: 2, type: 'CORE', semester: 'SECOND' },
      { code: 'ENG201', title: 'Shakespeare & Renaissance Drama', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ENG203', title: 'The English Novel', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ENG202', title: 'Literary Criticism', units: 3, type: 'CORE', semester: 'SECOND' },
      { code: 'ENG301', title: 'Modern African Literature', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ENG303', title: 'Stylistics', units: 3, type: 'ELECTIVE', semester: 'FIRST' },
      { code: 'ENG401', title: 'Comparative Literature', units: 3, type: 'CORE', semester: 'FIRST' },
      { code: 'ENG402', title: 'Research Project', units: 4, type: 'CORE', semester: 'SECOND' },
    ],
  }

  let courseCount = 0
  const createdCourseCodes = new Set<string>()
  const deptByCode: Record<string, any> = {}
  for (const d of departments) deptByCode[d.code] = d

  for (const [deptCode, courses] of Object.entries(courseTemplates)) {
    const dept = deptByCode[deptCode]
    if (!dept) continue
    for (const c of courses) {
      // Skip if course code already exists (cross-department shared courses like GST101, MTH101)
      if (createdCourseCodes.has(c.code)) continue
      const levelNum = c.code.match(/\d(\d)0/)?.[1] || '1'
      const level = `LEVEL_${levelNum}00`
      await db.course.create({
        data: {
          code: c.code,
          title: c.title,
          description: `${c.title} - A comprehensive course offered by ${dept.name}.`,
          creditUnits: c.units,
          level: level as any,
          courseType: c.type as any,
          departmentId: dept.id,
          collegeId: dept.collegeId,
          semester: c.semester as any,
          lecturer: 'Dr. Faculty Member',
          venue: 'Lecture Hall ' + Math.floor(Math.random() * 20 + 1),
          maxStudents: 100,
        }
      })
      createdCourseCodes.add(c.code)
      courseCount++
    }
  }

  // Add generic courses for departments that don't have templates
  const otherDepts = departments.filter(d => !Object.keys(courseTemplates).includes(d.code))
  for (const dept of otherDepts) {
    for (let level = 1; level <= 4; level++) {
      for (const sem of ['FIRST', 'SECOND']) {
        const coreCode = `${dept.code}${level}${sem === 'FIRST' ? '1' : '2'}01`
        if (!createdCourseCodes.has(coreCode)) {
          await db.course.create({
            data: {
              code: coreCode,
              title: `${dept.name} ${level}00 Level Course ${sem === 'FIRST' ? 'I' : 'II'}`,
              description: `Core course for ${dept.name} - ${level}00 Level`,
              creditUnits: 3,
              level: `LEVEL_${level}00` as any,
              courseType: 'CORE',
              departmentId: dept.id,
              collegeId: dept.collegeId,
              semester: sem as any,
              lecturer: 'Dr. Faculty Member',
              venue: 'Lecture Hall',
              maxStudents: 80,
            }
          })
          createdCourseCodes.add(coreCode)
          courseCount++
        }
        const gstCode = `${dept.code}GST${level}${sem === 'FIRST' ? '1' : '2'}`
        if (!createdCourseCodes.has(gstCode)) {
          await db.course.create({
            data: {
              code: gstCode,
              title: sem === 'FIRST' ? 'Use of English & Communication Skills' : 'Philosophy & Logic',
              description: 'General Studies course for all students.',
              creditUnits: 2,
              level: `LEVEL_${level}00` as any,
              courseType: 'GST',
              departmentId: dept.id,
              collegeId: dept.collegeId,
              semester: sem as any,
              lecturer: 'GST Department',
              venue: 'Main Auditorium',
              maxStudents: 200,
            }
          })
          createdCourseCodes.add(gstCode)
          courseCount++
        }
      }
    }
  }
  console.log(`✅ Created ${courseCount} courses`)

  // ===================== COURSE OFFERINGS =====================
  const allCourses = await db.course.findMany()
  for (const course of allCourses) {
    const semId = course.semester === 'FIRST' ? semester1.id : course.semester === 'SECOND' ? semester2.id : semester1.id
    await db.courseOffering.create({
      data: {
        courseId: course.id,
        sessionId: session.id,
        semesterId: semId,
        timetable: JSON.stringify({
          monday: [{ start: '08:00', end: '10:00', venue: course.venue || 'TBD' }],
          wednesday: [{ start: '10:00', end: '12:00', venue: course.venue || 'TBD' }],
        }),
      }
    })
  }
  console.log(`✅ Created course offerings`)

  // ===================== USERS - ADMINS =====================
  const adminPassword = await hashPassword('Admin@123')

  const superAdmin = await db.user.create({
    data: {
      email: 'superadmin@abuad.edu.ng',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
    }
  })

  const ictAdmin = await db.user.create({
    data: {
      email: 'ict.admin@abuad.edu.ng',
      passwordHash: adminPassword,
      firstName: 'ICT',
      lastName: 'Administrator',
      role: 'ICT_ADMIN',
      isEmailVerified: true,
    }
  })

  const registry = await db.user.create({
    data: {
      email: 'registry@abuad.edu.ng',
      passwordHash: adminPassword,
      firstName: 'Registry',
      lastName: 'Officer',
      role: 'REGISTRY',
      isEmailVerified: true,
    }
  })

  const bursary = await db.user.create({
    data: {
      email: 'bursary@abuad.edu.ng',
      passwordHash: adminPassword,
      firstName: 'Bursary',
      lastName: 'Officer',
      role: 'BURSARY',
      isEmailVerified: true,
    }
  })

  // College officers for each college
  const collegeOfficers: any[] = []
  for (const college of colleges) {
    const officer = await db.user.create({
      data: {
        email: `officer.${college.code.toLowerCase()}@abuad.edu.ng`,
        passwordHash: adminPassword,
        firstName: 'College Officer',
        lastName: college.code,
        role: 'COLLEGE_OFFICER',
        isEmailVerified: true,
      }
    })
    await db.collegeOfficer.create({ data: { userId: officer.id, collegeId: college.id } })
    collegeOfficers.push(officer)
  }

  // Department coordinators for each department
  for (const dept of departments) {
    const coordinator = await db.user.create({
      data: {
        email: `coordinator.${dept.code.toLowerCase()}@abuad.edu.ng`,
        passwordHash: adminPassword,
        firstName: 'Coordinator',
        lastName: dept.code,
        role: 'DEPARTMENT_COORDINATOR',
        isEmailVerified: true,
      }
    })
    await db.departmentCoordinator.create({ data: { userId: coordinator.id, departmentId: dept.id } })

    // Academic adviser for each department
    const adviser = await db.user.create({
      data: {
        email: `adviser.${dept.code.toLowerCase()}@abuad.edu.ng`,
        passwordHash: adminPassword,
        firstName: 'Adviser',
        lastName: dept.code,
        role: 'ACADEMIC_ADVISER',
        isEmailVerified: true,
      }
    })
    await db.academicAdviser.create({ data: { userId: adviser.id, departmentId: dept.id } })
  }
  console.log(`✅ Created admin/staff accounts`)

  // ===================== STUDENT USERS =====================
  const studentPassword = await hashPassword('Student@123')
  const firstNames = ['Adewale', 'Funmilayo', 'Chinedu', 'Aisha', 'Emeka', 'Fatima', 'Tunde', 'Blessing', 'Yusuf', 'Zainab', 'Oluwaseun', 'Ibrahim', 'Grace', 'Samuel', 'Maryam', 'David', 'Hauwa', 'Daniel', 'Bukola', 'Ahmed', 'Rashidat', 'Ebuka', 'Joy', 'Kunle', 'Amina']
  const lastNames = ['Adeyemi', 'Okafor', 'Mohammed', 'Okonkwo', 'Eze', 'Oluwatobi', 'Bello', 'Adenuga', 'Ibrahim', 'Suleiman', 'Adeleke', 'Nwosu', 'Hassan', 'Adebowale', 'Olawale', 'Ezeogu', 'Bashir', 'Okoro', 'Adebayo', 'Yusuf']
  const states = ['Lagos', 'Oyo', 'Ogun', 'Osun', 'Ondo', 'Ekiti', 'Kwara', 'Kano', 'Rivers', 'Edo']

  const students: any[] = []
  for (let i = 0; i < 80; i++) {
    const dept = departments[i % departments.length]
    const college = colleges.find(c => c.id === dept.collegeId)!
    const programme = programmes[i % programmes.length]
    const level = (['LEVEL_100','LEVEL_200','LEVEL_300','LEVEL_400'] as const)[i % 4]
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[i % lastNames.length]
    const matric = `ABUAD/PT/${level.replace('LEVEL_','')}/${String(i + 1).padStart(4,'0')}`

    const user = await db.user.create({
      data: {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i+1}@abuad.edu.ng`,
        passwordHash: studentPassword,
        firstName,
        lastName,
        phone: `+23480${String(Math.floor(10000000 + Math.random()*89999999))}`,
        role: 'STUDENT',
        isEmailVerified: true,
      }
    })

    const student = await db.student.create({
      data: {
        userId: user.id,
        matricNumber: matric,
        collegeId: college.id,
        departmentId: dept.id,
        programmeId: programme.id,
        level: level as any,
        currentSessionId: session.id,
        currentSemesterId: semester1.id,
        admissionYear: 2025 - (Number(level.replace('LEVEL_','')) / 100 - 1),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        dateOfBirth: new Date(1998 + (i % 5), i % 12, (i % 28) + 1),
        maritalStatus: i % 3 === 0 ? 'Married' : 'Single',
        stateOfOrigin: states[i % states.length],
        lga: `${states[i % states.length]} LGA`,
        address: `${i+1} Sample Street, ${states[i % states.length]} State`,
        emergencyContact: `${firstNames[(i+1) % firstNames.length]} ${lastNames[(i+1) % lastNames.length]}`,
        emergencyPhone: `+23480${String(Math.floor(10000000 + Math.random()*89999999))}`,
        parentName: `${firstNames[(i+2) % firstNames.length]} ${lastName}`,
        parentPhone: `+23480${String(Math.floor(10000000 + Math.random()*89999999))}`,
        cgpa: Number((2.0 + Math.random() * 3.0).toFixed(2)),
        totalCreditUnits: 30 + (i % 60),
        totalQualityPoints: 60 + (i % 120),
        registrationStatus: i % 5 === 0 ? 'APPROVED' : i % 3 === 0 ? 'PENDING_ADVISER' : i % 4 === 0 ? 'DRAFT' : 'NOT_STARTED',
      }
    })

    // Link student to adviser
    const adviser = await db.academicAdviser.findFirst({ where: { departmentId: dept.id }})
    if (adviser) {
      await db.studentAdviser.create({ data: { studentId: student.id, adviserId: adviser.id }})
    }

    // Create payments for student
    const feeTypes = ['SCHOOL_FEES', 'ICT_FEES', 'LIBRARY_FEES'] as const
    for (const feeType of feeTypes) {
      const amount = feeType === 'SCHOOL_FEES' ? 150000 : feeType === 'ICT_FEES' ? 25000 : 15000
      const isPaid = i % 4 !== 0 // 75% paid
      await db.payment.create({
        data: {
          studentId: student.id,
          sessionId: session.id,
          feeType: feeType as any,
          amount,
          status: isPaid ? 'VERIFIED' : 'PENDING',
          reference: `REF-${student.id.substring(0,8)}-${feeType}-${i}`,
          receiptNo: isPaid ? `RCP-${String(i*10+feeTypes.indexOf(feeType)).padStart(6,'0')}` : null,
          paymentDate: isPaid ? new Date() : null,
          paymentMethod: isPaid ? 'Bank Transfer' : null,
          verifiedAt: isPaid ? new Date() : null,
          description: `${feeType.replace('_',' ')} for 2025/2026 session`,
        }
      })
    }

    // Create results for past courses
    const pastCourses = await db.course.findMany({
      where: { departmentId: dept.id, level: { in: ['LEVEL_100','LEVEL_200','LEVEL_300'].filter(l => Number(l.replace('LEVEL_','')) < Number(level.replace('LEVEL_',''))) } },
      take: 8,
    })
    for (const course of pastCourses) {
      const total = 40 + Math.floor(Math.random() * 55)
      const gradePoint = total >= 70 ? 5 : total >= 60 ? 4 : total >= 50 ? 3 : total >= 45 ? 2 : total >= 40 ? 1 : 0
      const grade = total >= 70 ? 'A' : total >= 60 ? 'B' : total >= 50 ? 'C' : total >= 45 ? 'D' : total >= 40 ? 'E' : 'F'
      await db.result.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          sessionId: session.id,
          semesterId: course.semester === 'FIRST' ? semester1.id : semester2.id,
          caScore: Math.floor(total * 0.3),
          examScore: Math.floor(total * 0.7),
          totalScore: total,
          grade,
          gradePoint,
          creditUnits: course.creditUnits,
          status: 'PUBLISHED',
        }
      })
    }

    // Create registrations for students who are registering
    if (i % 4 === 0) {
      const regSemester = i % 8 < 4 ? semester1 : semester2
      const regCourses = await db.course.findMany({
        where: { departmentId: dept.id, level, semester: regSemester.name },
        take: 6,
      })
      const registration = await db.registration.create({
        data: {
          studentId: student.id,
          sessionId: session.id,
          semesterId: regSemester.id,
          status: student.registrationStatus,
          totalUnits: regCourses.reduce((s, c) => s + c.creditUnits, 0),
          coreUnits: regCourses.filter(c => c.courseType === 'CORE').reduce((s, c) => s + c.creditUnits, 0),
          electiveUnits: regCourses.filter(c => c.courseType === 'ELECTIVE').reduce((s, c) => s + c.creditUnits, 0),
          gstUnits: regCourses.filter(c => c.courseType === 'GST').reduce((s, c) => s + c.creditUnits, 0),
          submittedAt: student.registrationStatus !== 'DRAFT' && student.registrationStatus !== 'NOT_STARTED' ? new Date() : null,
          lockedAt: student.registrationStatus === 'APPROVED' ? new Date() : null,
        }
      })
      for (const course of regCourses) {
        await db.registrationDetail.create({
          data: {
            registrationId: registration.id,
            courseId: course.id,
          }
        })
      }

      // Add approvals based on status
      if (['PENDING_ADVISER','PENDING_COORDINATOR','PENDING_COLLEGE','PENDING_REGISTRY','APPROVED'].includes(student.registrationStatus)) {
        const adviser = await db.academicAdviser.findFirst({ where: { departmentId: dept.id }})
        if (adviser) {
          await db.approval.create({
            data: {
              registrationId: registration.id,
              approverId: adviser.userId,
              approverRole: 'ACADEMIC_ADVISER',
              stage: 'ADVISER',
              decision: 'APPROVED',
              comment: 'Courses reviewed and approved by adviser.',
              createdAt: new Date(Date.now() - 86400000 * 3),
            }
          })
        }
      }
      if (['PENDING_COORDINATOR', 'PENDING_COLLEGE', 'PENDING_REGISTRY', 'APPROVED'].includes(student.registrationStatus)) {
        const coord = await db.departmentCoordinator.findFirst({ where: { departmentId: dept.id }})
        if (coord) {
          await db.approval.create({
            data: {
              registrationId: registration.id,
              approverId: coord.userId,
              approverRole: 'DEPARTMENT_COORDINATOR',
              stage: 'COORDINATOR',
              decision: 'APPROVED',
              comment: 'Departmental approval granted.',
              createdAt: new Date(Date.now() - 86400000 * 2),
            }
          })
        }
      }
      if (['PENDING_COLLEGE', 'PENDING_REGISTRY', 'APPROVED'].includes(student.registrationStatus)) {
        const co = await db.collegeOfficer.findFirst({ where: { collegeId: college.id }})
        if (co) {
          await db.approval.create({
            data: {
              registrationId: registration.id,
              approverId: co.userId,
              approverRole: 'COLLEGE_OFFICER',
              stage: 'COLLEGE_OFFICER',
              decision: 'APPROVED',
              comment: 'College approval granted.',
              createdAt: new Date(Date.now() - 86400000),
            }
          })
        }
      }
      if (student.registrationStatus === 'APPROVED') {
        await db.approval.create({
          data: {
            registrationId: registration.id,
            approverId: registry.id,
            approverRole: 'REGISTRY',
            stage: 'REGISTRY',
            decision: 'APPROVED',
            comment: 'Final registry approval.',
            createdAt: new Date(),
          }
        })
      }
    }

    students.push(student)
  }
  console.log(`✅ Created ${students.length} students with payments, results, and registrations`)

  // ===================== ANNOUNCEMENTS =====================
  await db.announcement.createMany({
    data: [
      {
        title: '2025/2026 First Semester Registration Now Open',
        content: 'All Part-Time students are informed that course registration for the first semester of 2025/2026 session is now open. Registration closes on 30th September, 2025. Late registration will attract a penalty fee.',
        audience: 'STUDENT',
        authorId: superAdmin.id,
        priority: 'URGENT',
      },
      {
        title: 'Payment of School Fees',
        content: 'Students are reminded that course registration will not be permitted until school fees and other statutory charges are fully paid and verified by the Bursary Department.',
        audience: 'STUDENT',
        authorId: bursary.id,
        priority: 'HIGH',
      },
      {
        title: 'New Online Helpdesk Available',
        content: 'The ICT Unit has launched a 24/7 online helpdesk. Students can now raise support tickets for any registration, payment, or technical issues directly from the portal.',
        audience: 'ALL',
        authorId: ictAdmin.id,
        priority: 'NORMAL',
      },
    ]
  })

  // Notifications for the first student
  for (let i = 0; i < 5; i++) {
    await db.notification.create({
      data: {
        userId: students[0].userId,
        audience: 'STUDENT',
        title: `Sample notification ${i+1}`,
        message: `This is a sample notification ${i+1} for testing purposes.`,
        type: 'INFO',
      }
    })
  }

  // Audit log entry
  await db.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: 'SYSTEM_SEED',
      category: 'ADMIN_ACTION',
      description: 'System seeded with initial data',
      ipAddress: '127.0.0.1',
    }
  })

  // Settings
  await db.setting.createMany({
    data: [
      { key: 'min_credit_units', value: '15', category: 'registration' },
      { key: 'max_credit_units', value: '24', category: 'registration' },
      { key: 'max_credit_units_500', value: '18', category: 'registration' },
      { key: 'registration_open', value: 'true', category: 'registration' },
      { key: 'portal_name', value: 'ABUAD Part-Time Portal', category: 'general' },
    ]
  })

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📋 LOGIN CREDENTIALS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Super Admin  : superadmin@abuad.edu.ng / Admin@123')
  console.log('ICT Admin    : ict.admin@abuad.edu.ng / Admin@123')
  console.log('Registry     : registry@abuad.edu.ng / Admin@123')
  console.log('Bursary      : bursary@abuad.edu.ng / Admin@123')
  console.log('College Off. : officer.<college-code>@abuad.edu.ng / Admin@123')
  console.log('Coordinator  : coordinator.<dept-code>@abuad.edu.ng / Admin@123')
  console.log('Adviser      : adviser.<dept-code>@abuad.edu.ng / Admin@123')
  console.log('Student      : adewale.adeyemi1@abuad.edu.ng / Student@123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
