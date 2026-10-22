export type ClassLevel =
  | 'class_5'
  | 'class_6'
  | 'class_7'
  | 'class_8'
  | 'class_9'
  | 'class_10';

export interface ClassDefinition {
  id: ClassLevel;
  nameBn: string;
  nameEn: string;
  supportsHigherMath: boolean;
}

export const SUPPORTED_CLASSES: ClassDefinition[] = [
  { id: 'class_5', nameBn: 'পঞ্চম শ্রেণি', nameEn: 'Class 5', supportsHigherMath: false },
  { id: 'class_6', nameBn: 'ষষ্ঠ শ্রেণি', nameEn: 'Class 6', supportsHigherMath: false },
  { id: 'class_7', nameBn: 'সপ্তম শ্রেণি', nameEn: 'Class 7', supportsHigherMath: false },
  { id: 'class_8', nameBn: 'অষ্টম শ্রেণি', nameEn: 'Class 8', supportsHigherMath: false },
  { id: 'class_9', nameBn: 'নবম শ্রেণি', nameEn: 'Class 9', supportsHigherMath: true },
  { id: 'class_10', nameBn: 'দশম শ্রেণি / এসএসসি পরীক্ষার্থী', nameEn: 'Class 10 / SSC Candidate', supportsHigherMath: true },
];

export type SubjectId = 'math' | 'higher_math';

export interface SubjectDefinition {
  id: SubjectId;
  nameBn: string;
  nameEn: string;
  allowedClasses: ClassLevel[];
}

export const SUPPORTED_SUBJECTS: SubjectDefinition[] = [
  {
    id: 'math',
    nameBn: 'গণিত',
    nameEn: 'Mathematics',
    allowedClasses: ['class_5', 'class_6', 'class_7', 'class_8', 'class_9', 'class_10'],
  },
  {
    id: 'higher_math',
    nameBn: 'উচ্চতর গণিত',
    nameEn: 'Higher Mathematics',
    allowedClasses: ['class_9', 'class_10'],
  },
];

export interface Student {
  id: string;
  studentId: string; // e.g. TC-26-001
  username?: string;
  name: string;
  photoUrl?: string;
  guardianName: string;
  guardianPhone: string;
  studentPhone?: string;
  classLevel: ClassLevel;
  enrolledSubjects: SubjectId[]; // 'math' and/or 'higher_math'
  batchId: string;
  admissionDate: string; // YYYY-MM-DD
  monthlyFee: number; // in BDT ৳
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: 'active' | 'inactive';
  notes?: string;
  uid?: string;
  mustChangePassword?: boolean;
  hasAuthAccount?: boolean;
  createdAt: string;
}

export interface StudentAccount {
  id: string;
  studentId: string; // matches Student.studentId
  studentDbId: string; // matches Student.id
  username: string; // studentId or username
  passwordHash: string; // secure SHA-256 hash
  tempPlainPassword?: string; // initial password shown to admin
  uid?: string; // Firebase Auth UID
  authEmail?: string; // internal Firebase Auth email
  status: 'active' | 'deactivated';
  mustChangePassword: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AdminAccount {
  username: string; // 'admin'
  passwordHash: string;
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil?: number;
  updatedAt: string;
}

export type UserRole = 'admin' | 'student';

export interface AuthSession {
  role: UserRole;
  username: string;
  studentId?: string;
  studentDbId?: string;
  name: string;
  token: string;
  loginTime: string;
  expiresAt: number;
}

export interface Batch {
  id: string;
  name: string;
  classLevel: ClassLevel;
  subject: SubjectId;
  teacher: string;
  scheduleDays: string; // e.g. "শনি-সোম-বুধ"
  time: string; // e.g. "০৩:৩০ PM - ০৫:০০ PM"
  room?: string;
  status: 'active' | 'archived';
  notes?: string;
}

export interface AttendanceItem {
  studentId: string; // student.id
  status: 'present' | 'absent' | 'late';
  note?: string;
}

export interface AttendanceSession {
  id: string;
  date: string; // YYYY-MM-DD
  batchId: string;
  classLevel: ClassLevel;
  subject: SubjectId;
  records: AttendanceItem[];
  recordedAt: string;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string; // student.id
  month: string; // e.g. "মার্চ ২০২৬"
  monthlyFee: number;
  paidAmount: number;
  discount: number;
  dueAmount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank';
  status: 'paid' | 'partial' | 'unpaid';
  collectedBy: string;
  notes?: string;
}

export interface ExamResultItem {
  studentId: string; // student.id
  obtainedMarks: number;
  grade: string;
  gpa: number;
  comment?: string;
}

export interface Exam {
  id: string;
  title: string;
  classLevel: ClassLevel;
  subject: SubjectId;
  batchId?: string;
  date: string; // YYYY-MM-DD
  totalMarks: number;
  passMarks: number;
  results: ExamResultItem[];
  isPublished: boolean; // Only published exams show in student portal
  publishedAt?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'important' | 'urgent';
  targetClass: ClassLevel | 'all';
  targetBatchId?: string;
  expiryDate?: string;
}

export interface InstitutionSettings {
  institutionName: string;
  tagline: string;
  directorName: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  academicYear: string;
  currencySymbol: string;
  bkashNumber?: string;
  nagadNumber?: string;
  rocketNumber?: string;
  paymentInstructions?: {
    bkashNumber?: string;
    nagadNumber?: string;
    rocketNumber?: string;
    instructionsBn?: string;
  };
}

// ==========================================
// Examination & Admit Card Management System
// ==========================================

export type ExaminationType = 'monthly' | 'model_test' | 'terminal' | 'other' | string;
export type ExamFeeStatus = 'unpaid' | 'pending' | 'paid' | 'rejected';
export type ClearanceStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export interface ExaminationEvent {
  id: string;
  title: string;
  examType: ExaminationType;
  type?: string; // alias
  classLevels: ClassLevel[];
  batchIds: string[]; // specific batch IDs or empty array for all in selected classes
  subject?: SubjectId | string;
  examDate: string; // YYYY-MM-DD
  examTime: string; // e.g. "10:00 AM - 01:00 PM"
  examFee: number; // 0 if free, or amount in BDT
  centerRoom: string; // e.g. "Room-101, Main Campus"
  room?: string; // alias
  instructions: string; // rules & directives
  status: 'active' | 'completed' | 'cancelled';
  isAdmitCardPublished: boolean;
  admitCardNotice?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExamFeeRecord {
  id: string;
  examId: string;
  examinationId?: string; // alias
  examTitle: string;
  examinationTitle?: string; // alias
  studentId: string; // student's institutional studentId e.g. TC-26-001
  studentDbId?: string; // student's record doc id
  studentName?: string;
  classLevel?: ClassLevel;
  batchId?: string;
  requiredFee: number;
  paidAmount: number;
  paymentDate?: string;
  paymentMethod?: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | string;
  transactionRef?: string;
  transactionId?: string; // alias
  status: ExamFeeStatus;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
  paidAt?: string;
  updatedAt?: string;
}

export interface AdmitCardClearanceRecord {
  id: string;
  examId: string;
  examinationId?: string; // alias
  studentId: string;
  studentDbId?: string;
  studentName?: string;
  examinationTitle?: string; // alias
  classLevel?: ClassLevel;
  batchId?: string;
  clearanceStatus: ClearanceStatus;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  admitCardRef: string; // unique code e.g. AC-TC26001-EX901
  createdAt?: string;
  updatedAt?: string;
}

export interface ClearanceAuditLog {
  id: string;
  action: 'approve_clearance' | 'reject_clearance' | 'revoke_clearance' | 'verify_payment' | 'reject_payment' | 'publish_admit_card' | 'create_exam' | 'payment_submitted' | string;
  reason?: string;
  adminUsername: string;
  studentId: string;
  studentName: string;
  examId?: string;
  examinationId?: string;
  examTitle?: string;
  examinationTitle?: string;
  previousStatus?: string;
  newStatus?: string;
  timestamp: string;
  notes?: string;
}

