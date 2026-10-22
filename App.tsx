import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import {
  Student,
  StudentAccount,
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
} from './types';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { StudentPortal } from './components/StudentPortal';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { StudentAccountManagement } from './components/StudentAccountManagement';
import { BatchManagement } from './components/BatchManagement';
import { AttendanceManagement } from './components/AttendanceManagement';
import { FeeManagement } from './components/FeeManagement';
import { ExamManagement } from './components/ExamManagement';
import { ExaminationAdmitCardManagement } from './components/ExaminationAdmitCardManagement';
import { RoutineManagement } from './components/RoutineManagement';
import { NoticeManagement } from './components/NoticeManagement';
import { ReportManagement } from './components/ReportManagement';
import { SettingsManagement } from './components/SettingsManagement';
import { hashPassword, generateRandomPassword } from './utils/crypto';
import {
  firestoreService,
  createStudentFirebaseAuthAccount,
} from './services/firebase';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function AppContent() {
  const { t, formatNum } = useLanguage();
  // Authentication & Role Session
  const [session, setSession] = useState<AuthSession | null>(() => storage.getSession());

  // Load state from persistent local storage
  const [students, setStudents] = useState<Student[]>(() => storage.getStudents());
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>(() =>
    storage.getStudentAccounts()
  );
  const [batches, setBatches] = useState<Batch[]>(() => storage.getBatches());
  const [attendance, setAttendance] = useState<AttendanceSession[]>(() => storage.getAttendance());
  const [fees, setFees] = useState<FeePayment[]>(() => storage.getFees());
  const [exams, setExams] = useState<Exam[]>(() => storage.getExams());
  const [notices, setNotices] = useState<Notice[]>(() => storage.getNotices());
  const [settings, setSettings] = useState<InstitutionSettings>(() => storage.getSettings());

  // Examination & Admit Card Management State
  const [examinationEvents, setExaminationEvents] = useState<ExaminationEvent[]>(() =>
    storage.getExaminationEvents()
  );
  const [examFeeRecords, setExamFeeRecords] = useState<ExamFeeRecord[]>(() =>
    storage.getExamFeeRecords()
  );
  const [admitCardClearances, setAdmitCardClearances] = useState<AdmitCardClearanceRecord[]>(() =>
    storage.getAdmitCardClearances()
  );
  const [clearanceAuditLogs, setClearanceAuditLogs] = useState<ClearanceAuditLog[]>(() =>
    storage.getClearanceAuditLogs()
  );

  // Active navigation tab for Admin Panel
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Trigger quick add student modal from any view
  const [isAddStudentTriggered, setIsAddStudentTriggered] = useState<boolean>(false);

  // Load and hydrate remote state from Firestore on boot
  useEffect(() => {
    async function loadFirestoreData() {
      try {
        const remote = await firestoreService.fetchAll();
        if (remote) {
          if (remote.students && remote.students.length > 0) {
            setStudents(remote.students);
            storage.saveStudents(remote.students);
          }
          if (remote.batches && remote.batches.length > 0) {
            setBatches(remote.batches);
            storage.saveBatches(remote.batches);
          }
          if (remote.attendance && remote.attendance.length > 0) {
            setAttendance(remote.attendance);
            storage.saveAttendance(remote.attendance);
          }
          if (remote.fees && remote.fees.length > 0) {
            setFees(remote.fees);
            storage.saveFees(remote.fees);
          }
          if (remote.exams && remote.exams.length > 0) {
            setExams(remote.exams);
            storage.saveExams(remote.exams);
          }
          if (remote.notices && remote.notices.length > 0) {
            setNotices(remote.notices);
            storage.saveNotices(remote.notices);
          }
          if (remote.settings) {
            setSettings(remote.settings);
            storage.saveSettings(remote.settings);
          }
          if (remote.examinationEvents && remote.examinationEvents.length > 0) {
            setExaminationEvents(remote.examinationEvents);
            storage.saveExaminationEvents(remote.examinationEvents);
          }
          if (remote.examFeeRecords && remote.examFeeRecords.length > 0) {
            setExamFeeRecords(remote.examFeeRecords);
            storage.saveExamFeeRecords(remote.examFeeRecords);
          }
          if (remote.admitCardClearances && remote.admitCardClearances.length > 0) {
            setAdmitCardClearances(remote.admitCardClearances);
            storage.saveAdmitCardClearances(remote.admitCardClearances);
          }
          if (remote.clearanceAuditLogs && remote.clearanceAuditLogs.length > 0) {
            setClearanceAuditLogs(remote.clearanceAuditLogs);
            storage.saveClearanceAuditLogs(remote.clearanceAuditLogs);
          }
        }
      } catch (err) {
        console.warn('Firestore initial sync note:', err);
      }
    }
    loadFirestoreData();
  }, []);

  // Sync state to storage and Cloud Firestore
  const handleSaveStudent = async (
    savedStudent: Student,
    accountData?: { createAccount: boolean; username: string; initialPassword?: string }
  ) => {
    let authUid: string | undefined = undefined;

    // Create real Firebase Authentication account if enabled
    if (accountData?.createAccount && accountData.initialPassword) {
      try {
        const res = await createStudentFirebaseAuthAccount(
          accountData.username,
          accountData.initialPassword
        );
        authUid = res.uid;
      } catch (authErr: any) {
        console.warn('Firebase Auth account creation notice:', authErr.code || authErr.message);
      }

      // Hash password securely for local resilience
      const hashed = await hashPassword(accountData.initialPassword);
      const accounts = storage.getStudentAccounts();
      const existingAccountIndex = accounts.findIndex(
        (a) =>
          a.studentId === savedStudent.studentId ||
          a.username.toLowerCase() === accountData.username.toLowerCase()
      );

      const studentAccount: StudentAccount = {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        studentId: savedStudent.studentId,
        studentDbId: savedStudent.id,
        username: accountData.username,
        passwordHash: hashed,
        tempPlainPassword: accountData.initialPassword,
        uid: authUid,
        status: 'active',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      };

      let updatedAccounts: StudentAccount[];
      if (existingAccountIndex >= 0) {
        updatedAccounts = [...accounts];
        updatedAccounts[existingAccountIndex] = studentAccount;
      } else {
        updatedAccounts = [studentAccount, ...accounts];
      }
      storage.saveStudentAccounts(updatedAccounts);
      setStudentAccounts(updatedAccounts);
    }

    const studentToSave: Student = {
      ...savedStudent,
      uid: authUid || savedStudent.uid,
      hasAuthAccount: accountData ? accountData.createAccount : savedStudent.hasAuthAccount,
      mustChangePassword: accountData?.createAccount ? true : savedStudent.mustChangePassword,
    };

    setStudents((prev) => {
      const existsIndex = prev.findIndex((s) => s.id === studentToSave.id);
      let updated: Student[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = studentToSave;
      } else {
        updated = [studentToSave, ...prev];
      }
      storage.saveStudents(updated);
      return updated;
    });

    // Save to Firestore
    await firestoreService.saveStudent(
      studentToSave,
      authUid,
      accountData?.createAccount ?? true
    );
  };

  const handleDeleteStudent = async (studentId: string) => {
    const studentToDelete = students.find((s) => s.id === studentId);
    setStudents((prev) => {
      const updated = prev.filter((s) => s.id !== studentId);
      storage.saveStudents(updated);
      return updated;
    });

    // Also remove associated student account
    if (studentToDelete) {
      const updatedAccounts = studentAccounts.filter(
        (a) => a.studentId !== studentToDelete.studentId
      );
      storage.saveStudentAccounts(updatedAccounts);
      setStudentAccounts(updatedAccounts);
    }

    // Delete from Firestore
    await firestoreService.deleteStudent(studentId);
  };

  const handleRefreshAccounts = () => {
    setStudentAccounts(storage.getStudentAccounts());
  };

  const handleSaveBatch = (savedBatch: Batch) => {
    setBatches((prev) => {
      const existsIndex = prev.findIndex((b) => b.id === savedBatch.id);
      let updated: Batch[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = savedBatch;
      } else {
        updated = [...prev, savedBatch];
      }
      storage.saveBatches(updated);
      return updated;
    });
    firestoreService.saveBatch(savedBatch).catch(() => {});
  };

  const handleDeleteBatch = (batchId: string) => {
    setBatches((prev) => {
      const updated = prev.filter((b) => b.id !== batchId);
      storage.saveBatches(updated);
      return updated;
    });
    firestoreService.deleteBatch(batchId).catch(() => {});
  };

  const handleClearDefaultBatches = (batchIds?: string[]) => {
    setBatches((prev) => {
      let updated: Batch[];
      if (batchIds && batchIds.length > 0) {
        const idSet = new Set(batchIds);
        updated = prev.filter((b) => !idSet.has(b.id));
      } else {
        updated = [];
      }
      storage.saveBatches(updated);
      return updated;
    });
    if (batchIds && batchIds.length > 0) {
      batchIds.forEach((id) => firestoreService.deleteBatch(id).catch(() => {}));
    } else {
      batches.forEach((b) => firestoreService.deleteBatch(b.id).catch(() => {}));
    }
  };

  const handleSaveAttendance = (sessionItem: AttendanceSession) => {
    setAttendance((prev) => {
      const existsIndex = prev.findIndex((a) => a.id === sessionItem.id);
      let updated: AttendanceSession[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = sessionItem;
      } else {
        updated = [sessionItem, ...prev];
      }
      storage.saveAttendance(updated);
      return updated;
    });
    firestoreService.saveAttendance(sessionItem).catch(() => {});
  };

  const handleSaveFee = (savedFee: FeePayment) => {
    setFees((prev) => {
      const existsIndex = prev.findIndex((f) => f.id === savedFee.id);
      let updated: FeePayment[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = savedFee;
      } else {
        updated = [savedFee, ...prev];
      }
      storage.saveFees(updated);
      return updated;
    });
    firestoreService.saveFee(savedFee).catch(() => {});
  };

  const handleDeleteFee = (feeId: string) => {
    const feeToDelete = fees.find((f) => f.id === feeId);
    setFees((prev) => {
      const updated = prev.filter((f) => f.id !== feeId);
      storage.saveFees(updated);

      // Re-evaluate student payment status if associated student exists
      if (feeToDelete) {
        const studentRemainingFees = updated.filter((f) => f.studentId === feeToDelete.studentId);
        let newStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (studentRemainingFees.length > 0) {
          const anyDue = studentRemainingFees.some((f) => f.dueAmount > 0);
          const anyPaid = studentRemainingFees.some((f) => f.paidAmount > 0);
          newStatus = anyDue ? (anyPaid ? 'partial' : 'unpaid') : 'paid';
        }
        handleUpdateStudentPaymentStatus(feeToDelete.studentId, newStatus);
      }
      return updated;
    });
    firestoreService.deleteFee(feeId).catch(() => {});
  };

  const handleDeleteMultipleFees = (feeIds: string[]) => {
    const idsSet = new Set(feeIds);
    const feesToDelete = fees.filter((f) => idsSet.has(f.id));
    setFees((prev) => {
      const updated = prev.filter((f) => !idsSet.has(f.id));
      storage.saveFees(updated);

      // Re-evaluate affected students
      const affectedStudentIds = Array.from(new Set(feesToDelete.map((f) => f.studentId)));
      for (const stuId of affectedStudentIds) {
        const remaining = updated.filter((f) => f.studentId === stuId);
        let newStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (remaining.length > 0) {
          const anyDue = remaining.some((f) => f.dueAmount > 0);
          const anyPaid = remaining.some((f) => f.paidAmount > 0);
          newStatus = anyDue ? (anyPaid ? 'partial' : 'unpaid') : 'paid';
        }
        handleUpdateStudentPaymentStatus(stuId, newStatus);
      }
      return updated;
    });
    firestoreService.deleteMultipleFees(feeIds).catch(() => {});
  };

  const handleUpdateStudentPaymentStatus = (
    studentId: string,
    status: 'paid' | 'partial' | 'unpaid'
  ) => {
    setStudents((prev) => {
      const updated = prev.map((s) => (s.id === studentId ? { ...s, paymentStatus: status } : s));
      storage.saveStudents(updated);
      return updated;
    });
  };

  const handleSaveExam = (savedExam: Exam) => {
    setExams((prev) => {
      const existsIndex = prev.findIndex((e) => e.id === savedExam.id);
      let updated: Exam[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = savedExam;
      } else {
        updated = [savedExam, ...prev];
      }
      storage.saveExams(updated);
      return updated;
    });
    firestoreService.saveExam(savedExam).catch(() => {});
  };

  const handleDeleteExam = (examId: string) => {
    setExams((prev) => {
      const updated = prev.filter((e) => e.id !== examId);
      storage.saveExams(updated);
      return updated;
    });
    firestoreService.deleteExam(examId).catch(() => {});
  };

  const handleSaveNotice = (savedNotice: Notice) => {
    setNotices((prev) => {
      const existsIndex = prev.findIndex((n) => n.id === savedNotice.id);
      let updated: Notice[];
      if (existsIndex >= 0) {
        updated = [...prev];
        updated[existsIndex] = savedNotice;
      } else {
        updated = [savedNotice, ...prev];
      }
      storage.saveNotices(updated);
      return updated;
    });
    firestoreService.saveNotice(savedNotice).catch(() => {});
  };

  const handleDeleteNotice = (noticeId: string) => {
    setNotices((prev) => {
      const updated = prev.filter((n) => n.id !== noticeId);
      storage.saveNotices(updated);
      return updated;
    });
    firestoreService.deleteNotice(noticeId).catch(() => {});
  };

  const handleSaveSettings = (newSettings: InstitutionSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    firestoreService.saveSettings(newSettings).catch(() => {});
  };

  const handleRestoreBackup = () => {
    setStudents(storage.getStudents());
    setStudentAccounts(storage.getStudentAccounts());
    setBatches(storage.getBatches());
    setAttendance(storage.getAttendance());
    setFees(storage.getFees());
    setExams(storage.getExams());
    setNotices(storage.getNotices());
    setSettings(storage.getSettings());
    setExaminationEvents(storage.getExaminationEvents());
    setExamFeeRecords(storage.getExamFeeRecords());
    setAdmitCardClearances(storage.getAdmitCardClearances());
    setClearanceAuditLogs(storage.getClearanceAuditLogs());
  };

  const handleSaveExamEvent = (event: ExaminationEvent) => {
    setExaminationEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === event.id);
      const updated = idx >= 0 ? prev.map((e) => (e.id === event.id ? event : e)) : [event, ...prev];
      storage.saveExaminationEvents(updated);
      return updated;
    });
    firestoreService.saveExaminationEvent(event).catch(() => {});
  };

  const handleDeleteExamEvent = (id: string) => {
    setExaminationEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      storage.saveExaminationEvents(updated);
      return updated;
    });
    firestoreService.deleteExaminationEvent(id).catch(() => {});
  };

  const handleSaveExamFeeRecord = (record: ExamFeeRecord) => {
    setExamFeeRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id);
      const updated = idx >= 0 ? prev.map((r) => (r.id === record.id ? record : r)) : [record, ...prev];
      storage.saveExamFeeRecords(updated);
      return updated;
    });
    firestoreService.saveExamFeeRecord(record).catch(() => {});
  };

  const handleSaveClearance = (record: AdmitCardClearanceRecord) => {
    setAdmitCardClearances((prev) => {
      const idx = prev.findIndex((c) => c.id === record.id);
      const updated = idx >= 0 ? prev.map((c) => (c.id === record.id ? record : c)) : [record, ...prev];
      storage.saveAdmitCardClearances(updated);
      return updated;
    });
    firestoreService.saveAdmitCardClearance(record).catch(() => {});
  };

  const handleAddAuditLog = (log: ClearanceAuditLog) => {
    setClearanceAuditLogs((prev) => {
      const updated = [log, ...prev].slice(0, 500);
      storage.addClearanceAuditLog(log);
      return updated;
    });
    firestoreService.addClearanceAuditLog(log).catch(() => {});
  };

  const handleOpenAddStudentFromAnywhere = () => {
    setActiveTab('students');
    setIsAddStudentTriggered(true);
  };

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    storage.clearSession();
    setSession(null);
  };

  // 1. If not authenticated: Show Login View (Student Portal & Admin Login)
  if (!session) {
    return <LoginView settings={settings} onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If authenticated as Student: Show personalized Student Portal
  if (session.role === 'student') {
    return <StudentPortal session={session} settings={settings} onLogout={handleLogout} />;
  }

  // 3. If authenticated as Admin: Show full Admin Panel
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar Header */}
      <Navbar
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickAddStudent={handleOpenAddStudentFromAnywhere}
        onLogout={handleLogout}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            students={students}
            batches={batches}
            attendance={attendance}
            fees={fees}
            exams={exams}
            notices={notices}
            settings={settings}
            setActiveTab={setActiveTab}
            onOpenAddStudent={handleOpenAddStudentFromAnywhere}
          />
        )}

        {activeTab === 'students' && (
          <StudentManagement
            students={students}
            batches={batches}
            fees={fees}
            attendance={attendance}
            exams={exams}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            isAddModalOpenInitially={isAddStudentTriggered}
            onCloseAddModal={() => setIsAddStudentTriggered(false)}
          />
        )}

        {activeTab === 'accounts' && (
          <StudentAccountManagement
            students={students}
            studentAccounts={studentAccounts}
            onRefreshAccounts={handleRefreshAccounts}
          />
        )}

        {activeTab === 'batches' && (
          <BatchManagement
            batches={batches}
            students={students}
            onSaveBatch={handleSaveBatch}
            onDeleteBatch={handleDeleteBatch}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceManagement
            students={students}
            batches={batches}
            attendance={attendance}
            onSaveAttendance={handleSaveAttendance}
          />
        )}

        {activeTab === 'fees' && (
          <FeeManagement
            fees={fees}
            students={students}
            batches={batches}
            settings={settings}
            onSaveFee={handleSaveFee}
            onDeleteFee={handleDeleteFee}
            onDeleteMultipleFees={handleDeleteMultipleFees}
            onUpdateStudentPaymentStatus={handleUpdateStudentPaymentStatus}
          />
        )}

        {activeTab === 'admit-cards' && (
          <ExaminationAdmitCardManagement
            students={students}
            batches={batches}
            examinationEvents={examinationEvents}
            examFeeRecords={examFeeRecords}
            admitCardClearances={admitCardClearances}
            auditLogs={clearanceAuditLogs}
            settings={settings}
            adminUsername={session.username}
            onSaveExamEvent={handleSaveExamEvent}
            onDeleteExamEvent={handleDeleteExamEvent}
            onSaveExamFeeRecord={handleSaveExamFeeRecord}
            onSaveClearance={handleSaveClearance}
            onAddAuditLog={handleAddAuditLog}
          />
        )}

        {activeTab === 'exams' && (
          <ExamManagement
            exams={exams}
            students={students}
            batches={batches}
            settings={settings}
            onSaveExam={handleSaveExam}
            onDeleteExam={handleDeleteExam}
          />
        )}

        {activeTab === 'routine' && (
          <RoutineManagement
            batches={batches}
            settings={settings}
            onSaveBatch={handleSaveBatch}
            onDeleteBatch={handleDeleteBatch}
            onClearDefaultBatches={handleClearDefaultBatches}
          />
        )}

        {activeTab === 'notices' && (
          <NoticeManagement
            notices={notices}
            onSaveNotice={handleSaveNotice}
            onDeleteNotice={handleDeleteNotice}
          />
        )}

        {activeTab === 'reports' && (
          <ReportManagement
            students={students}
            batches={batches}
            attendance={attendance}
            fees={fees}
            exams={exams}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsManagement
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onRestoreBackup={handleRestoreBackup}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              {settings.institutionName || t('app.title', 'T@zul’s Care')}
            </span>
            <span>•</span>
            <span>{t('app.subtitle', 'Student Portal & Coaching Management System')}</span>
          </div>

          <div className="flex items-center gap-4">
            <span>{t('app.classesSupported', 'Classes: 5 - SSC')}</span>
            <span>•</span>
            <span>{t('app.contact', 'Contact')}: {formatNum(settings.phone)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
