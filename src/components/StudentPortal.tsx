import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  User,
  Layers,
  Clock,
  CalendarCheck,
  CreditCard,
  Award,
  Bell,
  KeyRound,
  LogOut,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Printer,
  ChevronRight,
  TrendingUp,
  MapPin,
  Check,
  Sigma,
  Calculator,
  Ticket,
  QrCode,
  Download,
  Eye,
  DollarSign,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  AuthSession,
  InstitutionSettings,
  Student,
  Batch,
  Notice,
  ClassLevel,
  SubjectId,
  ExaminationEvent,
  ExamFeeRecord,
  AdmitCardClearanceRecord,
  ClearanceAuditLog,
} from '../types';
import { storage } from '../services/storage';
import { hashPassword, verifyPassword } from '../utils/crypto';
import {
  toBengaliNumber,
  formatTaka,
  getClassName,
  getClassShortName,
  getSubjectShortName,
  getCurrentMonthNameBn,
} from '../utils/helpers';
import { updateStudentAuthPassword, firestoreService } from '../services/firebase';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { AdmitCardDocument } from './AdmitCardDocument';
import { evaluateAdmitCardAccess } from '../utils/admitCardAuth';

interface StudentPortalProps {
  session: AuthSession;
  settings: InstitutionSettings;
  onLogout: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  session,
  settings,
  onLogout,
}) => {
  const { t, language, formatNum } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Password Change Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // Student Phone Edit (Only allowed personal field for student)
  const [studentPhoneInput, setStudentPhoneInput] = useState('');
  const [phoneSaveSuccess, setPhoneSaveSuccess] = useState(false);

  // Load authorized data strictly for this student
  const studentData = storage.getStudentPersonalData(session.studentId || '');

  // Admit card examination state
  const [examFeeRecords, setExamFeeRecords] = useState<ExamFeeRecord[]>(
    () => studentData?.examFeeRecords || []
  );
  const [admitCardClearances, setAdmitCardClearances] = useState<AdmitCardClearanceRecord[]>(
    () => studentData?.admitCardClearances || []
  );

  // Selected exam for viewing admit card modal
  const [selectedAdmitCardExam, setSelectedAdmitCardExam] = useState<ExaminationEvent | null>(null);
  const [selectedClearance, setSelectedClearance] = useState<AdmitCardClearanceRecord | null>(null);

  // Exam fee payment submission modal state
  const [payingExam, setPayingExam] = useState<ExaminationEvent | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank' | 'Cash'>('bKash');
  const [trxId, setTrxId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (studentData?.student?.studentPhone) {
      setStudentPhoneInput(studentData.student.studentPhone);
    }
  }, [studentData?.student?.studentPhone]);

  useEffect(() => {
    if (studentData?.examFeeRecords) {
      setExamFeeRecords(studentData.examFeeRecords);
    }
    if (studentData?.admitCardClearances) {
      setAdmitCardClearances(studentData.admitCardClearances);
    }
  }, [studentData?.examFeeRecords, studentData?.admitCardClearances]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentTime(formatNum(timeStr));

      const bngMonths = [
        'জানুয়ারি',
        'ফেব্রুয়ারি',
        'মার্চ',
        'এপ্রিল',
        'মে',
        'জুন',
        'জুলাই',
        'আগস্ট',
        'সেপ্টেম্বর',
        'অক্টোবর',
        'নভেম্বর',
        'ডিসেম্বর',
      ];
      const enMonths = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      if (language === 'bn') {
        const day = formatNum(now.getDate());
        const month = bngMonths[now.getMonth()];
        const year = formatNum(now.getFullYear());
        setCurrentDate(`${day} ${month}, ${year}`);
      } else {
        const day = now.getDate();
        const month = enMonths[now.getMonth()];
        const year = now.getFullYear();
        setCurrentDate(`${month} ${day}, ${year}`);
      }
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, [language, formatNum]);

  if (!studentData || !studentData.student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">
            {language === 'bn' ? 'শিক্ষার্থীর তথ্য পাওয়া যায়নি' : 'Student Record Not Found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {language === 'bn'
              ? 'আপনার অ্যাকাউন্টের সাথে কোনো সক্রিয় শিক্ষার্থীর রেকর্ড মেলেনি। অনুগ্রহ করে কোচিং অফিসে যোগাযোগ করুন।'
              : 'No active student record matched your account. Please contact the coaching office.'}
          </p>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold"
          >
            {t('nav.logout', 'লগআউট')}
          </button>
        </div>
      </div>
    );
  }

  const { student, batch, attendance, fees, exams, notices, examinationEvents = [] } = studentData;

  // Calculate Attendance Stats
  const totalClasses = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const lateCount = attendance.filter((a) => a.status === 'late').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const attendanceRate =
    totalClasses > 0 ? Math.round(((presentCount + lateCount) / totalClasses) * 100) : 0;

  // Current Month Fee Calculation
  const currentMonthName = getCurrentMonthNameBn();
  const currentMonthFeeRecord = fees.find((f) => f.month === currentMonthName);
  const totalPaid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalDue = fees.reduce((sum, f) => sum + (f.dueAmount || 0), 0);

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(false);

    if (newPassword.length < 6) {
      setPasswordChangeError(
        language === 'bn'
          ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
          : 'New password must be at least 6 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError(
        language === 'bn'
          ? 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।'
          : 'New password and confirmation password do not match.'
      );
      return;
    }

    const accounts = storage.getStudentAccounts();
    const account = accounts.find((a) => a.studentId === student.studentId);
    if (!account) {
      setPasswordChangeError(
        language === 'bn' ? 'অ্যাকাউন্ট পাওয়া যায়নি।' : 'Student account not found.'
      );
      return;
    }

    const isMatch = await verifyPassword(oldPassword, account.passwordHash);
    if (!isMatch) {
      setPasswordChangeError(
        language === 'bn' ? 'বর্তমান পাসওয়ার্ড সঠিক নয়।' : 'Current password is incorrect.'
      );
      return;
    }

    const newHash = await hashPassword(newPassword);
    account.passwordHash = newHash;
    account.mustChangePassword = false;
    account.tempPlainPassword = undefined;
    storage.saveStudentAccounts(accounts);

    if (student.id) {
      firestoreService.updateStudentPasswordFlag(student.id, false).catch(() => {});
    }

    try {
      await updateStudentAuthPassword(newPassword);
    } catch (authErr) {
      console.warn('Firebase Auth password update note in portal:', authErr);
    }

    setPasswordChangeSuccess(true);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordChangeSuccess(false), 4000);
  };

  // Handle Student Phone Update
  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const studentsList = storage.getStudents();
    const idx = studentsList.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      studentsList[idx].studentPhone = studentPhoneInput.trim();
      storage.saveStudents(studentsList);
      setPhoneSaveSuccess(true);
      setTimeout(() => setPhoneSaveSuccess(false), 3000);
    }
  };

  // Handle Open Fee Payment Modal
  const handleOpenPaymentModal = (exam: ExaminationEvent) => {
    setPayingExam(exam);
    setPaymentAmount(exam.examFee || 0);
    setPaymentMethod('bKash');
    setTrxId('');
    setPaymentNote('');
    setPaymentSuccessMsg(null);
  };

  // Handle Submit Exam Fee Payment (Creates ExamFeeRecord with status 'pending' awaiting admin verification)
  const handleSubmitExamFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingExam || !student) return;

    setPaymentSubmitting(true);
    try {
      const existing = examFeeRecords.find(
        (r: ExamFeeRecord) => r.examId === payingExam.id || r.examinationId === payingExam.id
      );
      const feeRecord: ExamFeeRecord = {
        id: existing?.id || `exfee_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        examId: payingExam.id,
        examinationId: payingExam.id,
        examTitle: payingExam.title,
        examinationTitle: payingExam.title,
        studentId: student.studentId,
        studentDbId: student.id,
        studentName: student.name,
        classLevel: student.classLevel,
        requiredFee: payingExam.examFee,
        paidAmount: Number(paymentAmount),
        status: 'pending', // Awaiting Admin verification!
        paymentMethod: paymentMethod.toLowerCase() as any,
        transactionRef: trxId.trim() || undefined,
        transactionId: trxId.trim() || undefined,
        paymentDate: new Date().toISOString().split('T')[0],
        paidAt: new Date().toISOString(),
        notes: paymentNote.trim() || undefined,
      };

      storage.saveExamFeeRecord(feeRecord);
      await firestoreService.saveExamFeeRecord(feeRecord).catch(() => {});

      // Record audit log
      const auditLog: ClearanceAuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        studentId: student.studentId,
        studentName: student.name,
        examId: payingExam.id,
        examinationId: payingExam.id,
        examTitle: payingExam.title,
        examinationTitle: payingExam.title,
        action: 'payment_submitted',
        reason: `Student submitted exam fee payment of ৳${paymentAmount} via ${paymentMethod} (TrxID: ${trxId || 'N/A'})`,
        adminUsername: student.studentId,
        timestamp: new Date().toISOString(),
      };
      storage.addClearanceAuditLog(auditLog);
      firestoreService.addClearanceAuditLog(auditLog).catch(() => {});

      setExamFeeRecords((prev) => {
        const idx = prev.findIndex((r) => r.id === feeRecord.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = feeRecord;
          return updated;
        }
        return [feeRecord, ...prev];
      });

      setPaymentSuccessMsg(
        language === 'bn'
          ? 'আপনার ফি পরিশোধের তথ্য সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন যাচাইয়ের পর অ্যাডমিট কার্ড দেওয়া হবে।'
          : 'Payment details submitted successfully! Admit card will be available after admin verification.'
      );

      setTimeout(() => {
        setPaymentSubmitting(false);
        setPayingExam(null);
        setPaymentSuccessMsg(null);
      }, 1800);
    } catch (err) {
      console.error('Error submitting exam fee:', err);
      setPaymentSubmitting(false);
    }
  };

  const navMenuItems = [
    { id: 'dashboard', label: t('nav.myDashboard', 'আমার ড্যাশবোর্ড'), icon: LayoutDashboard },
    { id: 'profile', label: t('nav.myProfile', 'আমার প্রোফাইল'), icon: User },
    { id: 'batch', label: t('nav.myBatch', 'আমার ক্লাস ও ব্যাচ'), icon: Layers },
    { id: 'routine', label: t('nav.myRoutine', 'ক্লাস রুটিন'), icon: Clock },
    { id: 'attendance', label: t('nav.myAttendance', 'আমার উপস্থিতি'), icon: CalendarCheck },
    { id: 'fees', label: t('nav.myFees', 'আমার বেতন'), icon: CreditCard },
    { id: 'admit-card', label: t('nav.myAdmitCard', 'অ্যাডমিট কার্ড'), icon: Ticket },
    { id: 'results', label: t('nav.myResults', 'পরীক্ষার ফলাফল'), icon: Award },
    { id: 'notices', label: t('nav.noticeBoard', 'নোটিশ বোর্ড'), icon: Bell },
    { id: 'password', label: t('nav.changePassword', 'পাসওয়ার্ড পরিবর্তন'), icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="bg-slate-900 text-slate-300 px-4 py-1 text-xs font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                স্টুডেন্ট পোর্টাল (Student Portal)
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-slate-300">{settings.institutionName}</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>{currentDate}</span>
              <span>•</span>
              <span>{currentTime}</span>
              <LanguageSelector variant="dark" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.institutionName}
                  className="h-10 w-10 object-contain rounded-lg border border-slate-200"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-linear-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Sigma className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {settings.institutionName || 'T@zul’s Care'}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  {getClassShortName(student.classLevel)} • {student.enrolledSubjects.map((s) => getSubjectShortName(s)).join(' ও ')}
                </p>
              </div>
            </div>

            {/* Student Info & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                    {student.name.slice(0, 1)}
                  </div>
                )}
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {student.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    ID: {student.studentId}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition"
                title="লগআউট করুন"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center space-x-1 border-t border-slate-100 py-1 overflow-x-auto no-scrollbar">
            {navMenuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Personalized Welcome Banner */}
            <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/30">
                  {getClassName(student.classLevel)} • শিক্ষাবর্ষ {toBengaliNumber(settings.academicYear)}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold">
                  স্বাগতম, {student.name}!
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
                  টি@জুল’স কেয়ার স্টুডেন্ট পোর্টালে আপনার স্বাগতম। এখান থেকে আপনার গণিত ও উচ্চতর গণিতের ক্লাস রুটিন, উপস্থিতি ও পরীক্ষার ফলাফল সহজেই দেখতে পারবেন।
                </p>
              </div>
            </div>

            {/* Examination & Admit Card Banner on Dashboard */}
            {examinationEvents.length > 0 && (
              <div className="bg-linear-to-r from-blue-700 to-indigo-800 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <Ticket className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {language === 'bn'
                        ? `আসন্ন পরীক্ষা ও ডিজিটাল অ্যাডমিট কার্ড (${formatNum(examinationEvents.length)} টি পরীক্ষা)`
                        : `Upcoming Examinations & Admit Cards (${formatNum(examinationEvents.length)} Exams)`}
                    </h4>
                    <p className="text-xs text-blue-100 mt-0.5">
                      {language === 'bn'
                        ? 'পরীক্ষার ফি পরিশোধ করে আপনার অফিসিয়াল অ্যাডমিট কার্ড সংগ্রহ বা প্রিন্ট করুন।'
                        : 'Verify exam fees and retrieve or print your official admit card.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('admit-card')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white hover:bg-blue-50 text-blue-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition active:scale-95"
                >
                  <Ticket className="w-4 h-4 text-blue-700" />
                  <span>{t('nav.myAdmitCard', 'অ্যাডমিট কার্ড দেখুন')}</span>
                  <ChevronRight className="w-4 h-4 text-blue-700" />
                </button>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-bold block">উপস্থিতির হার</span>
                <div className="mt-2 text-2xl font-extrabold text-emerald-700 font-sans">
                  {totalClasses > 0 ? `${toBengaliNumber(attendanceRate)}%` : '০%'}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  মোট ক্লাস: {toBengaliNumber(totalClasses)} টি
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-bold block">নির্ধারিত মাসিক বেতন</span>
                <div className="mt-2 text-2xl font-extrabold text-slate-900 font-sans">
                  {formatTaka(student.monthlyFee)}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  চলতি মাস: {currentMonthName}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-bold block">বকেয়া ব্যালেন্স</span>
                <div className="mt-2 text-2xl font-extrabold text-rose-600 font-sans">
                  {formatTaka(totalDue)}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {totalDue === 0 ? 'সকল ফি পরিশোধিত' : 'পরিশোধের অনুরোধ'}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 font-bold block">পরীক্ষার ফলাফল</span>
                <div className="mt-2 text-2xl font-extrabold text-purple-700 font-sans">
                  {toBengaliNumber(exams.length)} টি
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">প্রকাশিত ফলাফল</span>
              </div>
            </div>

            {/* Two Column Grid: Batch & Routine + Recent Notices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Batch & Schedule */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-700" />
                    আমার ব্যাচ ও ক্লাসের সময়সূচী
                  </h3>
                  <button
                    onClick={() => setActiveTab('routine')}
                    className="text-xs text-blue-700 font-bold hover:underline"
                  >
                    সম্পূর্ণ রুটিন
                  </button>
                </div>

                {batch ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{batch.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {getSubjectShortName(batch.subject)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>দিন: {batch.scheduleDays}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>সময়: {batch.time}</span>
                      </div>
                      {batch.room && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>কক্ষ: {batch.room}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>শিক্ষক: {batch.teacher}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    বর্তমানে কোনো নির্দিষ্ট ব্যাচ বরাদ্দ নেই।
                  </p>
                )}
              </div>

              {/* Latest Notices */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-rose-600" />
                    সর্বশেষ নোটিশ ও ঘোষণা
                  </h3>
                  <button
                    onClick={() => setActiveTab('notices')}
                    className="text-xs text-blue-700 font-bold hover:underline"
                  >
                    সকল নোটিশ
                  </button>
                </div>

                <div className="space-y-2.5">
                  {notices.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      কোনো নতুন নোটিশ নেই।
                    </p>
                  ) : (
                    notices.slice(0, 3).map((n: Notice) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900">{n.title}</h5>
                          <span className="text-[10px] font-mono text-slate-400">
                            {toBengaliNumber(n.date)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{n.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. My Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-700 font-black text-2xl flex items-center justify-center border-2 border-blue-200">
                  {student.name.slice(0, 1)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
                <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  আইডি: {student.studentId}
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  ভর্তির তারিখ: {toBengaliNumber(student.admissionDate)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  একাডেমিক তথ্য
                </span>
                <div>
                  <span className="text-slate-500">শ্রেণি:</span>
                  <strong className="block text-slate-800 text-sm">{getClassName(student.classLevel)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">ভর্তিযোগ্য বিষয়সমূহ:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {student.enrolledSubjects.map((s) => (
                      <span key={s} className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                        {getSubjectShortName(s)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">নির্ধারিত ব্যাচ:</span>
                  <strong className="block text-slate-800 font-medium">
                    {batch ? batch.name : 'ব্যাচ বরাদ্দ নেই'}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  অভিভাবক ও যোগাযোগ
                </span>
                <div>
                  <span className="text-slate-500">অভিভাবকের নাম:</span>
                  <strong className="block text-slate-800 text-sm">{student.guardianName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">অভিভাবকের মোবাইল:</span>
                  <strong className="block text-slate-800 font-mono text-sm">{student.guardianPhone}</strong>
                </div>
                <div>
                  <span className="text-slate-500">মাসিক বেতন:</span>
                  <strong className="block text-slate-800 font-sans text-sm">{formatTaka(student.monthlyFee)}</strong>
                </div>
              </div>
            </div>

            {/* Allowed personal edit: Student Mobile */}
            <form onSubmit={handleSavePhone} className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">
                ব্যক্তিগত মোবাইল নম্বর আপডেট (ঐচ্ছিক)
              </h4>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="tel"
                  value={studentPhoneInput}
                  onChange={(e) => setStudentPhoneInput(e.target.value)}
                  placeholder="018XXXXXXXX"
                  className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
              {phoneSaveSuccess && (
                <span className="text-[11px] text-emerald-700 font-bold block">
                  মোবাইল নম্বর সফলভাবে আপডেট হয়েছে!
                </span>
              )}
            </form>
          </div>
        )}

        {/* 3. My Class & Batch */}
        {activeTab === 'batch' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-700" />
                আমার নির্ধারিত ক্লাস ও ব্যাচের বিবরণ
              </h3>
              <p className="text-xs text-slate-500">
                আপনার একাডেমিক শ্রেণি ও বিষয়ভিত্তিক নির্ধারিত ব্যাচ
              </p>
            </div>

            {batch ? (
              <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900">{batch.name}</h4>
                  <span className="bg-blue-100 text-blue-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
                    {getSubjectShortName(batch.subject)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">শ্রেণি</span>
                    <strong className="text-slate-800 font-bold text-sm">
                      {getClassName(batch.classLevel)}
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">ক্লাসের দিনসমূহ</span>
                    <strong className="text-slate-800 font-bold text-sm">
                      {batch.scheduleDays}
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">সময়সূচি</span>
                    <strong className="text-slate-800 font-bold text-sm font-mono">
                      {batch.time}
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">শিক্ষক ও কক্ষ</span>
                    <strong className="text-slate-800 font-bold text-sm">
                      {batch.teacher} {batch.room ? `(${batch.room})` : ''}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-xs text-slate-500">বর্তমানে কোনো ব্যাচ বরাদ্দ নেই।</p>
              </div>
            )}
          </div>
        )}

        {/* 4. Class Routine */}
        {activeTab === 'routine' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-700" />
                  আমার সাপ্তাহিক ক্লাস রুটিন
                </h3>
                <p className="text-xs text-slate-500">
                  আপনার শ্রেণির গণিত ও উচ্চতর গণিত ক্লাসের সময়সূচী
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                রুটিন প্রিন্ট
              </button>
            </div>

            {(() => {
              const myBatches =
                studentData.studentBatches && studentData.studentBatches.length > 0
                  ? studentData.studentBatches
                  : batch
                  ? [batch]
                  : [];

              if (myBatches.length === 0) {
                return (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    বর্তমানে আপনার শ্রেণির জন্য কোনো রুটিন বা ব্যাচ নির্ধারিত নেই
                  </p>
                );
              }

              return (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">ব্যাচ ও বিষয়</th>
                        <th className="p-3">দিনসমূহ</th>
                        <th className="p-3">সময়সূচী</th>
                        <th className="p-3">শিক্ষক</th>
                        <th className="p-3">রুম</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myBatches.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70">
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{b.name}</span>
                            <span className="text-[11px] font-semibold text-blue-700">
                              {getSubjectShortName(b.subject)}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{b.scheduleDays}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{b.time}</td>
                          <td className="p-3 text-slate-700">{b.teacher}</td>
                          <td className="p-3 text-slate-600">{b.room || 'রুম-১০১'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* 5. My Attendance */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600" />
                আমার উপস্থিতির ইতিহাস ও বিবরণী
              </h3>
              <p className="text-xs text-slate-500">
                আপনার প্রতিটি ক্লাসের উপস্থিতি ও সামগ্রিক শতকরা হার
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-500 block">মোট ক্লাস</span>
                <strong className="text-xl font-bold text-slate-900 font-sans mt-1 block">
                  {toBengaliNumber(totalClasses)}
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-emerald-700 block font-semibold">উপস্থিত</span>
                <strong className="text-xl font-bold text-emerald-800 font-sans mt-1 block">
                  {toBengaliNumber(presentCount)}
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-amber-800 block font-semibold">দেরিতে এসেছে</span>
                <strong className="text-xl font-bold text-amber-800 font-sans mt-1 block">
                  {toBengaliNumber(lateCount)}
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-rose-700 block font-semibold">অনুপস্থিত</span>
                <strong className="text-xl font-bold text-rose-700 font-sans mt-1 block">
                  {toBengaliNumber(absentCount)}
                </strong>
              </div>
            </div>

            {attendance.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-xs text-slate-500">এখনো কোনো ক্লাসের হাজিরা রেকর্ড করা হয়নি।</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">বিষয়</th>
                      <th className="p-3 text-center">উপস্থিতি স্ট্যাটাস</th>
                      <th className="p-3">নোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-slate-800">
                          {toBengaliNumber(att.date)}
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {getSubjectShortName(att.subject)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              att.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : att.status === 'late'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {att.status === 'present'
                              ? 'উপস্থিত'
                              : att.status === 'late'
                              ? 'দেরিতে'
                              : 'অনুপস্থিত'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{att.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 6. My Fees */}
        {activeTab === 'fees' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-700" />
                আমার মাসিক বেতন ও ফি হিসাব
              </h3>
              <p className="text-xs text-slate-500">
                কোচিং এর মাসিক বেতন, প্রাপ্ত পেমেন্ট ও বকেয়া হিসাব
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">নির্ধারিত মাসিক বেতন</span>
                <strong className="text-xl font-bold text-slate-900 font-sans mt-1 block">
                  {formatTaka(student.monthlyFee)}
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block font-semibold">সর্বমোট পরিশোধিত</span>
                <strong className="text-xl font-bold text-emerald-800 font-sans mt-1 block">
                  {formatTaka(totalPaid)}
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-rose-700 block font-semibold">মোট বকেয়া</span>
                <strong className="text-xl font-bold text-rose-700 font-sans mt-1 block">
                  {formatTaka(totalDue)}
                </strong>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs text-amber-900">
              <h4 className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-700" />
                বেতন পরিশোধের নির্দেশনাবলী
              </h4>
              <p className="leading-relaxed">
                {settings.paymentInstructions?.instructionsBn ||
                  'বিকাশ বা নগদ থেকে সেন্ড মানি করে ট্রানজ্যাকশন আইডি ও শিক্ষার্থীর আইডি সংরক্ষণ করুন এবং অফিসে অবহিত করুন।'}
              </p>
              <div className="flex flex-wrap gap-4 pt-1 font-mono font-bold text-amber-900 text-xs">
                {settings.paymentInstructions?.bkashNumber && (
                  <span>bKash: {settings.paymentInstructions.bkashNumber}</span>
                )}
                {settings.paymentInstructions?.nagadNumber && (
                  <span>Nagad: {settings.paymentInstructions.nagadNumber}</span>
                )}
              </div>
            </div>

            {/* Payment History Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                পরিশোধের ইতিহাস
              </h4>
              {fees.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">এখনো কোনো ফি পরিশোধের রেকর্ড নেই।</p>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">রশিদ নং</th>
                        <th className="p-3">মাস</th>
                        <th className="p-3">পরিশোধের তারিখ</th>
                        <th className="p-3 text-right">প্রাপ্ত টাকা</th>
                        <th className="p-3 text-right">বকেয়া</th>
                        <th className="p-3 text-center">মাধ্যম</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fees.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-bold text-slate-800">{f.receiptNo}</td>
                          <td className="p-3 font-semibold text-slate-700">{f.month}</td>
                          <td className="p-3 font-mono">{toBengaliNumber(f.paymentDate)}</td>
                          <td className="p-3 text-right font-bold text-emerald-700 font-sans">
                            {formatTaka(f.paidAmount)}
                          </td>
                          <td className="p-3 text-right font-bold text-rose-600 font-sans">
                            {formatTaka(f.dueAmount)}
                          </td>
                          <td className="p-3 text-center uppercase font-bold text-[10px] text-slate-600">
                            {f.paymentMethod}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Exam Results */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-700" />
                আমার পরীক্ষার ফলাফল ও মূল্যায়ন
              </h3>
              <p className="text-xs text-slate-500">
                গণিত ও উচ্চতর গণিতের অধ্যায়ভিত্তিক ও মডেল টেস্ট পরীক্ষার প্রকাশিত নম্বরপত্র
              </p>
            </div>

            {exams.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Award className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  এখনো কোনো পরীক্ষার ফলাফল প্রকাশিত হয়নি। পরীক্ষা সম্পন্ন ও ফলাফল প্রকাশিত হলে এখানে প্রদর্শিত হবে।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.map((exam) => {
                  const percentage = Math.round((exam.obtainedMarks / exam.totalMarks) * 100);
                  const isPass = exam.obtainedMarks >= exam.passMarks;

                  return (
                    <div
                      key={exam.id}
                      className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {getSubjectShortName(exam.subject)}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          তারিখ: {toBengaliNumber(exam.date)}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900">{exam.title}</h4>

                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">পূর্ণমান</span>
                          <strong className="text-slate-800 font-sans">{toBengaliNumber(exam.totalMarks)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">প্রাপ্ত নম্বর</span>
                          <strong className="text-purple-700 text-base font-extrabold font-sans">
                            {toBengaliNumber(exam.obtainedMarks)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">গ্রেড ও জিপিএ</span>
                          <strong className={`text-sm font-bold ${isPass ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {exam.grade} ({exam.gpa.toFixed(2)})
                          </strong>
                        </div>
                      </div>

                      {exam.comment && (
                        <p className="text-[11px] text-slate-600 italic bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                          মন্তব্য: {exam.comment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 8. Notice Board */}
        {activeTab === 'notices' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-600" />
                নোটিশ বোর্ড (বিজ্ঞপ্তি ও ঘোষণা)
              </h3>
              <p className="text-xs text-slate-500">
                আপনার শ্রেণি ও কোচিং সংক্রান্ত প্রয়োজনীয় নোটিশসমূহ
              </p>
            </div>

            {notices.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">বর্তমানে কোনো সক্রিয় নোটিশ নেই।</p>
            ) : (
              <div className="space-y-3">
                {notices.map((n: Notice) => (
                  <div
                    key={n.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          n.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : n.priority === 'important'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {n.priority === 'urgent'
                          ? 'জরুরি নোটিশ'
                          : n.priority === 'important'
                          ? 'গুরুত্বপূর্ণ'
                          : 'সাধারণ নোটিশ'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        তারিখ: {toBengaliNumber(n.date)}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{n.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 9. Change Password */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-lg mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-700" />
                পাসওয়ার্ড পরিবর্তন করুন
              </h3>
              <p className="text-xs text-slate-500">
                নিরাপত্তার স্বার্থে নিয়মিত নিজস্ব পাসওয়ার্ড পরিবর্তন করুন
              </p>
            </div>

            {passwordChangeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4" />
                পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!
              </div>
            )}

            {passwordChangeError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {passwordChangeError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বর্তমান পাসওয়ার্ড*
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)*
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="নতুন গোপন পাসওয়ার্ড"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড পুনরায় লিখুন*
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="একই নতুন পাসওয়ার্ড লিখুন"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition active:scale-95"
              >
                পাসওয়ার্ড পরিবর্তন করুন
              </button>
            </form>
          </div>
        )}

        {/* 10. Admit Card & Examination Tab */}
        {activeTab === 'admit-card' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                  <Ticket className="w-6 h-6 text-blue-700" />
                  {t('admitCards.myTitle', 'আমার পরীক্ষার অ্যাডমিট কার্ড')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'bn'
                    ? 'পরীক্ষার ফি পরিশোধ ও অ্যাডমিন ক্লিয়ারেন্স সাপেক্ষে ডিজিটাল অ্যাডমিট কার্ড ডাউনলোড ও প্রিন্ট করুন'
                    : 'Download and print digital admit cards subject to fee verification and administrator clearance'}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-200 px-3.5 py-2 rounded-2xl text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{getClassName(student.classLevel)} • ID: {student.studentId}</span>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 text-xs text-slate-700 space-y-1.5">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                {language === 'bn' ? 'অ্যাডমিট কার্ড প্রাপ্তির নিয়মাবলী:' : 'Admit Card Clearance Process:'}
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] sm:text-xs">
                <li>
                  {language === 'bn'
                    ? 'নির্ধারিত পরীক্ষার ফি মোবাইল ব্যাংকিং (bKash/Nagad/Rocket) বা অফিসে জমা দিন।'
                    : 'Pay the specified examination fee via mobile banking or coaching office.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'নিচে "ফি পরিশোধের তথ্য দিন" বাটনে ট্রানজেকশন আইডি (TrxID) দিয়ে সাবমিট করুন।'
                    : 'Submit your payment TrxID using the "Submit Exam Fee" button below.'}
                </li>
                <li>
                  {language === 'bn'
                    ? 'অ্যাডমিন ফি যাচাই ও ক্লিয়ারেন্স অনুমোদন করলে QR কোডসহ প্রিন্টযোগ্য অ্যাডমিট কার্ড প্রদর্শিত হবে।'
                    : 'Once verified & cleared by administration, your official QR-verified admit card will be accessible.'}
                </li>
              </ol>
            </div>

            {/* Examination Cards List */}
            {examinationEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <Ticket className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  {language === 'bn'
                    ? 'বর্তমানে আপনার শ্রেণি বা ব্যাচের জন্য কোনো সক্রিয় পরীক্ষা নির্ধারিত নেই'
                    : 'No active examinations are currently assigned to your class'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {language === 'bn'
                    ? 'কোচিং কর্তৃপক্ষ নতুন পরীক্ষা প্রকাশ করলে এখানে তার বিবরণ ও অ্যাডমিট কার্ড প্রদর্শিত হবে।'
                    : 'When administration schedules a new exam, details and admit cards will appear here.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {examinationEvents.map((exam: ExaminationEvent) => {
                  const feeRec = examFeeRecords.find(
                    (r: ExamFeeRecord) => r.examId === exam.id || r.examinationId === exam.id
                  );
                  const clrRec = admitCardClearances.find(
                    (c: AdmitCardClearanceRecord) =>
                      (c.examId === exam.id || c.examinationId === exam.id) &&
                      c.studentId === student.studentId
                  );
                  const auth = evaluateAdmitCardAccess(student, exam, feeRec, clrRec);
                  const displayType = exam.examType || exam.type || 'Monthly Examination';

                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* Exam Header */}
                      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                displayType === 'Model Test Examination' || displayType === 'model_test'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : displayType === 'Monthly Examination' || displayType === 'monthly'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {displayType}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {exam.subject || 'সকল বিষয়'}
                            </span>
                          </div>
                          <h4 className="text-lg sm:text-xl font-bold text-slate-900">{exam.title}</h4>
                        </div>

                        {/* Fee Status Badge */}
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                              auth.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : auth.paymentStatus === 'pending'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {auth.paymentStatus === 'paid' ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : auth.paymentStatus === 'pending' ? (
                              <Clock className="w-3.5 h-3.5" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5" />
                            )}
                            {auth.paymentStatus === 'paid'
                              ? language === 'bn'
                                ? 'ফি পরিশোধিত'
                                : 'Fee Paid'
                              : auth.paymentStatus === 'pending'
                              ? language === 'bn'
                                ? 'ফি যাচাই অপেক্ষমাণ'
                                : 'Payment Pending Verification'
                              : language === 'bn'
                              ? 'ফি অপরিশোধিত'
                              : 'Fee Unpaid'}
                          </span>
                        </div>
                      </div>

                      {/* Exam Details Grid */}
                      <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs border-b border-slate-100">
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 font-semibold block text-[11px]">
                            {language === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'}
                          </span>
                          <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                            {formatNum(exam.examDate)} • {formatNum(exam.examTime)}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 font-semibold block text-[11px]">
                            {language === 'bn' ? 'পরীক্ষা কক্ষ / কেন্দ্র' : 'Center / Room'}
                          </span>
                          <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                            {exam.centerRoom || exam.room || (language === 'bn' ? 'টি@জুল’স কেয়ার ভবন' : 'Main Center')}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 font-semibold block text-[11px]">
                            {language === 'bn' ? 'নির্ধারিত ফি' : 'Required Fee'}
                          </span>
                          <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                            {formatTaka(exam.examFee)}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 font-semibold block text-[11px]">
                            {language === 'bn' ? 'পরিশোধিত অংক' : 'Amount Paid'}
                          </span>
                          <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                            {formatTaka(auth.feePaid)}
                          </span>
                        </div>
                      </div>

                      {/* Instructions */}
                      {exam.instructions && (
                        <div className="px-5 sm:px-6 py-3 bg-amber-50/50 border-b border-amber-100 text-xs text-amber-900">
                          <span className="font-bold">{language === 'bn' ? 'নির্দেশনা: ' : 'Notice: '}</span>
                          {exam.instructions}
                        </div>
                      )}

                      {/* Strict 6-Condition Clearance / Admit Card Status Banner */}
                      <div className="p-5 sm:p-6 bg-slate-50/40">
                        {/* CASE D: APPROVED & Published (Access Granted) */}
                        {auth.canAccess && auth.accessCase === 'APPROVED' ? (
                          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <CheckCircle className="w-6 h-6" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-emerald-900">
                                  {language === 'bn'
                                    ? 'আপনার অ্যাডমিট কার্ড প্রস্তুত।'
                                    : 'Your admit card is ready.'}
                                </h5>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                  {language === 'bn'
                                    ? `ক্লিয়ারেন্স সম্পন্ন হয়েছে (রেফারেন্স: ${auth.admitCardRef})। পরীক্ষায় প্রবেশের জন্য অ্যাডমিট কার্ডের প্রিন্ট কপি সঙ্গে আনা আবশ্যক।`
                                    : `Clearance approved (Ref: ${auth.admitCardRef}). You must bring a printed copy of this admit card to the examination.`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 w-full md:w-auto">
                              <button
                                onClick={() => {
                                  setSelectedAdmitCardExam(exam);
                                  setSelectedClearance(clrRec || null);
                                }}
                                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                {language === 'bn' ? 'অ্যাডমিট কার্ড দেখুন' : 'View Admit Card'}
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedAdmitCardExam(exam);
                                  setSelectedClearance(clrRec || null);
                                  setTimeout(() => window.print(), 400);
                                }}
                                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                                title="প্রিন্ট করুন"
                              >
                                <Printer className="w-4 h-4" />
                                <span className="hidden sm:inline">{language === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                              </button>
                            </div>
                          </div>
                        ) : auth.accessCase === 'REVOKED' ? (
                          /* CASE E: REVOKED */
                          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-sm font-bold text-rose-900">
                                {language === 'bn'
                                  ? 'আপনার অ্যাডমিট কার্ড ক্লিয়ারেন্স বাতিল করা হয়েছে। অনুগ্রহ করে অফিসে যোগাযোগ করুন।'
                                  : 'Your admit card clearance has been revoked. Please contact the office.'}
                              </h5>
                              <p className="text-xs text-rose-700">
                                {language === 'bn'
                                  ? `কোচিং অফিসে সরাসরি বা ফোনে যোগাযোগ করুন: ${formatNum(settings.phone)}`
                                  : `Please contact the coaching office directly or call: ${formatNum(settings.phone)}`}
                              </p>
                            </div>
                          </div>
                        ) : auth.accessCase === 'CLEARANCE_PENDING' ? (
                          /* CASE C: CLEARANCE PENDING */
                          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-amber-900">
                                {language === 'bn'
                                  ? 'আপনার পেমেন্ট যাচাই হয়েছে। অ্যাডমিট কার্ডের জন্য অ্যাডমিন ক্লিয়ারেন্স অপেক্ষমাণ।'
                                  : 'Your payment has been verified. Your admit card is awaiting administrator clearance.'}
                              </h5>
                              <p className="text-xs text-amber-700 mt-0.5">
                                {language === 'bn'
                                  ? 'অ্যাডমিন ক্লিয়ারেন্স অনুমোদন করার পর অবিলম্বে এখানে আপনার ডিজিটাল অ্যাডমিট কার্ড উন্মুক্ত হবে।'
                                  : 'As soon as the administrator issues clearance, your admit card will become available here.'}
                              </p>
                            </div>
                          </div>
                        ) : auth.accessCase === 'PAYMENT_PENDING' ? (
                          /* CASE B: PAYMENT PENDING */
                          <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-sky-900">
                                  {language === 'bn'
                                    ? 'আপনার পেমেন্ট যাচাইয়ের অপেক্ষায় রয়েছে।'
                                    : 'Your payment is awaiting verification.'}
                                </h5>
                                <p className="text-xs text-sky-700 mt-0.5">
                                  {language === 'bn'
                                    ? `জমা দেওয়া মাধ্যম: ${feeRec?.paymentMethod || 'মোবাইল ব্যাংকিং'} ${
                                        feeRec?.transactionRef || feeRec?.transactionId
                                          ? `(TrxID: ${feeRec.transactionRef || feeRec.transactionId})`
                                          : ''
                                      }`
                                    : `Submitted via: ${feeRec?.paymentMethod || 'Mobile Banking'} ${
                                        feeRec?.transactionRef || feeRec?.transactionId
                                          ? `(TrxID: ${feeRec.transactionRef || feeRec.transactionId})`
                                          : ''
                                      }`}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleOpenPaymentModal(exam)}
                              className="text-xs font-bold text-sky-800 bg-white border border-sky-300 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition"
                            >
                              {language === 'bn' ? 'তথ্য পরিবর্তন / রি-সাবমিট' : 'Update TrxID'}
                            </button>
                          </div>
                        ) : auth.accessCase === 'UNPAID' ? (
                          /* CASE A: UNPAID */
                          <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-rose-900">
                                  {language === 'bn'
                                    ? 'পরীক্ষার ফি পরিশোধ করা হয়নি। ফি পরিশোধ ও যাচাই সম্পন্ন হলে অ্যাডমিট কার্ড পাওয়া যাবে।'
                                    : 'Your examination fee has not been paid. Your admit card will become available after payment and verification.'}
                                </h5>
                                <p className="text-xs text-rose-700 mt-0.5">
                                  {language === 'bn'
                                    ? `নির্ধারিত ফি: ${formatTaka(exam.examFee)}। ফি জমা দিয়ে নিচে ট্রানজেকশন তথ্য সাবমিট করুন।`
                                    : `Required fee: ${formatTaka(exam.examFee)}. Pay fee and submit your payment details below.`}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleOpenPaymentModal(exam)}
                              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-rose-700 hover:bg-rose-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
                            >
                              <DollarSign className="w-4 h-4" />
                              {language === 'bn' ? 'ফি পরিশোধের তথ্য দিন' : 'Submit Exam Fee Payment'}
                            </button>
                          </div>
                        ) : (
                          /* Fallback or UNPUBLISHED */
                          <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2.5">
                            <Info className="w-4 h-4 text-slate-500" />
                            <span>
                              {language === 'bn'
                                ? 'ক্লিয়ারেন্স সম্পন্ন হয়েছে। কর্তৃপক্ষ কর্তৃক অ্যাডমিট কার্ড প্রকাশের অপেক্ষায় রয়েছে।'
                                : 'Clearance complete. Awaiting administrator publication.'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal: Submit Exam Fee Payment */}
        {payingExam && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">
                    {language === 'bn' ? 'পরীক্ষার ফি পরিশোধ' : 'Exam Fee Submission'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{payingExam.title}</h3>
                  <p className="text-xs text-slate-500">
                    {language === 'bn'
                      ? 'নির্ধারিত নম্বরে ফি পাঠিয়ে ট্রানজেকশন আইডি দিন'
                      : 'Send fee to coaching account and enter your transaction ID'}
                  </p>
                </div>
                <button
                  onClick={() => setPayingExam(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Coaching Banking Numbers Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  {language === 'bn' ? 'কোচিংয়ের পেমেন্ট নম্বরসমূহ:' : 'Coaching Payment Numbers:'}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(settings.paymentInstructions?.bkashNumber || settings.bkashNumber) && (
                    <div className="bg-white p-2 rounded-lg border border-pink-100">
                      <span className="text-[10px] text-pink-600 font-bold block">bKash (বিকাশ)</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatNum(settings.paymentInstructions?.bkashNumber || settings.bkashNumber || '')}
                      </span>
                    </div>
                  )}
                  {(settings.paymentInstructions?.nagadNumber || settings.nagadNumber) && (
                    <div className="bg-white p-2 rounded-lg border border-orange-100">
                      <span className="text-[10px] text-orange-600 font-bold block">Nagad (নগদ)</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatNum(settings.paymentInstructions?.nagadNumber || settings.nagadNumber || '')}
                      </span>
                    </div>
                  )}
                  {(settings.paymentInstructions?.rocketNumber || settings.rocketNumber) && (
                    <div className="bg-white p-2 rounded-lg border border-purple-100">
                      <span className="text-[10px] text-purple-600 font-bold block">Rocket (রকেট)</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatNum(settings.paymentInstructions?.rocketNumber || settings.rocketNumber || '')}
                      </span>
                    </div>
                  )}
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-blue-600 font-bold block">
                      {language === 'bn' ? 'অফিস ক্যাশ' : 'Cash at Office'}
                    </span>
                    <span className="text-slate-700 font-medium">
                      {language === 'bn' ? 'সরাসরি অফিস রুমে' : 'Direct Cash Desk'}
                    </span>
                  </div>
                </div>
              </div>

              {paymentSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitExamFee} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'bn' ? 'পেমেন্ট মাধ্যম*' : 'Payment Method*'}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                      required
                    >
                      <option value="bKash">bKash (বিকাশ)</option>
                      <option value="Nagad">Nagad (নগদ)</option>
                      <option value="Rocket">Rocket (রকেট)</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Cash">{language === 'bn' ? 'অফিস ক্যাশ' : 'Cash at Office'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'bn' ? 'পরিশোধিত টাকার পরিমাণ (৳)*' : 'Amount (৳)*'}
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID) / স্লিপ নম্বর' : 'Transaction ID (TrxID) / Slip'}
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder={paymentMethod === 'Cash' ? 'ক্যাশ রসিদ বা স্লিপ নম্বর (ঐচ্ছিক)' : 'যেমন: BKA1234XYZ'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'প্রেরক মোবাইল নম্বর / নোট' : 'Sender Phone / Note'}
                  </label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন (যেমন: 017xxxxxxxx)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayingExam(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    {t('common.cancel', 'বাতিল')}
                  </button>
                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {paymentSubmitting
                      ? language === 'bn'
                        ? 'জমা হচ্ছে...'
                        : 'Submitting...'
                      : language === 'bn'
                      ? 'পেমেন্ট তথ্য সাবমিট করুন'
                      : 'Submit Payment Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Admit Card Document Viewer */}
        {selectedAdmitCardExam && (
          <AdmitCardDocument
            student={student}
            batch={batch}
            exam={selectedAdmitCardExam}
            clearance={
              selectedClearance || {
                id: `clr_${student.studentId}_${selectedAdmitCardExam.id}`,
                examId: selectedAdmitCardExam.id,
                examinationId: selectedAdmitCardExam.id,
                studentId: student.studentId,
                studentName: student.name,
                examinationTitle: selectedAdmitCardExam.title,
                clearanceStatus: 'approved',
                admitCardRef: `AC-${student.studentId}-${selectedAdmitCardExam.id.slice(-4)}`,
                approvedAt: new Date().toISOString(),
                approvedBy: 'Administrator',
              }
            }
            settings={settings}
            onClose={() => setSelectedAdmitCardExam(null)}
            isModal={true}
          />
        )}
      </main>

      {/* Student Portal Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          <span>{settings.institutionName} • স্টুডেন্ট পোর্টাল</span>
          <span className="mx-2">•</span>
          <span>সহায়তার জন্য যোগাযোগ: {settings.phone}</span>
        </div>
      </footer>
    </div>
  );
};
