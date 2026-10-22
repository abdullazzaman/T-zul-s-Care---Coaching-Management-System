import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Student,
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

// Primary App Initialization
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);

// Helper to map arbitrary Student ID or Username into a secure Firebase Auth identity
export function usernameToAuthEmail(identifier: string): string {
  const clean = identifier
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  return `${clean}@tazulscare.internal`;
}

// Firestore Error Handler as mandated by the Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Verify configuration and network.');
    }
  }
}
testConnection();

/**
 * Creates a real Firebase Authentication student account securely without disturbing
 * the current admin session using an isolated secondary Firebase App instance.
 */
export async function createStudentFirebaseAuthAccount(
  identifier: string,
  initialPass: string
): Promise<{ uid: string; email: string }> {
  const secondaryAppName = `SecondaryAuth_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  try {
    const secondaryAuth = getAuth(secondaryApp);
    const authEmail = usernameToAuthEmail(identifier);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, authEmail, initialPass);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return { uid, email: authEmail };
  } catch (err: any) {
    // If the account already exists in Firebase Auth, we attempt a clean notification
    console.warn('Firebase Auth user creation notice:', err.code || err.message);
    throw err;
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch {
      // Ignored cleanup
    }
  }
}

/**
 * Sign in a student via Firebase Authentication using their Student ID or Username
 */
export async function signInStudentFirebaseAuth(
  identifier: string,
  password: string
): Promise<User> {
  const authEmail = usernameToAuthEmail(identifier);
  const cred = await signInWithEmailAndPassword(auth, authEmail, password);
  return cred.user;
}

/**
 * Update the authenticated student's password
 */
export async function updateStudentAuthPassword(newPassword: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('কোনো সক্রিয় অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে আবার লগইন করুন।');
  }
  await updatePassword(auth.currentUser, newPassword);
}

// -------------------------------------------------------------
// Firestore Database Operations with Schema & Error Protection
// -------------------------------------------------------------

export const firestoreService = {
  // Sync Student
  saveStudent: async (student: Student, uid?: string, mustChangePassword = true) => {
    const path = `students/${student.id}`;
    try {
      const payload: Record<string, any> = {
        studentId: student.studentId,
        username: student.studentId,
        name: student.name,
        photoUrl: student.photoUrl || '',
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        studentPhone: student.studentPhone || '',
        classLevel: student.classLevel,
        enrolledSubjects: student.enrolledSubjects,
        batchId: student.batchId || '',
        admissionDate: student.admissionDate,
        monthlyFee: Number(student.monthlyFee) || 0,
        paymentStatus: student.paymentStatus,
        status: student.status,
        notes: student.notes || '',
        createdAt: student.createdAt,
      };
      if (uid) {
        payload.uid = uid;
        payload.hasAuthAccount = true;
        payload.mustChangePassword = mustChangePassword;
      }
      await setDoc(doc(db, 'students', student.id), payload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  deleteStudent: async (studentId: string) => {
    const path = `students/${studentId}`;
    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  updateStudentPasswordFlag: async (studentDocId: string, mustChangePassword: boolean) => {
    const path = `students/${studentDocId}`;
    try {
      await setDoc(
        doc(db, 'students', studentDocId),
        { mustChangePassword },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Save Batch
  saveBatch: async (batch: Batch) => {
    const path = `batches/${batch.id}`;
    try {
      await setDoc(doc(db, 'batches', batch.id), {
        name: batch.name,
        classLevel: batch.classLevel,
        subject: batch.subject,
        teacher: batch.teacher,
        scheduleDays: batch.scheduleDays,
        time: batch.time,
        room: batch.room || '',
        status: batch.status,
        notes: batch.notes || '',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  deleteBatch: async (batchId: string) => {
    const path = `batches/${batchId}`;
    try {
      await deleteDoc(doc(db, 'batches', batchId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Save Attendance
  saveAttendance: async (session: AttendanceSession) => {
    const path = `attendance/${session.id}`;
    try {
      await setDoc(doc(db, 'attendance', session.id), {
        date: session.date,
        batchId: session.batchId,
        classLevel: session.classLevel,
        subject: session.subject,
        records: session.records,
        recordedAt: session.recordedAt,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save Fee
  saveFee: async (fee: FeePayment) => {
    const path = `fees/${fee.id}`;
    try {
      await setDoc(doc(db, 'fees', fee.id), {
        receiptNo: fee.receiptNo,
        studentId: fee.studentId,
        month: fee.month,
        monthlyFee: Number(fee.monthlyFee) || 0,
        paidAmount: Number(fee.paidAmount) || 0,
        discount: Number(fee.discount) || 0,
        dueAmount: Number(fee.dueAmount) || 0,
        paymentDate: fee.paymentDate,
        paymentMethod: fee.paymentMethod,
        status: fee.status,
        collectedBy: fee.collectedBy,
        notes: fee.notes || '',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  deleteFee: async (feeId: string) => {
    const path = `fees/${feeId}`;
    try {
      await deleteDoc(doc(db, 'fees', feeId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  deleteMultipleFees: async (feeIds: string[]) => {
    try {
      await Promise.all(
        feeIds.map((id) => deleteDoc(doc(db, 'fees', id)).catch(() => {}))
      );
    } catch (err) {
      console.warn('Batch delete fees note:', err);
    }
  },

  // Save Exam
  saveExam: async (exam: Exam) => {
    const path = `exams/${exam.id}`;
    try {
      await setDoc(doc(db, 'exams', exam.id), {
        title: exam.title,
        classLevel: exam.classLevel,
        subject: exam.subject,
        batchId: exam.batchId || '',
        date: exam.date,
        totalMarks: Number(exam.totalMarks) || 100,
        passMarks: Number(exam.passMarks) || 33,
        results: exam.results || [],
        isPublished: exam.isPublished ?? true,
        publishedAt: exam.publishedAt || new Date().toISOString(),
        createdAt: exam.createdAt,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  deleteExam: async (examId: string) => {
    const path = `exams/${examId}`;
    try {
      await deleteDoc(doc(db, 'exams', examId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Save Notice
  saveNotice: async (notice: Notice) => {
    const path = `notices/${notice.id}`;
    try {
      await setDoc(doc(db, 'notices', notice.id), {
        title: notice.title,
        content: notice.content,
        date: notice.date,
        priority: notice.priority,
        targetClass: notice.targetClass,
        targetBatchId: notice.targetBatchId || '',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  deleteNotice: async (noticeId: string) => {
    const path = `notices/${noticeId}`;
    try {
      await deleteDoc(doc(db, 'notices', noticeId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Save Settings
  saveSettings: async (settings: InstitutionSettings) => {
    const path = 'settings/institution';
    try {
      await setDoc(doc(db, 'settings', 'institution'), {
        institutionName: settings.institutionName,
        tagline: settings.tagline || '',
        directorName: settings.directorName || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        logoUrl: settings.logoUrl || '',
        academicYear: settings.academicYear || '',
        currencySymbol: settings.currencySymbol || '৳',
        paymentInstructions: settings.paymentInstructions || {},
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Examination Events (Admit Cards & Formal Exams)
  saveExaminationEvent: async (event: ExaminationEvent) => {
    const path = `examination_events/${event.id}`;
    try {
      await setDoc(doc(db, 'examination_events', event.id), {
        title: event.title,
        examType: event.examType,
        classLevels: event.classLevels,
        batchIds: event.batchIds || [],
        subject: event.subject || '',
        examDate: event.examDate,
        examTime: event.examTime,
        examFee: Number(event.examFee) || 0,
        centerRoom: event.centerRoom || '',
        instructions: event.instructions || '',
        status: event.status || 'active',
        isAdmitCardPublished: Boolean(event.isAdmitCardPublished),
        admitCardNotice: event.admitCardNotice || '',
        createdAt: event.createdAt,
        updatedAt: event.updatedAt || new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  deleteExaminationEvent: async (id: string) => {
    const path = `examination_events/${id}`;
    try {
      await deleteDoc(doc(db, 'examination_events', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Save Exam Fee Record
  saveExamFeeRecord: async (record: ExamFeeRecord) => {
    const path = `exam_fee_records/${record.id}`;
    try {
      await setDoc(doc(db, 'exam_fee_records', record.id), {
        examId: record.examId,
        examTitle: record.examTitle,
        studentId: record.studentId,
        studentDbId: record.studentDbId || '',
        studentName: record.studentName,
        classLevel: record.classLevel,
        batchId: record.batchId || '',
        requiredFee: Number(record.requiredFee) || 0,
        paidAmount: Number(record.paidAmount) || 0,
        paymentDate: record.paymentDate || '',
        paymentMethod: record.paymentMethod || 'cash',
        transactionRef: record.transactionRef || '',
        status: record.status,
        notes: record.notes || '',
        verifiedBy: record.verifiedBy || '',
        verifiedAt: record.verifiedAt || '',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt || new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save Admit Card Clearance Record
  saveAdmitCardClearance: async (clearance: AdmitCardClearanceRecord) => {
    const path = `exam_clearance_records/${clearance.id}`;
    try {
      await setDoc(doc(db, 'exam_clearance_records', clearance.id), {
        examId: clearance.examId,
        studentId: clearance.studentId,
        studentDbId: clearance.studentDbId || '',
        studentName: clearance.studentName,
        classLevel: clearance.classLevel,
        batchId: clearance.batchId || '',
        clearanceStatus: clearance.clearanceStatus,
        approvedBy: clearance.approvedBy || '',
        approvedAt: clearance.approvedAt || '',
        remarks: clearance.remarks || '',
        admitCardRef: clearance.admitCardRef,
        createdAt: clearance.createdAt,
        updatedAt: clearance.updatedAt || new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Add Clearance Audit Log
  addClearanceAuditLog: async (log: ClearanceAuditLog) => {
    const path = `clearance_audit_logs/${log.id}`;
    try {
      await setDoc(doc(db, 'clearance_audit_logs', log.id), {
        action: log.action,
        adminUsername: log.adminUsername,
        studentId: log.studentId,
        studentName: log.studentName,
        examId: log.examId,
        examTitle: log.examTitle,
        previousStatus: log.previousStatus || '',
        newStatus: log.newStatus,
        timestamp: log.timestamp,
        notes: log.notes || '',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Fetch all data from Firestore
  fetchAll: async () => {
    try {
      const [
        studentsSnap,
        batchesSnap,
        attendanceSnap,
        feesSnap,
        examsSnap,
        noticesSnap,
        settingsSnap,
        examEventsSnap,
        examFeesSnap,
        clearancesSnap,
        auditLogsSnap,
      ] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'batches')),
        getDocs(collection(db, 'attendance')),
        getDocs(collection(db, 'fees')),
        getDocs(collection(db, 'exams')),
        getDocs(collection(db, 'notices')),
        getDoc(doc(db, 'settings', 'institution')),
        getDocs(collection(db, 'examination_events')),
        getDocs(collection(db, 'exam_fee_records')),
        getDocs(collection(db, 'exam_clearance_records')),
        getDocs(collection(db, 'clearance_audit_logs')),
      ]);

      const students: Student[] = [];
      studentsSnap.forEach((d) => {
        const data = d.data();
        students.push({
          id: d.id,
          studentId: data.studentId,
          name: data.name,
          photoUrl: data.photoUrl,
          guardianName: data.guardianName,
          guardianPhone: data.guardianPhone,
          studentPhone: data.studentPhone,
          classLevel: data.classLevel,
          enrolledSubjects: data.enrolledSubjects,
          batchId: data.batchId,
          admissionDate: data.admissionDate,
          monthlyFee: data.monthlyFee,
          paymentStatus: data.paymentStatus,
          status: data.status,
          notes: data.notes,
          createdAt: data.createdAt,
        });
      });

      const batches: Batch[] = [];
      batchesSnap.forEach((d) => {
        batches.push({ id: d.id, ...d.data() } as Batch);
      });

      const attendance: AttendanceSession[] = [];
      attendanceSnap.forEach((d) => {
        attendance.push({ id: d.id, ...d.data() } as AttendanceSession);
      });

      const fees: FeePayment[] = [];
      feesSnap.forEach((d) => {
        fees.push({ id: d.id, ...d.data() } as FeePayment);
      });

      const exams: Exam[] = [];
      examsSnap.forEach((d) => {
        exams.push({ id: d.id, ...d.data() } as Exam);
      });

      const notices: Notice[] = [];
      noticesSnap.forEach((d) => {
        notices.push({ id: d.id, ...d.data() } as Notice);
      });

      const examinationEvents: ExaminationEvent[] = [];
      examEventsSnap.forEach((d) => {
        examinationEvents.push({ id: d.id, ...d.data() } as ExaminationEvent);
      });

      const examFeeRecords: ExamFeeRecord[] = [];
      examFeesSnap.forEach((d) => {
        examFeeRecords.push({ id: d.id, ...d.data() } as ExamFeeRecord);
      });

      const admitCardClearances: AdmitCardClearanceRecord[] = [];
      clearancesSnap.forEach((d) => {
        admitCardClearances.push({ id: d.id, ...d.data() } as AdmitCardClearanceRecord);
      });

      const clearanceAuditLogs: ClearanceAuditLog[] = [];
      auditLogsSnap.forEach((d) => {
        clearanceAuditLogs.push({ id: d.id, ...d.data() } as ClearanceAuditLog);
      });

      const settings = settingsSnap.exists()
        ? (settingsSnap.data() as InstitutionSettings)
        : null;

      return {
        students,
        batches,
        attendance,
        fees,
        exams,
        notices,
        settings,
        examinationEvents,
        examFeeRecords,
        admitCardClearances,
        clearanceAuditLogs,
      };
    } catch (err) {
      console.warn('Firestore initial fetch fallback:', err);
      return null;
    }
  },
};
