import {
  Student,
  StudentAccount,
  AdminAccount,
  AuthSession,
  Batch,
  AttendanceSession,
  FeePayment,
  Exam,
  Notice,
  InstitutionSettings,
  ExaminationEvent,
  ExamFeeRecord,
  AdmitCardClearanceRecord,
  ClearanceAuditLog,
} from '../types';
import { hashPassword, verifyPassword, generateRandomPassword } from '../utils/crypto';

const STORAGE_KEYS = {
  STUDENTS: 'tzc_students_v2',
  STUDENT_ACCOUNTS: 'tzc_student_accounts_v2',
  ADMIN_ACCOUNT: 'tzc_admin_account_v2',
  AUTH_SESSION: 'tzc_auth_session_v2',
  BATCHES: 'tzc_batches_v2',
  ATTENDANCE: 'tzc_attendance_v2',
  FEES: 'tzc_fees_v2',
  EXAMS: 'tzc_exams_v2',
  NOTICES: 'tzc_notices_v2',
  SETTINGS: 'tzc_settings_v2',
  EXAMINATION_EVENTS: 'tzc_examination_events_v1',
  EXAM_FEE_RECORDS: 'tzc_exam_fee_records_v1',
  ADMIT_CARD_CLEARANCES: 'tzc_exam_clearances_v1',
  CLEARANCE_AUDIT_LOGS: 'tzc_clearance_audit_logs_v1',
};

export const DEFAULT_SETTINGS: InstitutionSettings = {
  institutionName: 'T@zul’s Care',
  tagline: 'গণিত ও উচ্চতর গণিত স্পেশাল কেয়ার',
  directorName: 'তাজুল স্যার',
  phone: '01712-345678',
  email: 'tazuls.care@gmail.com',
  address: 'বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা',
  logoUrl: '',
  academicYear: '২০২৬',
  currencySymbol: '৳',
  paymentInstructions: {
    bkashNumber: '01712-345678 (Personal / Send Money)',
    nagadNumber: '01712-345678 (Personal / Send Money)',
    rocketNumber: '01712-345678-9',
    instructionsBn: 'বিকাশ বা নগদ থেকে সেন্ড মানি করে ট্রানজ্যাকশন আইডি ও শিক্ষার্থীর আইডি সংরক্ষণ করুন এবং কোচিং অফিসে অবহিত করুন।',
  },
};

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'batch_c10_math',
    name: 'Class 10 গণিত (SSC Special)',
    classLevel: 'class_10',
    subject: 'math',
    teacher: 'তাজুল স্যার',
    scheduleDays: 'শনি, সোম, বুধ',
    time: '০৩:৩০ PM - ০৫:০০ PM',
    room: 'রুম-১০১',
    status: 'active',
  },
  {
    id: 'batch_c10_hmath',
    name: 'Class 10 উচ্চতর গণিত (SSC Special)',
    classLevel: 'class_10',
    subject: 'higher_math',
    teacher: 'তাজুল স্যার',
    scheduleDays: 'রবি, মঙ্গল, বৃহঃ',
    time: '০৩:৩০ PM - ০৫:০০ PM',
    room: 'রুম-১০১',
    status: 'active',
  },
  {
    id: 'batch_c9_math',
    name: 'Class 9 সাধারণ গণিত',
    classLevel: 'class_9',
    subject: 'math',
    teacher: 'তাজুল স্যার',
    scheduleDays: 'শনি, সোম, বুধ',
    time: '০৫:০০ PM - ০৬:৩০ PM',
    room: 'রুম-১০২',
    status: 'active',
  },
  {
    id: 'batch_c9_hmath',
    name: 'Class 9 উচ্চতর গণিত',
    classLevel: 'class_9',
    subject: 'higher_math',
    teacher: 'তাজুল স্যার',
    scheduleDays: 'রবি, মঙ্গল, বৃহঃ',
    time: '০৫:০০ PM - ০৬:৩০ PM',
    room: 'রুম-১০২',
    status: 'active',
  },
  {
    id: 'batch_c8_math',
    name: 'Class 8 গণিত স্পেশাল',
    classLevel: 'class_8',
    subject: 'math',
    teacher: 'তাজুল স্যার',
    scheduleDays: 'শনি, সোম, বুধ',
    time: '০৬:৩০ PM - ০৮:০০ PM',
    room: 'রুম-১০১',
    status: 'active',
  },
  {
    id: 'batch_c7_math',
    name: 'Class 7 গণিত ব্যাচ',
    classLevel: 'class_7',
    subject: 'math',
    teacher: 'তাজুল স্যার',
    scheduleDays: 'রবি, মঙ্গল, বৃহঃ',
    time: '০৬:৩০ PM - ০৭:৪৫ PM',
    room: 'রুম-১০১',
    status: 'active',
  },
  {
    id: 'batch_c6_math',
    name: 'Class 6 গণিত ফাউন্ডেশন',
    classLevel: 'class_6',
    subject: 'math',
    teacher: 'তাজুল স্যার',
    scheduleDays: 'শনি, সোম, বুধ',
    time: '০২:০০ PM - ০৩:১৫ PM',
    room: 'রুম-১০২',
    status: 'active',
  },
  {
    id: 'batch_c5_math',
    name: 'Class 5 গণিত প্রিপারেশন',
    classLevel: 'class_5',
    subject: 'math',
    teacher: 'তাজুল স্যার',
    scheduleDays: 'রবি, মঙ্গল, বৃহঃ',
    time: '০২:০০ PM - ০৩:১৫ PM',
    room: 'রুম-১০২',
    status: 'active',
  },
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'notice-1',
    title: 'টি@জুল’স কেয়ার (T@zul’s Care) স্টুডেন্ট পোর্টালে স্বাগতম!',
    content: 'সকল শিক্ষার্থী এখন তাদের ব্যক্তিগত পোর্টাল থেকে ক্লাসের রুটিন, দৈনিক উপস্থিতি, পরীক্ষার ফলাফল এবং বেতনের রশিদ দেখতে পারবে।',
    date: new Date().toISOString().split('T')[0],
    priority: 'important',
    targetClass: 'all',
  },
];

// Pure localStorage wrapper with error resilience & full database features
export const storage = {
  // Students (Clean start: empty array, NO DEMO STUDENTS)
  getStudents: (): Student[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  saveStudents: (students: Student[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save students:', e);
    }
  },

  // Student Accounts
  getStudentAccounts: (): StudentAccount[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENT_ACCOUNTS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  saveStudentAccounts: (accounts: StudentAccount[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENT_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save student accounts:', e);
    }
  },

  // Admin Account
  getAdminAccount: async (): Promise<AdminAccount> => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIN_ACCOUNT);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}

    // Initialize default admin with secure hash
    const initialHash = await hashPassword('admin1234');
    const defaultAdmin: AdminAccount = {
      username: 'admin',
      passwordHash: initialHash,
      mustChangePassword: true, // Requires changing password on first login
      failedAttempts: 0,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.ADMIN_ACCOUNT, JSON.stringify(defaultAdmin));
    return defaultAdmin;
  },
  saveAdminAccount: (acc: AdminAccount): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_ACCOUNT, JSON.stringify(acc));
    } catch (e) {
      console.error('Failed to save admin account:', e);
    }
  },

  // Session Management
  getSession: (): AuthSession | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (!data) return null;
      const session: AuthSession = JSON.parse(data);
      // Check expiration
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },
  saveSession: (session: AuthSession | null): void => {
    try {
      if (!session) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      } else {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
      }
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  },
  clearSession: (): void => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  },

  // Batches
  getBatches: (): Batch[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
        return INITIAL_BATCHES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_BATCHES;
    }
  },
  saveBatches: (batches: Batch[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    } catch (e) {
      console.error('Failed to save batches:', e);
    }
  },

  // Attendance
  getAttendance: (): AttendanceSession[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveAttendance: (sessions: AttendanceSession[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save attendance:', e);
    }
  },

  // Fees
  getFees: (): FeePayment[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEES);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveFees: (fees: FeePayment[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(fees));
    } catch (e) {
      console.error('Failed to save fees:', e);
    }
  },
  deleteFee: (feeId: string): FeePayment[] => {
    try {
      const fees = storage.getFees().filter((f) => f.id !== feeId);
      storage.saveFees(fees);
      return fees;
    } catch {
      return [];
    }
  },
  deleteMultipleFees: (feeIds: string[]): FeePayment[] => {
    try {
      const idsSet = new Set(feeIds);
      const fees = storage.getFees().filter((f) => !idsSet.has(f.id));
      storage.saveFees(fees);
      return fees;
    } catch {
      return [];
    }
  },

  // Exams
  getExams: (): Exam[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
      if (!data) return [];
      const parsed: Exam[] = JSON.parse(data);
      // Ensure backward-compatibility: isPublished default true if missing
      return parsed.map((e) => ({ ...e, isPublished: e.isPublished !== false }));
    } catch {
      return [];
    }
  },
  saveExams: (exams: Exam[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    } catch (e) {
      console.error('Failed to save exams:', e);
    }
  },

  // Notices
  getNotices: (): Notice[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTICES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(INITIAL_NOTICES));
        return INITIAL_NOTICES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_NOTICES;
    }
  },
  saveNotices: (notices: Notice[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    } catch (e) {
      console.error('Failed to save notices:', e);
    }
  },

  // Settings
  getSettings: (): InstitutionSettings => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  saveSettings: (settings: InstitutionSettings): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  // Examination Events (for Admit Cards & Formal Exams)
  getExaminationEvents: (): ExaminationEvent[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAMINATION_EVENTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveExaminationEvents: (events: ExaminationEvent[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXAMINATION_EVENTS, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save examination events:', e);
    }
  },
  saveExaminationEvent: (event: ExaminationEvent): ExaminationEvent[] => {
    const list = storage.getExaminationEvents();
    const idx = list.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      list[idx] = event;
    } else {
      list.unshift(event);
    }
    storage.saveExaminationEvents(list);
    return list;
  },
  deleteExaminationEvent: (id: string): ExaminationEvent[] => {
    const list = storage.getExaminationEvents().filter((e) => e.id !== id);
    storage.saveExaminationEvents(list);
    return list;
  },

  // Examination Fee Records
  getExamFeeRecords: (): ExamFeeRecord[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAM_FEE_RECORDS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveExamFeeRecords: (records: ExamFeeRecord[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXAM_FEE_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save exam fee records:', e);
    }
  },
  saveExamFeeRecord: (record: ExamFeeRecord): ExamFeeRecord[] => {
    const list = storage.getExamFeeRecords();
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    storage.saveExamFeeRecords(list);
    return list;
  },

  // Admit Card Clearance Records
  getAdmitCardClearances: (): AdmitCardClearanceRecord[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIT_CARD_CLEARANCES);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveAdmitCardClearances: (records: AdmitCardClearanceRecord[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIT_CARD_CLEARANCES, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save admit card clearances:', e);
    }
  },
  saveAdmitCardClearance: (record: AdmitCardClearanceRecord): AdmitCardClearanceRecord[] => {
    const list = storage.getAdmitCardClearances();
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    storage.saveAdmitCardClearances(list);
    return list;
  },

  // Clearance Audit Logs
  getClearanceAuditLogs: (): ClearanceAuditLog[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLEARANCE_AUDIT_LOGS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },
  saveClearanceAuditLogs: (logs: ClearanceAuditLog[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLEARANCE_AUDIT_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save audit logs:', e);
    }
  },
  addClearanceAuditLog: (log: ClearanceAuditLog): void => {
    try {
      const list = storage.getClearanceAuditLogs();
      list.unshift(log);
      // Keep maximum recent 500 audit logs
      const trimmed = list.slice(0, 500);
      localStorage.setItem(STORAGE_KEYS.CLEARANCE_AUDIT_LOGS, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to record audit log:', e);
    }
  },

  // Export full database backup
  exportBackup: () => {
    return JSON.stringify(
      {
        version: '2.1',
        exportedAt: new Date().toISOString(),
        institution: storage.getSettings().institutionName,
        students: storage.getStudents(),
        studentAccounts: storage.getStudentAccounts(),
        batches: storage.getBatches(),
        attendance: storage.getAttendance(),
        fees: storage.getFees(),
        exams: storage.getExams(),
        notices: storage.getNotices(),
        settings: storage.getSettings(),
        examinationEvents: storage.getExaminationEvents(),
        examFeeRecords: storage.getExamFeeRecords(),
        admitCardClearances: storage.getAdmitCardClearances(),
        clearanceAuditLogs: storage.getClearanceAuditLogs(),
      },
      null,
      2
    );
  },

  // Import full database backup
  importBackup: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.students)) storage.saveStudents(data.students);
      if (Array.isArray(data.studentAccounts)) storage.saveStudentAccounts(data.studentAccounts);
      if (Array.isArray(data.batches)) storage.saveBatches(data.batches);
      if (Array.isArray(data.attendance)) storage.saveAttendance(data.attendance);
      if (Array.isArray(data.fees)) storage.saveFees(data.fees);
      if (Array.isArray(data.exams)) storage.saveExams(data.exams);
      if (Array.isArray(data.notices)) storage.saveNotices(data.notices);
      if (data.settings && typeof data.settings === 'object') storage.saveSettings(data.settings);
      if (Array.isArray(data.examinationEvents)) storage.saveExaminationEvents(data.examinationEvents);
      if (Array.isArray(data.examFeeRecords)) storage.saveExamFeeRecords(data.examFeeRecords);
      if (Array.isArray(data.admitCardClearances)) storage.saveAdmitCardClearances(data.admitCardClearances);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  // Data Authorization Gateway for Student Portal
  // Strictly isolates Student A from Student B's data
  getStudentPersonalData: (studentId: string) => {
    const allStudents = storage.getStudents();
    const currentStudent = allStudents.find((s) => s.studentId === studentId);
    if (!currentStudent) return null;

    const batches = storage.getBatches();
    const studentBatch = batches.find((b) => b.id === currentStudent.batchId);
    const studentBatches = batches.filter(
      (b) =>
        b.id === currentStudent.batchId ||
        (b.classLevel === currentStudent.classLevel &&
          currentStudent.enrolledSubjects.includes(b.subject))
    );

    // Filter attendance for only this student
    const allAttendance = storage.getAttendance();
    const studentAttendance = allAttendance
      .filter((sess) => sess.records.some((r) => r.studentId === currentStudent.id))
      .map((sess) => {
        const item = sess.records.find((r) => r.studentId === currentStudent.id)!;
        return {
          id: sess.id,
          date: sess.date,
          classLevel: sess.classLevel,
          subject: sess.subject,
          batchId: sess.batchId,
          status: item.status,
          note: item.note,
        };
      });

    // Filter fee records for only this student
    const allFees = storage.getFees();
    const studentFees = allFees.filter((f) => f.studentId === currentStudent.id);

    // Filter exams: only published exams that include this student's result
    const allExams = storage.getExams();
    const publishedExams = allExams
      .filter((ex) => ex.isPublished && ex.results.some((r) => r.studentId === currentStudent.id))
      .map((ex) => {
        const result = ex.results.find((r) => r.studentId === currentStudent.id)!;
        return {
          id: ex.id,
          title: ex.title,
          classLevel: ex.classLevel,
          subject: ex.subject,
          date: ex.date,
          totalMarks: ex.totalMarks,
          passMarks: ex.passMarks,
          obtainedMarks: result.obtainedMarks,
          grade: result.grade,
          gpa: result.gpa,
          comment: result.comment,
        };
      });

    // Filter notices targeted to 'all' or this student's class
    const allNotices = storage.getNotices();
    const authorizedNotices = allNotices.filter(
      (n: Notice) => n.targetClass === 'all' || n.targetClass === currentStudent.classLevel
    );
    // Filter examination events assigned to this student's class or batch
    const allExamEvents = storage.getExaminationEvents();
    const studentExamEvents = allExamEvents.filter((ev) => {
      const matchClass = ev.classLevels.includes(currentStudent.classLevel);
      const matchBatch = ev.batchIds.length === 0 || (currentStudent.batchId && ev.batchIds.includes(currentStudent.batchId));
      return matchClass || matchBatch;
    });

    // Filter examination fees for this student
    const allExamFees = storage.getExamFeeRecords();
    const studentExamFees = allExamFees.filter(
      (f) =>
        f.studentId === currentStudent.studentId ||
        (f.studentDbId && f.studentDbId === currentStudent.id)
    );

    // Filter admit card clearances for this student
    const allClearances = storage.getAdmitCardClearances();
    const studentClearances = allClearances.filter(
      (c) =>
        c.studentId === currentStudent.studentId ||
        (c.studentDbId && c.studentDbId === currentStudent.id)
    );

    return {
      student: currentStudent,
      batch: studentBatch,
      studentBatches,
      attendance: studentAttendance,
      fees: studentFees,
      exams: publishedExams,
      notices: authorizedNotices,
      examinationEvents: studentExamEvents,
      examFeeRecords: studentExamFees,
      admitCardClearances: studentClearances,
    };
  },
};

