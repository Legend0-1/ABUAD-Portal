// ABUAD Portal - Constants and Types

export const ABUAD_INFO = {
  name: 'Afe Babalola University, Ado-Ekiti',
  shortName: 'ABUAD',
  motto: 'Knowledge, Wisdom, Service',
  portalName: 'ABUAD Part-Time Portal',
  address: 'Ado-Ekiti, Ekiti State, Nigeria',
  founded: 2009,
}

export const COLLEGES = [
  { code: 'COS', name: 'College of Sciences' },
  { code: 'COE', name: 'College of Engineering' },
  { code: 'COL', name: 'College of Law' },
  { code: 'COM', name: 'College of Medicine' },
  { code: 'CSM', name: 'College of Social and Management Sciences' },
  { code: 'CAH', name: 'College of Arts and Humanities' },
] as const

export const PROGRAMMES = [
  { code: 'PT', name: 'Part-Time' },
  { code: 'WP', name: 'Weekend Programme' },
  { code: 'EP', name: 'Evening Programme' },
  { code: 'DL', name: 'Distance Learning' },
] as const

export const LEVELS = [
  { value: 'LEVEL_100', label: '100 Level' },
  { value: 'LEVEL_200', label: '200 Level' },
  { value: 'LEVEL_300', label: '300 Level' },
  { value: 'LEVEL_400', label: '400 Level' },
  { value: 'LEVEL_500', label: '500 Level' },
  { value: 'POSTGRADUATE', label: 'Postgraduate' },
] as const

export const SEMESTERS = [
  { value: 'FIRST', label: 'First Semester' },
  { value: 'SECOND', label: 'Second Semester' },
  { value: 'SUMMER', label: 'Summer Semester' },
] as const

export const COURSE_TYPES = [
  { value: 'CORE', label: 'Core', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'ELECTIVE', label: 'Elective', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'GST', label: 'General Studies', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
] as const

export const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Administrator' },
  { value: 'ICT_ADMIN', label: 'ICT Administrator' },
  { value: 'REGISTRY', label: 'Registry' },
  { value: 'COLLEGE_OFFICER', label: 'College Officer' },
  { value: 'DEPARTMENT_COORDINATOR', label: 'Department Coordinator' },
  { value: 'ACADEMIC_ADVISER', label: 'Academic Adviser' },
  { value: 'BURSARY', label: 'Bursary' },
  { value: 'STUDENT', label: 'Student' },
] as const

export const REGISTRATION_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'DRAFT', label: 'Draft', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'PENDING_ADVISER', label: 'Pending Adviser', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'PENDING_COORDINATOR', label: 'Pending Coordinator', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'PENDING_COLLEGE', label: 'Pending College Officer', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'PENDING_REGISTRY', label: 'Pending Registry', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'MODIFICATION_REQUESTED', label: 'Modification Requested', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
] as const

export const APPROVAL_STAGES = [
  { value: 'ADVISER', label: 'Academic Adviser' },
  { value: 'COORDINATOR', label: 'Department Coordinator' },
  { value: 'COLLEGE_OFFICER', label: 'College Officer' },
  { value: 'REGISTRY', label: 'Registry' },
] as const

export const FEE_TYPES = [
  { value: 'SCHOOL_FEES', label: 'School Fees', icon: 'GraduationCap' },
  { value: 'DEPARTMENTAL_FEES', label: 'Departmental Fees', icon: 'Building2' },
  { value: 'ACCEPTANCE_FEES', label: 'Acceptance Fees', icon: 'CheckCircle' },
  { value: 'TECHNOLOGY_FEES', label: 'Technology Fees', icon: 'Cpu' },
  { value: 'ICT_FEES', label: 'ICT Fees', icon: 'Monitor' },
  { value: 'LABORATORY_FEES', label: 'Laboratory Fees', icon: 'FlaskConical' },
  { value: 'LIBRARY_FEES', label: 'Library Fees', icon: 'BookOpen' },
] as const

export const MIN_CREDIT_UNITS = 15
export const MAX_CREDIT_UNITS = 24
export const MAX_CREDIT_UNITS_500 = 18
