import React, { useState } from 'react';
import {
  GraduationCap,
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  HelpCircle,
  KeyRound,
  Sigma,
  Loader2,
  Sparkles,
  Phone,
  MapPin,
  X,
} from 'lucide-react';
import { InstitutionSettings, AuthSession } from '../types';
import { storage } from '../services/storage';
import { hashPassword, verifyPassword } from '../utils/crypto';
import {
  signInStudentFirebaseAuth,
  updateStudentAuthPassword,
  firestoreService,
} from '../services/firebase';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface LoginViewProps {
  settings: InstitutionSettings;
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ settings, onLoginSuccess }) => {
  const { t, language, formatNum } = useLanguage();
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');

  // Student Form
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Admin Form
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // First-time change password modal
  const [mustChangePasswordSession, setMustChangePasswordSession] = useState<{
    role: 'admin' | 'student';
    username: string;
    studentId?: string;
    studentDbId?: string;
    name: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeLoading, setChangeLoading] = useState(false);

  // Handle Student Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);

    const cleanId = studentId.trim();
    const cleanPass = studentPassword.trim();

    if (!cleanId || !cleanPass) {
      setStudentError(
        t('login.errorEmpty', 'অনুগ্রহ করে শিক্ষার্থী আইডি এবং পাসওয়ার্ড উভয়ই প্রদান করুন।')
      );
      return;
    }

    setStudentLoading(true);
    try {
      // Attempt Firebase Authentication first using Student ID / Username
      try {
        await signInStudentFirebaseAuth(cleanId, cleanPass);
      } catch (fbErr: any) {
        console.warn('Firebase Auth sign-in note:', fbErr.code || fbErr.message);
      }

      const accounts = storage.getStudentAccounts();
      const account = accounts.find(
        (a) =>
          a.studentId.toLowerCase() === cleanId.toLowerCase() ||
          a.username.toLowerCase() === cleanId.toLowerCase()
      );

      if (!account) {
        setStudentError(
          t(
            'login.errorStudentNotFound',
            'শিক্ষার্থী অ্যাকাউন্ট পাওয়া যায়নি। শিক্ষার্থী আইডি বা ইউজারনেম সঠিক কিনা যাচাই করুন।'
          )
        );
        setStudentLoading(false);
        return;
      }

      if (account.status === 'deactivated') {
        setStudentError(
          t(
            'login.errorAccountDeactivated',
            'আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে। অনুগ্রহ করে তাজুল স্যারের সাথে যোগাযোগ করুন।'
          )
        );
        setStudentLoading(false);
        return;
      }

      // Verify Password Hash
      const isMatch = await verifyPassword(cleanPass, account.passwordHash);
      if (!isMatch) {
        setStudentError(
          t('login.errorInvalidPassword', 'ভুল পাসওয়ার্ড। অনুগ্রহ করে আপনার সঠিক পাসওয়ার্ড লিখুন।')
        );
        setStudentLoading(false);
        return;
      }

      const students = storage.getStudents();
      const studentProfile = students.find((s) => s.studentId === account.studentId);
      const studentName = studentProfile ? studentProfile.name : account.username;

      // Check if student must change temporary initial password on first login
      if (account.mustChangePassword) {
        setMustChangePasswordSession({
          role: 'student',
          username: account.username,
          studentId: account.studentId,
          studentDbId: account.studentDbId,
          name: studentName,
        });
        setStudentLoading(false);
        return;
      }

      // Successful Student Login Session
      const session: AuthSession = {
        role: 'student',
        username: account.username,
        studentId: account.studentId,
        studentDbId: account.studentDbId,
        name: studentName,
        token: `tok_stu_${Date.now()}`,
        loginTime: new Date().toISOString(),
        expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days session
      };

      storage.saveSession(session);
      onLoginSuccess(session);
    } catch {
      setStudentError(t('common.error', 'লগইন প্রক্রিয়ায় ত্রুটি ঘটেছে।'));
    } finally {
      setStudentLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    const cleanUser = adminUsername.trim();
    const cleanPass = adminPassword.trim();

    if (!cleanUser || !cleanPass) {
      setAdminError(t('login.errorEmpty', 'ইউজারনেম এবং পাসওয়ার্ড উভয়ই প্রদান করুন।'));
      return;
    }

    setAdminLoading(true);
    try {
      const adminAccount = await storage.getAdminAccount();

      // Check account lockout
      if (adminAccount.lockedUntil && Date.now() < adminAccount.lockedUntil) {
        const remainingMinutes = Math.ceil((adminAccount.lockedUntil - Date.now()) / 60000);
        setAdminError(
          t('login.errorAdminLocked', 'একাধিক ভুল চেষ্টার কারণে অ্যাকাউন্ট সাময়িকভাবে লক করা হয়েছে।') +
            ` (${formatNum(remainingMinutes)} min)`
        );
        setAdminLoading(false);
        return;
      }

      if (cleanUser.toLowerCase() !== adminAccount.username.toLowerCase()) {
        setAdminError(t('login.errorAdminInvalid', 'ভুল অ্যাডমিন ইউজারনেম বা পাসওয়ার্ড।'));
        setAdminLoading(false);
        return;
      }

      // Verify Admin Password Hash
      const isMatch = await verifyPassword(cleanPass, adminAccount.passwordHash);

      if (!isMatch) {
        const attempts = (adminAccount.failedAttempts || 0) + 1;
        adminAccount.failedAttempts = attempts;
        if (attempts >= 5) {
          adminAccount.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
          adminAccount.failedAttempts = 0;
          setAdminError(t('login.errorAdminLocked', 'অ্যাকাউন্ট ১৫ মিনিটের জন্য লক করা হয়েছে।'));
        } else {
          setAdminError(t('login.errorAdminInvalid', 'ভুল অ্যাডমিন ইউজারনেম বা পাসওয়ার্ড।'));
        }
        storage.saveAdminAccount(adminAccount);
        setAdminLoading(false);
        return;
      }

      // Reset failed attempts on success
      adminAccount.failedAttempts = 0;
      adminAccount.lockedUntil = undefined;
      storage.saveAdminAccount(adminAccount);

      // Check if admin requires initial password change
      if (adminAccount.mustChangePassword) {
        setMustChangePasswordSession({
          role: 'admin',
          username: adminAccount.username,
          name: settings.directorName || 'অ্যাডমিনিস্ট্রেটর',
        });
        setAdminLoading(false);
        return;
      }

      // Create Admin Session
      const session: AuthSession = {
        role: 'admin',
        username: adminAccount.username,
        name: settings.directorName || 'অ্যাডমিনিস্ট্রেটর',
        token: `tok_adm_${Date.now()}`,
        loginTime: new Date().toISOString(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };

      storage.saveSession(session);
      onLoginSuccess(session);
    } catch {
      setAdminError(t('common.error', 'লগইন প্রক্রিয়ায় ত্রুটি ঘটেছে।'));
    } finally {
      setAdminLoading(false);
    }
  };

  // Handle Required First-Time Password Change
  const handleSaveInitialPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);

    if (newPassword.length < 6) {
      setChangeError(t('login.errorPasswordLength', 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError(t('login.errorPasswordMismatch', 'পাসওয়ার্ড দুটি মেলেনি। একই পাসওয়ার্ড পুনরায় লিখুন।'));
      return;
    }

    if (!mustChangePasswordSession) return;

    setChangeLoading(true);
    try {
      const hashed = await hashPassword(newPassword);

      if (mustChangePasswordSession.role === 'admin') {
        const admin = await storage.getAdminAccount();
        admin.passwordHash = hashed;
        admin.mustChangePassword = false;
        admin.updatedAt = new Date().toISOString();
        storage.saveAdminAccount(admin);

        const session: AuthSession = {
          role: 'admin',
          username: admin.username,
          name: settings.directorName || 'Administrator',
          token: `tok_adm_${Date.now()}`,
          loginTime: new Date().toISOString(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
        storage.saveSession(session);
        onLoginSuccess(session);
      } else {
        const accounts = storage.getStudentAccounts();
        const acc = accounts.find(
          (a) =>
            a.studentId.toLowerCase() === mustChangePasswordSession.username.toLowerCase() ||
            a.username.toLowerCase() === mustChangePasswordSession.username.toLowerCase() ||
            (mustChangePasswordSession.studentId && a.studentId === mustChangePasswordSession.studentId)
        );
        if (acc) {
          acc.passwordHash = hashed;
          acc.mustChangePassword = false;
          acc.tempPlainPassword = undefined;
          storage.saveStudentAccounts(accounts);

          // Update flag in Firestore
          if (acc.studentDbId) {
            firestoreService.updateStudentPasswordFlag(acc.studentDbId, false).catch(() => {});
          }
        }

        // Try updating Firebase Auth password for currently signed-in student
        try {
          await updateStudentAuthPassword(newPassword);
        } catch (authErr) {
          console.warn('Firebase Auth password update note:', authErr);
        }

        const session: AuthSession = {
          role: 'student',
          username: mustChangePasswordSession.username,
          studentId: mustChangePasswordSession.studentId,
          studentDbId: mustChangePasswordSession.studentDbId,
          name: mustChangePasswordSession.name,
          token: `tok_stu_${Date.now()}`,
          loginTime: new Date().toISOString(),
          expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
        };
        storage.saveSession(session);
        onLoginSuccess(session);
      }
    } catch {
      setChangeError(t('common.error', 'পাসওয়ার্ড পরিবর্তনে সমস্যা হয়েছে।'));
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <div className="login-animated-bg min-h-screen flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-sans relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Ambient Animated Light Orbs in Background */}
      <div
        className="ambient-orb-1 absolute -top-20 -left-20 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-blue-300/35 to-sky-200/30 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="ambient-orb-2 absolute -bottom-24 -right-24 w-80 h-80 sm:w-[460px] sm:h-[460px] rounded-full bg-gradient-to-tr from-indigo-300/30 via-purple-200/20 to-sky-100/30 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="ambient-orb-3 absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-blue-100/40 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Bar with Language Selector */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('app.title', 'T@zul’s Care')} {language === 'bn' ? 'স্টুডেন্ট পোর্টাল' : 'Student Portal'}
          </span>
        </div>

        {/* Language Switcher with Light/Header styling */}
        <LanguageSelector variant="header" />
      </header>

      {/* Main Content: Brand & Animated Card */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-4">
        {/* Entrance Animated Card Container */}
        <div className="login-card-entrance">
          {/* Institution Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-3.5">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.institutionName || 'T@zul’s Care'}
                  className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-2xl p-1 bg-white border border-slate-200/80 shadow-md shadow-slate-200/50"
                />
              ) : (
                <div className="brand-badge-glow h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 border border-white/40">
                  <Sigma className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.3]" />
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {settings.institutionName || 'T@zul’s Care'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              {settings.tagline ||
                (language === 'bn'
                  ? 'গণিত ও উচ্চতর গণিত স্পেশাল কেয়ার (Class 5 - SSC)'
                  : 'Special Care in General & Higher Mathematics')}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/95 backdrop-blur-md py-7 px-6 sm:px-9 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/70 hover:shadow-2xl hover:shadow-slate-300/60 transition-shadow duration-300">
            {/* Dual Tabs: Student vs Admin */}
            <div
              className="flex rounded-2xl bg-slate-100/90 p-1 mb-6 border border-slate-200/70"
              role="tablist"
              aria-label="User role tabs"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'student'}
                onClick={() => {
                  setActiveTab('student');
                  setStudentError(null);
                  setAdminError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  activeTab === 'student'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{t('login.studentTab', 'শিক্ষার্থী পোর্টাল (Student)')}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'admin'}
                onClick={() => {
                  setActiveTab('admin');
                  setStudentError(null);
                  setAdminError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>{t('login.adminTab', 'কোচিং অ্যাডমিন (Admin)')}</span>
              </button>
            </div>

            {/* Student Login Form */}
            {activeTab === 'student' && (
              <form onSubmit={handleStudentLogin} className="space-y-4" noValidate={false}>
                {studentError && (
                  <div
                    className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 shadow-2xs animate-in fade-in"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{studentError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="student-login-id"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    {t('students.studentId', 'শিক্ষার্থী আইডি')} / {t('students.username', 'ইউজারনেম')}
                    <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <User
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="student-login-id"
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder={t('login.studentIdPlaceholder', 'TC-26-001 or username')}
                      autoComplete="username"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300/90 bg-white font-mono font-bold text-slate-800 placeholder:font-sans placeholder:text-slate-400 placeholder:font-normal focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:outline-hidden transition-all duration-200 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="student-login-password"
                      className="text-xs font-bold text-slate-700"
                    >
                      {t('login.password', 'পাসওয়ার্ড')}
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                    >
                      {t('login.forgotPassword', 'পাসওয়ার্ড ভুলে গেছেন?')}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="student-login-password"
                      type={showStudentPassword ? 'text' : 'password'}
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300/90 bg-white font-bold text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:outline-hidden transition-all duration-200 shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer transition-colors"
                      aria-label={
                        showStudentPassword
                          ? t('login.hidePassword', 'Hide password')
                          : t('login.showPassword', 'Show password')
                      }
                      title={
                        showStudentPassword
                          ? t('login.hidePassword', 'Hide')
                          : t('login.showPassword', 'Show')
                      }
                    >
                      {showStudentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={studentLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {studentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>
                    {studentLoading
                      ? t('common.loading', 'লগইন হচ্ছে...')
                      : t('login.btnStudent', 'স্টুডেন্ট পোর্টালে প্রবেশ করুন')}
                  </span>
                </button>

                <div className="pt-2 text-center">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {t(
                      'login.forgotPasswordDesc',
                      'পাসওয়ার্ড ভুলে গেলে বা সহায়তার জন্য কোচিং অফিসে যোগাযোগ করুন।'
                    )}
                  </p>
                </div>
              </form>
            )}

            {/* Admin Login Form */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4" noValidate={false}>
                {adminError && (
                  <div
                    className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 shadow-2xs animate-in fade-in"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{adminError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="admin-login-username"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    {t('login.adminUserPlaceholder', 'Admin Username')}
                    <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <Shield
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="admin-login-username"
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      autoComplete="username"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300/90 bg-white font-bold text-slate-800 placeholder:text-slate-400 focus:border-slate-800 focus:ring-4 focus:ring-slate-500/15 focus:outline-hidden transition-all duration-200 shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-login-password"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    {t('login.password', 'Password')}
                    <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="admin-login-password"
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300/90 bg-white font-bold text-slate-800 placeholder:text-slate-400 focus:border-slate-800 focus:ring-4 focus:ring-slate-500/15 focus:outline-hidden transition-all duration-200 shadow-2xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer transition-colors"
                      aria-label={
                        showAdminPassword
                          ? t('login.hidePassword', 'Hide password')
                          : t('login.showPassword', 'Show password')
                      }
                      title={
                        showAdminPassword
                          ? t('login.hidePassword', 'Hide')
                          : t('login.showPassword', 'Show')
                      }
                    >
                      {showAdminPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-slate-900 via-slate-800 to-black hover:from-black hover:to-slate-900 text-white font-bold text-sm rounded-xl shadow-md shadow-slate-900/15 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {adminLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  <span>
                    {adminLoading
                      ? t('common.loading', 'যাচাই হচ্ছে...')
                      : t('login.btnAdmin', 'অ্যাডমিন ড্যাশবোর্ডে প্রবেশ')}
                  </span>
                </button>

                <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>{t('login.defaultAdminHint', 'Default Admin: admin')}</span>
                  <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">
                    admin
                  </code>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto text-center text-xs text-slate-500 py-2">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <span className="font-semibold text-slate-700">
            {settings.institutionName || 'T@zul’s Care'}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            •
          </span>
          <span>{settings.address}</span>
          <span aria-hidden="true" className="text-slate-300">
            •
          </span>
          <span className="font-mono">
            {language === 'bn' ? 'মোবাইল: ' : 'Phone: '}
            {formatNum(settings.phone)}
          </span>
        </div>
      </footer>

      {/* Mandatory First-Time Password Change Modal */}
      {mustChangePasswordSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200/90 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {t('login.mustChangeTitle', 'প্রথমবার লগইন: পাসওয়ার্ড পরিবর্তন করুন')}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('portal.welcome', 'স্বাগতম')}, {mustChangePasswordSession.name}!{' '}
                {t(
                  'login.mustChangeDesc',
                  'নিরাপত্তার স্বার্থে আপনার প্রাথমিক অস্থায়ী পাসওয়ার্ডটি পরিবর্তন করে একটি নতুন গোপন পাসওয়ার্ড সেট করুন।'
                )}
              </p>
            </div>

            <form onSubmit={handleSaveInitialPassword} className="space-y-4">
              {changeError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{changeError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('login.newPassword', 'নতুন পাসওয়ার্ড')} ({t('login.errorPasswordLength', 'কমপক্ষে ৬ অক্ষর')})*
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('login.newPassword', 'New Password')}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('login.confirmPassword', 'নতুন পাসওয়ার্ড নিশ্চিত করুন')}*
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('login.confirmPassword', 'Confirm New Password')}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:outline-hidden"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changeLoading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {changeLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>{t('login.saveNewPassword', 'পাসওয়ার্ড সংরক্ষণ ও প্রবেশ করুন')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {t('login.forgotPassword', 'পাসওয়ার্ড রিসেট বা পুনরুদ্ধার')}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {t(
                'login.forgotPasswordDesc',
                'শিক্ষার্থীদের পাসওয়ার্ডের গোপনীয়তা ও নিরাপত্তার স্বার্থে পাসওয়ার্ড রিসেট শুধুমাত্র প্রতিষ্ঠান পরিচালকের মাধ্যমে সম্পন্ন হয়।'
              )}
            </p>

            <div className="mt-4 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 text-xs text-left space-y-2 font-medium text-slate-700">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-500">{t('settings.institutionName', 'প্রতিষ্ঠান')}:</span>
                <span className="font-bold text-slate-900">{settings.institutionName}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-500">{t('settings.directorName', 'পরিচালক')}:</span>
                <span className="font-bold text-slate-900">{settings.directorName}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-500">{t('common.phone', 'মোবাইল')}:</span>
                <span className="font-bold text-blue-700 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-500" />
                  {formatNum(settings.phone)}
                </span>
              </div>
              <div className="pt-0.5 text-[11px] text-slate-500 leading-tight flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {t('settings.address', 'ঠিকানা')}: {settings.address}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="mt-5 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-blue-500/20 active:scale-[0.98]"
            >
              {t('common.close', 'ঠিক আছে')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
