import React from 'react';
import {
  Users,
  Calculator,
  Sigma,
  CalendarCheck,
  CreditCard,
  AlertCircle,
  Clock,
  Award,
  Layers,
  FileText,
  Bell,
  Settings as SettingsIcon,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  KeyRound,
} from 'lucide-react';
import {
  Student,
  Batch,
  AttendanceSession,
  FeePayment,
  Exam,
  Notice,
  InstitutionSettings,
  SUPPORTED_CLASSES,
} from '../types';
import {
  toBengaliNumber,
  formatTaka,
  getCurrentMonthNameBn,
  getClassShortName,
  getSubjectShortName,
} from '../utils/helpers';

interface DashboardProps {
  students: Student[];
  batches: Batch[];
  attendance: AttendanceSession[];
  fees: FeePayment[];
  exams: Exam[];
  notices: Notice[];
  settings: InstitutionSettings;
  setActiveTab: (tab: string) => void;
  onOpenAddStudent: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  batches,
  attendance,
  fees,
  exams,
  notices,
  settings,
  setActiveTab,
  onOpenAddStudent,
}) => {
  // Real calculated statistics from actual saved records
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'active').length;

  const mathStudentsCount = students.filter(
    (s) => s.status === 'active' && s.enrolledSubjects.includes('math')
  ).length;

  const higherMathStudentsCount = students.filter(
    (s) => s.status === 'active' && s.enrolledSubjects.includes('higher_math')
  ).length;

  // Today's attendance
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendanceSessions = attendance.filter((a) => a.date === todayStr);

  let todayPresentCount = 0;
  let todayTotalMarked = 0;
  todayAttendanceSessions.forEach((session) => {
    session.records.forEach((record) => {
      todayTotalMarked += 1;
      if (record.status === 'present' || record.status === 'late') {
        todayPresentCount += 1;
      }
    });
  });

  const todayAttendanceRate =
    todayTotalMarked > 0
      ? Math.round((todayPresentCount / todayTotalMarked) * 100)
      : 0;

  // Monthly fees calculation
  const currentMonthName = getCurrentMonthNameBn();
  const currentMonthFees = fees.filter((f) => f.month === currentMonthName);
  const monthlyCollected = currentMonthFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);

  // Total outstanding balance across all fee records or student profiles
  const outstandingFees = fees.reduce((acc, f) => acc + (f.dueAmount || 0), 0);

  // Class distribution calculation
  const classCounts = SUPPORTED_CLASSES.map((cls) => {
    const count = students.filter(
      (s) => s.status === 'active' && s.classLevel === cls.id
    ).length;
    return {
      classDef: cls,
      count,
    };
  });

  // Quick Action / Access Grid
  const quickAccessCards = [
    {
      id: 'students',
      title: 'শিক্ষার্থী',
      subtitle: `${toBengaliNumber(activeStudents)} জন সক্রিয়`,
      icon: Users,
      bgColor: 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-600 text-white',
    },
    {
      id: 'accounts',
      title: 'স্টুডেন্ট অ্যাকাউন্ট',
      subtitle: 'লগইন ও পাসওয়ার্ড পোর্টাল',
      icon: KeyRound,
      bgColor: 'bg-cyan-50 text-cyan-700 border-cyan-100 hover:border-cyan-300',
      iconBg: 'bg-cyan-600 text-white',
    },
    {
      id: 'batches',
      title: 'ব্যাচ ও ক্লাস',
      subtitle: `${toBengaliNumber(batches.filter((b) => b.status === 'active').length)} টি সক্রিয় ব্যাচ`,
      icon: Layers,
      bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:border-indigo-300',
      iconBg: 'bg-indigo-600 text-white',
    },
    {
      id: 'attendance',
      title: 'উপস্থিতি',
      subtitle: todayTotalMarked > 0 ? `${toBengaliNumber(todayAttendanceRate)}% আজ উপস্থিত` : 'আজকের হাজিরা দিন',
      icon: CalendarCheck,
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      id: 'fees',
      title: 'মাসিক ফি',
      subtitle: `চলতি মাসে ${formatTaka(monthlyCollected)} আদায়`,
      icon: CreditCard,
      bgColor: 'bg-amber-50 text-amber-800 border-amber-100 hover:border-amber-300',
      iconBg: 'bg-amber-600 text-white',
    },
    {
      id: 'exams',
      title: 'পরীক্ষা ও ফলাফল',
      subtitle: `${toBengaliNumber(exams.length)} টি পরীক্ষা সম্পন্ন`,
      icon: Award,
      bgColor: 'bg-purple-50 text-purple-700 border-purple-100 hover:border-purple-300',
      iconBg: 'bg-purple-600 text-white',
    },
    {
      id: 'routine',
      title: 'ক্লাস রুটিন',
      subtitle: 'সাপ্তাহিক সময়সূচি',
      icon: Clock,
      bgColor: 'bg-sky-50 text-sky-700 border-sky-100 hover:border-sky-300',
      iconBg: 'bg-sky-600 text-white',
    },
    {
      id: 'notices',
      title: 'নোটিশ',
      subtitle: `${toBengaliNumber(notices.length)} টি নোটিশ`,
      icon: Bell,
      bgColor: 'bg-rose-50 text-rose-700 border-rose-100 hover:border-rose-300',
      iconBg: 'bg-rose-600 text-white',
    },
    {
      id: 'reports',
      title: 'রিপোর্ট',
      subtitle: 'শিক্ষার্থী ও ফি বিবরণী',
      icon: FileText,
      bgColor: 'bg-teal-50 text-teal-700 border-teal-100 hover:border-teal-300',
      iconBg: 'bg-teal-600 text-white',
    },
    {
      id: 'settings',
      title: 'সেটিংস',
      subtitle: 'প্রতিষ্ঠান ও ব্যাকআপ',
      icon: SettingsIcon,
      bgColor: 'bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-700 text-white',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Institution Banner */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Calculator className="w-3.5 h-3.5" />
              <span>কোচিং ম্যানেজমেন্ট সিস্টেম • শিক্ষাবর্ষ {toBengaliNumber(settings.academicYear)}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              স্বাগতম, {settings.institutionName || 'T@zul’s Care'}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              পঞ্চম শ্রেণি থেকে এসএসসি পরীক্ষার্থীদের (Class 5 - SSC) গণিত ও উচ্চতর গণিতের জন্য বিশেষ পরিচর্যা ও পূর্ণাঙ্গ একাডেমিক ট্র্যাকিং।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAddStudent}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              নতুন শিক্ষার্থী যোগ করুন
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/15 backdrop-blur-xs transition cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              আজকের হাজিরা নিন
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Students */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              মোট শিক্ষার্থী (সক্রিয়)
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-sans">
              {toBengaliNumber(activeStudents)}
            </span>
            <span className="text-xs text-slate-500">জন শিক্ষার্থী</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>সর্বমোট ভর্তি: {toBengaliNumber(totalStudents)} জন</span>
            <button
              onClick={() => setActiveTab('students')}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              তালিকা দেখুন
            </button>
          </div>
        </div>

        {/* Math & Higher Math Enrollment */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              বিষয়ভিত্তিক ভর্তি
            </span>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sigma className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                গণিত (Class 5-10):
              </span>
              <span className="font-bold text-slate-800 font-sans">
                {toBengaliNumber(mathStudentsCount)} জন
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                উচ্চতর গণিত (Class 9-10):
              </span>
              <span className="font-bold text-slate-800 font-sans">
                {toBengaliNumber(higherMathStudentsCount)} জন
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            উচ্চতর গণিত শুধুমাত্র ৯ম ও ১০ম শ্রেণির জন্য প্রযোজ্য
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              আজকের উপস্থিতি
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-sans">
              {todayTotalMarked > 0 ? `${toBengaliNumber(todayAttendanceRate)}%` : '০%'}
            </span>
            <span className="text-xs text-slate-500">
              {todayTotalMarked > 0
                ? `(${toBengaliNumber(todayPresentCount)}/${toBengaliNumber(todayTotalMarked)} জন)`
                : '(আজকের তথ্য নেই)'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {todayAttendanceSessions.length > 0
                ? `${toBengaliNumber(todayAttendanceSessions.length)} টি ব্যাচে এন্ট্রি`
                : 'হাজিরা সম্পন্ন করুন'}
            </span>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              হাজিরা এন্ট্রি
            </button>
          </div>
        </div>

        {/* Fee Collection & Outstanding */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              চলতি মাসে ফি আদায়
            </span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-sans">
              {formatTaka(monthlyCollected)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-rose-600 font-medium">
              মোট বকেয়া: {formatTaka(outstandingFees)}
            </span>
            <button
              onClick={() => setActiveTab('fees')}
              className="text-amber-800 hover:underline font-semibold cursor-pointer"
            >
              ফি আদায় করুন
            </button>
          </div>
        </div>
      </div>

      {/* Class 5 to 10 Distribution Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              শ্রেণিভিত্তিক শিক্ষার্থী বণ্টন (Class 5 - Class 10 / SSC)
            </h3>
            <p className="text-xs text-slate-500">
              টি@জুল’স কেয়ার-এ সমর্থিত অনুমোদিত শ্রেণিগুলো
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
            সর্বমোট: {toBengaliNumber(activeStudents)} জন
          </span>
        </div>

        {activeStudents === 0 ? (
          <div className="py-6 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              এখনো কোনো শিক্ষার্থী যোগ করা হয়নি
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              শিক্ষার্থী যোগ করলে এখানে শ্রেণিভিত্তিক গ্রাফ প্রদর্শিত হবে
            </p>
            <button
              onClick={onOpenAddStudent}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-lg hover:bg-blue-100 cursor-pointer transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              প্রথম শিক্ষার্থী যোগ করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {classCounts.map(({ classDef, count }) => {
              const percentage =
                activeStudents > 0 ? Math.round((count / activeStudents) * 100) : 0;
              return (
                <div
                  key={classDef.id}
                  className="bg-slate-50 hover:bg-blue-50/50 rounded-xl p-3.5 border border-slate-200 transition text-center"
                >
                  <span className="text-xs font-bold text-slate-700 block">
                    {classDef.nameEn}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {classDef.nameBn}
                  </span>
                  <div className="mt-2 text-xl font-extrabold text-blue-800 font-sans">
                    {toBengaliNumber(count)}
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {toBengaliNumber(percentage)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Access Menu Cards (Section 11) */}
      <div>
        <div className="mb-3">
          <h3 className="text-base font-bold text-slate-900">
            দ্রুত নেভিগেশন ও ব্যবস্থাপনা (Quick Access)
          </h3>
          <p className="text-xs text-slate-500">
            কোচিং এর প্রধান ফিচারসমূহে এক ক্লিকে প্রবেশ করুন
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5">
          {quickAccessCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                className={`bg-white rounded-xl p-4 border transition cursor-pointer hover:shadow-md flex items-start gap-3.5 group ${card.bgColor}`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs ${card.iconBg}`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {card.subtitle}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Active Batches & Latest Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Batches */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                সক্রিয় ব্যাচসমূহ (Class 5 - SSC)
              </h3>
              <p className="text-xs text-slate-500">
                বিষয়ভিত্তিক নির্ধারিত সময়সূচি
              </p>
            </div>
            <button
              onClick={() => setActiveTab('batches')}
              className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
            >
              সকল ব্যাচ ({toBengaliNumber(batches.length)})
            </button>
          </div>

          <div className="space-y-2.5">
            {batches.slice(0, 4).map((b) => {
              const enrolledCount = students.filter(
                (s) => s.status === 'active' && s.batchId === b.id
              ).length;
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {b.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.subject === 'higher_math'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {getSubjectShortName(b.subject)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {b.scheduleDays} • {b.time} {b.room ? `• ${b.room}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-800">
                      {toBengaliNumber(enrolledCount)} জন
                    </span>
                    <span className="text-[10px] text-slate-400 block">শিক্ষার্থী</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notices & Announcements */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                নোটিশ বোর্ড
              </h3>
              <p className="text-xs text-slate-500">
                কোচিং এর সর্বশেষ ঘোষণা ও বার্তা
              </p>
            </div>
            <button
              onClick={() => setActiveTab('notices')}
              className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
            >
              সকল নোটিশ
            </button>
          </div>

          <div className="space-y-2.5">
            {notices.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                এখনো কোনো নোটিশ পোস্ট করা হয়নি।
              </p>
            ) : (
              notices.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/60 transition space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {notice.title}
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        notice.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : notice.priority === 'important'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {notice.priority === 'urgent'
                        ? 'জরুরি'
                        : notice.priority === 'important'
                        ? 'গুরুত্বপূর্ণ'
                        : 'সাধারণ'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {notice.content}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    তারিখ: {toBengaliNumber(notice.date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
