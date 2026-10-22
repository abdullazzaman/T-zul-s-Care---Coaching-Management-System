import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Users,
  CreditCard,
  CalendarCheck,
  Award,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Info,
  Loader2,
} from 'lucide-react';
import {
  Student,
  Batch,
  AttendanceSession,
  FeePayment,
  Exam,
  InstitutionSettings,
  SUPPORTED_CLASSES,
} from '../types';
import {
  MONTH_NAMES_BN,
} from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

interface ReportManagementProps {
  students: Student[];
  batches: Batch[];
  attendance: AttendanceSession[];
  fees: FeePayment[];
  exams: Exam[];
  settings: InstitutionSettings;
}

export const ReportManagement: React.FC<ReportManagementProps> = ({
  students,
  batches,
  attendance,
  fees,
  exams,
  settings,
}) => {
  const {
    t,
    language,
    formatNum,
    formatMoney,
    getClassNameText,
    getClassShortText,
    getSubjectShortText,
    getStatusText,
    getMonthText,
  } = useLanguage();

  const [reportType, setReportType] = useState<'students' | 'fees' | 'attendance' | 'exams'>('students');

  // Filters
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStudentStatus, setFilterStudentStatus] = useState<string>('all');
  const [filterFeeStatus, setFilterFeeStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI state
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<{
    text: string;
    type: 'error' | 'warning' | 'info' | 'success';
  } | null>(null);

  // 1. Filter Students
  const filteredStudents = students.filter((s) => {
    const matchesClass = filterClass === 'all' || s.classLevel === filterClass;
    const matchesStatus = filterStudentStatus === 'all' || s.status === filterStudentStatus;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.guardianName.toLowerCase().includes(q) ||
      s.guardianPhone.includes(q);
    return matchesClass && matchesStatus && matchesSearch;
  });

  // 2. Filter Fees
  const filteredFees = fees.filter((f) => {
    const stu = students.find((s) => s.id === f.studentId || s.studentId === f.studentId);
    const matchesClass = filterClass === 'all' || (stu && stu.classLevel === filterClass);
    const matchesMonth = filterMonth === 'all' || f.month === filterMonth;
    const matchesStatus = filterFeeStatus === 'all' || f.status === filterFeeStatus;

    let matchesDate = true;
    if (filterDateFrom && f.paymentDate < filterDateFrom) matchesDate = false;
    if (filterDateTo && f.paymentDate > filterDateTo) matchesDate = false;

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      f.receiptNo.toLowerCase().includes(q) ||
      f.month.toLowerCase().includes(q) ||
      (f.notes && f.notes.toLowerCase().includes(q)) ||
      (stu &&
        (stu.name.toLowerCase().includes(q) || stu.studentId.toLowerCase().includes(q)));

    return matchesClass && matchesMonth && matchesStatus && matchesDate && matchesSearch;
  });

  // 3. Filter Attendance Sessions
  const filteredAttendance = attendance.filter((att) => {
    const matchesClass = filterClass === 'all' || att.classLevel === filterClass;
    const matchesSubject = filterSubject === 'all' || att.subject === filterSubject;

    let matchesDate = true;
    if (filterDateFrom && att.date < filterDateFrom) matchesDate = false;
    if (filterDateTo && att.date > filterDateTo) matchesDate = false;

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      att.date.includes(q) ||
      getClassShortText(att.classLevel).toLowerCase().includes(q) ||
      getSubjectShortText(att.subject).toLowerCase().includes(q);

    return matchesClass && matchesSubject && matchesDate && matchesSearch;
  });

  // 4. Filter Exams
  const filteredExams = exams.filter((ex) => {
    const matchesClass = filterClass === 'all' || ex.classLevel === filterClass;
    const matchesSubject = filterSubject === 'all' || ex.subject === filterSubject;

    let matchesDate = true;
    if (filterDateFrom && ex.date < filterDateFrom) matchesDate = false;
    if (filterDateTo && ex.date > filterDateTo) matchesDate = false;

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      ex.title.toLowerCase().includes(q) ||
      ex.date.includes(q) ||
      getClassShortText(ex.classLevel).toLowerCase().includes(q);

    return matchesClass && matchesSubject && matchesDate && matchesSearch;
  });

  // Determine current active report length
  const getCurrentReportCount = () => {
    switch (reportType) {
      case 'students':
        return filteredStudents.length;
      case 'fees':
        return filteredFees.length;
      case 'attendance':
        return filteredAttendance.length;
      case 'exams':
        return filteredExams.length;
      default:
        return 0;
    }
  };

  const currentReportCount = getCurrentReportCount();

  const getReportTitle = () => {
    switch (reportType) {
      case 'students':
        return t('reports.studentsTitle', 'শিক্ষার্থী তালিকা ও একাডেমিক বিবরণী প্রতিবেদন');
      case 'fees':
        return t('reports.feesTitle', 'ফি সংগ্রহ, আদায় ও বকেয়া হিসাব প্রতিবেদন');
      case 'attendance':
        return t('reports.attendanceTitle', 'উপস্থিতি ও ক্লাসহাজিরা বিশ্লেষণ প্রতিবেদন');
      case 'exams':
        return t('reports.examsTitle', 'পরীক্ষা মূল্যায়ন ও ফলাফল পারফরম্যান্স প্রতিবেদন');
      default:
        return t('reports.title', 'প্রতিবেদন');
    }
  };

  // Safe, direct, and reliable printing handler
  const handlePrintReport = () => {
    // 1. Empty data validation: don't print empty report
    if (currentReportCount === 0) {
      setAlertMessage({
        text: t(
          'reports.noDataAlert',
          'প্রিন্ট করার জন্য কোনো ডাটা পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার পরিবর্তন করে প্রয়োজনীয় ডাটা নির্বাচন করুন।'
        ),
        type: 'warning',
      });
      return;
    }

    setAlertMessage(null);
    setIsPrinting(true);

    try {
      // Set document title temporarily to provide an official filename when saving as PDF
      const originalTitle = document.title;
      const cleanInstName = (settings.institutionName || 'Tazuls_Care').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
      const docTitle = `${cleanInstName}_${reportType.toUpperCase()}_Report_${new Date().toISOString().split('T')[0]}`;
      document.title = docTitle;

      // Ensure focus on current window and execute native print
      window.focus();
      window.print();

      // Reset printing status and restore document title
      setTimeout(() => {
        document.title = originalTitle;
        setIsPrinting(false);
      }, 600);
    } catch (err: any) {
      console.error('Print invocation error:', err);
      setIsPrinting(false);
      setAlertMessage({
        text: 'প্রিন্ট ডায়ালগ চালু করতে সমস্যা হয়েছে। অনুগ্রহ করে ব্রাউজারের প্রিন্ট অপশন অথবা কিবোর্ডে Ctrl+P চেপে প্রিন্ট করুন।',
        type: 'error',
      });
    }
  };

  // CSV Export Handler
  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      setAlertMessage({
        text: 'এক্সপোর্ট করার মতো কোনো ডাটা পাওয়া যায়নি।',
        type: 'warning',
      });
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((obj) =>
      Object.values(obj)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setAlertMessage({
      text: `${filename}.csv সফলভাবে ডাউনলোড হয়েছে।`,
      type: 'success',
    });
  };

  const handleExport = () => {
    const today = new Date().toISOString().split('T')[0];
    if (reportType === 'students') {
      const exportData = filteredStudents.map((s, idx) => ({
        'SL': idx + 1,
        'Student ID': s.studentId,
        'Name': s.name,
        'Class': getClassShortText(s.classLevel),
        'Subjects': s.enrolledSubjects.map((sub) => getSubjectShortText(sub)).join(', '),
        'Guardian Name': s.guardianName,
        'Guardian Phone': s.guardianPhone,
        'Monthly Fee (BDT)': s.monthlyFee,
        'Status': s.status === 'active' ? 'Active' : 'Inactive',
      }));
      exportCSV(exportData, `tazuls_care_students_${today}`);
    } else if (reportType === 'fees') {
      const exportData = filteredFees.map((f, idx) => {
        const stu = students.find((s) => s.id === f.studentId || s.studentId === f.studentId);
        return {
          'SL': idx + 1,
          'Receipt No': f.receiptNo,
          'Student Name': stu ? stu.name : 'Unknown',
          'Student ID': stu ? stu.studentId : f.studentId,
          'Month': f.month,
          'Monthly Fee (BDT)': f.monthlyFee,
          'Paid Amount (BDT)': f.paidAmount,
          'Discount (BDT)': f.discount || 0,
          'Due Amount (BDT)': f.dueAmount,
          'Payment Date': f.paymentDate,
          'Method': f.paymentMethod,
          'Status': f.status,
          'Notes': f.notes || '',
        };
      });
      exportCSV(exportData, `tazuls_care_fees_${today}`);
    } else if (reportType === 'attendance') {
      const exportData = filteredAttendance.map((att, idx) => {
        const pCount = att.records.filter((r) => r.status === 'present').length;
        const lCount = att.records.filter((r) => r.status === 'late').length;
        const aCount = att.records.filter((r) => r.status === 'absent').length;
        const total = att.records.length;
        const rate = total > 0 ? Math.round(((pCount + lCount) / total) * 100) : 0;
        return {
          'SL': idx + 1,
          'Date': att.date,
          'Class': getClassShortText(att.classLevel),
          'Subject': getSubjectShortText(att.subject),
          'Total Students': total,
          'Present': pCount,
          'Late': lCount,
          'Absent': aCount,
          'Rate (%)': `${rate}%`,
        };
      });
      exportCSV(exportData, `tazuls_care_attendance_${today}`);
    } else if (reportType === 'exams') {
      const exportData = filteredExams.map((ex, idx) => {
        const highest = ex.results.length > 0 ? Math.max(...ex.results.map((r) => r.obtainedMarks)) : 0;
        const passed = ex.results.filter((r) => r.obtainedMarks >= ex.passMarks).length;
        const total = ex.results.length;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        return {
          'SL': idx + 1,
          'Exam Title': ex.title,
          'Class': getClassShortText(ex.classLevel),
          'Subject': getSubjectShortText(ex.subject),
          'Date': ex.date,
          'Total Marks': ex.totalMarks,
          'Pass Marks': ex.passMarks,
          'Examinees': total,
          'Passed': passed,
          'Failed': total - passed,
          'Pass Rate (%)': `${passRate}%`,
          'Highest Mark': highest,
        };
      });
      exportCSV(exportData, `tazuls_care_exams_${today}`);
    }
  };

  // Calculations for Summary
  // 1. Fees Totals
  const totalAssessedFees = filteredFees.reduce((acc, f) => acc + (f.monthlyFee || 0), 0);
  const totalCollectedFees = filteredFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
  const totalDueFees = filteredFees.reduce((acc, f) => acc + (f.dueAmount || 0), 0);

  // 2. Students Totals
  const totalMonthlyFeeCommitment = filteredStudents.reduce((acc, s) => acc + (s.monthlyFee || 0), 0);
  const activeStudentsCount = filteredStudents.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Alert / Notification Banner (Hidden in Print) */}
      {alertMessage && (
        <div
          className={`no-print p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in ${
            alertMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : alertMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-sky-50 border-sky-200 text-sky-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : alertMessage.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : alertMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Actions (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-700" />
            {t('reports.title', 'প্রতিবেদন ও পরিসংখ্যান (Reports & Analytics)')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t('reports.subtitle', 'শিক্ষার্থী তালিকা, ফি আদায় বিবরণী, হাজিরা ও পরীক্ষার অফিসিয়াল প্রিন্টযোগ্য রিপোর্ট')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition shadow-2xs"
            title="CSV ফাইল ফরম্যাটে এক্সপোর্ট করুন"
          >
            <Download className="w-4 h-4 text-slate-600" />
            {t('reports.exportCsv', 'CSV এক্সপোর্ট')}
          </button>

          {/* Existing Print Button with Direct, Reliable Native Browser Print */}
          <button
            onClick={handlePrintReport}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg cursor-pointer transition disabled:opacity-60"
            title="A4 সাইজে সম্পূর্ণ রিপোর্ট প্রিন্ট করুন"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>
              {isPrinting
                ? t('reports.preparingPrint', 'প্রিন্ট প্রস্তুত হচ্ছে...')
                : t('reports.printReport', 'রিপোর্ট প্রিন্ট করুন')}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Subtabs & Comprehensive Filters (Hidden in Print) */}
      <div className="no-print bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3.5">
        {/* Report Type Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setReportType('students');
                setAlertMessage(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportType === 'students'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {t('reports.studentsTab', 'শিক্ষার্থী বিবরণী')}
            </button>
            <button
              onClick={() => {
                setReportType('fees');
                setAlertMessage(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportType === 'fees'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              {t('reports.feesTab', 'ফি আদায় বিবরণী')}
            </button>
            <button
              onClick={() => {
                setReportType('attendance');
                setAlertMessage(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportType === 'attendance'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              {t('reports.attendanceTab', 'হাজিরা রিপোর্ট')}
            </button>
            <button
              onClick={() => {
                setReportType('exams');
                setAlertMessage(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportType === 'exams'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              {t('reports.examsTab', 'পরীক্ষা ও ফলাফল')}
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            {language === 'bn' ? 'ফিল্টারকৃত রেকর্ড:' : 'Filtered Records:'}{' '}
            <strong className="text-slate-800">{formatNum(currentReportCount)}</strong>{' '}
            {language === 'bn' ? 'টি' : ''}
          </div>
        </div>

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Search Query */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'নাম, আইডি, রশিদ, বিষয়...' : 'Name, ID, receipt, subject...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">{language === 'bn' ? 'সকল শ্রেণি (Class 5 - 10)' : 'All Classes (5 - SSC)'}</option>
              {SUPPORTED_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {language === 'bn' ? cls.nameBn : cls.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter (for Fees) */}
          {reportType === 'fees' && (
            <div>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{language === 'bn' ? 'সকল মাস' : 'All Months'}</option>
                {MONTH_NAMES_BN.map((m) => (
                  <option key={m} value={m}>
                    {getMonthText(m)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fee Status (for Fees) */}
          {reportType === 'fees' && (
            <div>
              <select
                value={filterFeeStatus}
                onChange={(e) => setFilterFeeStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{language === 'bn' ? 'সকল পেমেন্ট স্ট্যাটাস' : 'All Payment Statuses'}</option>
                <option value="paid">{language === 'bn' ? 'পরিশোধিত (Paid)' : 'Paid'}</option>
                <option value="partial">{language === 'bn' ? 'আংশিক বকেয়া (Partial)' : 'Partial Due'}</option>
                <option value="unpaid">{language === 'bn' ? 'সম্পূর্ণ বকেয়া (Unpaid)' : 'Unpaid'}</option>
              </select>
            </div>
          )}

          {/* Subject Filter (for Attendance & Exams) */}
          {(reportType === 'attendance' || reportType === 'exams') && (
            <div>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{language === 'bn' ? 'সকল বিষয়' : 'All Subjects'}</option>
                <option value="math">{language === 'bn' ? 'গণিত (Math)' : 'General Math'}</option>
                <option value="higher_math">{language === 'bn' ? 'উচ্চতর গণিত (Higher Math)' : 'Higher Math'}</option>
              </select>
            </div>
          )}

          {/* Student Status (for Students) */}
          {reportType === 'students' && (
            <div>
              <select
                value={filterStudentStatus}
                onChange={(e) => setFilterStudentStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{language === 'bn' ? 'সকল শিক্ষার্থী স্ট্যাটাস' : 'All Student Statuses'}</option>
                <option value="active">{language === 'bn' ? 'শুধুমাত্র সক্রিয় (Active)' : 'Active Only'}</option>
                <option value="inactive">{language === 'bn' ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive Only'}</option>
              </select>
            </div>
          )}

          {/* Date Range: From Date */}
          {(reportType === 'fees' || reportType === 'attendance' || reportType === 'exams') && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium shrink-0">
                {t('reports.from', 'হতে')}:
              </span>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Date Range: To Date */}
          {(reportType === 'fees' || reportType === 'attendance' || reportType === 'exams') && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium shrink-0">
                {t('reports.to', 'পর্যন্ত')}:
              </span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Printable Report Document Card (A4 Formatted Official Sheet) */}
      <div
        id="printable-report-document"
        className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 print-container shadow-xs"
      >
        {/* Institution Report Header */}
        <div className="text-center pb-4 mb-5 border-b-2 border-slate-900 space-y-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-10 h-10 object-contain rounded-lg border border-slate-200"
              />
            ) : null}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {settings.institutionName || 'T@zul’s Care'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-700">
            {settings.tagline || (language === 'bn' ? 'গণিত ও উচ্চতর গণিত স্পেশাল কেয়ার' : 'Specialized Math Care')}
          </p>
          <p className="text-[11px] text-slate-500">
            {settings.address} • {language === 'bn' ? 'মোবাইল' : 'Phone'}: {formatNum(settings.phone)}
          </p>

          <div className="inline-block mt-3 bg-slate-900 text-white text-[11px] sm:text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-2xs">
            {getReportTitle()}
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 font-medium">
            <span>
              {language === 'bn' ? 'শ্রেণি ফিল্টার:' : 'Class Filter:'}{' '}
              <strong>{filterClass === 'all' ? (language === 'bn' ? 'সকল শ্রেণি' : 'All Classes') : getClassNameText(filterClass as any)}</strong>
            </span>
            <span>
              {language === 'bn' ? 'প্রতিবেদন প্রস্তুতের তারিখ:' : 'Report Generated:'}{' '}
              <strong>{formatNum(new Date().toISOString().split('T')[0])}</strong>
            </span>
            <span>
              {language === 'bn' ? 'শিক্ষাবর্ষ:' : 'Academic Year:'}{' '}
              <strong>{formatNum(settings.academicYear || '2026')}</strong>
            </span>
          </div>
        </div>

        {/* Dynamic Summary Cards inside the Report Sheet */}
        {reportType === 'students' && (
          <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'মোট প্রদর্শিত শিক্ষার্থী' : 'Total Students Listed'}
              </span>
              <strong className="text-base text-slate-900 font-sans block mt-0.5">
                {formatNum(filteredStudents.length)} {language === 'bn' ? 'জন' : ''}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-emerald-700 block text-[11px] font-semibold">
                {language === 'bn' ? 'সক্রিয় শিক্ষার্থী' : 'Active Students'}
              </span>
              <strong className="text-base text-emerald-800 font-sans block mt-0.5">
                {formatNum(activeStudentsCount)} {language === 'bn' ? 'জন' : ''}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-blue-700 block text-[11px] font-semibold">
                {language === 'bn' ? 'ধার্যকৃত মাসিক ফি' : 'Total Monthly Fee'}
              </span>
              <strong className="text-base text-blue-900 font-sans block mt-0.5">
                {formatMoney(totalMonthlyFeeCommitment)}
              </strong>
            </div>
          </div>
        )}

        {reportType === 'fees' && (
          <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-500 block text-[11px]">
                {t('reports.totalAssessed', 'নির্ধারিত মোট বেতন')}
              </span>
              <strong className="text-base text-slate-900 font-sans block mt-0.5">
                {formatMoney(totalAssessedFees)}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-emerald-700 block text-[11px] font-semibold">
                {t('reports.totalCollected', 'সর্বমোট প্রাপ্ত ফি')}
              </span>
              <strong className="text-base text-emerald-800 font-sans block mt-0.5">
                {formatMoney(totalCollectedFees)}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-rose-700 block text-[11px] font-semibold">
                {t('reports.totalDue', 'সর্বমোট বকেয়া')}
              </span>
              <strong className="text-base text-rose-800 font-sans block mt-0.5">
                {formatMoney(totalDueFees)}
              </strong>
            </div>
          </div>
        )}

        {reportType === 'attendance' && (
          <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'মোট হাজিরা সেশন' : 'Total Sessions'}
              </span>
              <strong className="text-base text-slate-900 font-sans block mt-0.5">
                {formatNum(filteredAttendance.length)} {language === 'bn' ? 'টি' : ''}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-blue-700 block text-[11px] font-semibold">
                {language === 'bn' ? 'মোট উপস্থিতি এন্ট্রি' : 'Total Student Records'}
              </span>
              <strong className="text-base text-blue-900 font-sans block mt-0.5">
                {formatNum(filteredAttendance.reduce((acc, a) => acc + a.records.length, 0))}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-emerald-700 block text-[11px] font-semibold">
                {language === 'bn' ? 'গড় উপস্থিতির হার' : 'Avg. Attendance Rate'}
              </span>
              <strong className="text-base text-emerald-800 font-sans block mt-0.5">
                {(() => {
                  const totalRecs = filteredAttendance.reduce((acc, a) => acc + a.records.length, 0);
                  const presentRecs = filteredAttendance.reduce(
                    (acc, a) =>
                      acc + a.records.filter((r) => r.status === 'present' || r.status === 'late').length,
                    0
                  );
                  return totalRecs > 0 ? `${formatNum(Math.round((presentRecs / totalRecs) * 100))}%` : '০%';
                })()}
              </strong>
            </div>
          </div>
        )}

        {reportType === 'exams' && (
          <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'মোট পরীক্ষা অনুষ্ঠিত' : 'Total Exams Conducted'}
              </span>
              <strong className="text-base text-slate-900 font-sans block mt-0.5">
                {formatNum(filteredExams.length)} {language === 'bn' ? 'টি' : ''}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-blue-700 block text-[11px] font-semibold">
                {language === 'bn' ? 'মোট পরীক্ষার্থী এন্ট্রি' : 'Total Examinee Marks'}
              </span>
              <strong className="text-base text-blue-900 font-sans block mt-0.5">
                {formatNum(filteredExams.reduce((acc, ex) => acc + ex.results.length, 0))}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-emerald-700 block text-[11px] font-semibold">
                {language === 'bn' ? 'গড় পাসের হার' : 'Overall Pass Rate'}
              </span>
              <strong className="text-base text-emerald-800 font-sans block mt-0.5">
                {(() => {
                  const totalResults = filteredExams.reduce((acc, ex) => acc + ex.results.length, 0);
                  const totalPassed = filteredExams.reduce(
                    (acc, ex) => acc + ex.results.filter((r) => r.obtainedMarks >= ex.passMarks).length,
                    0
                  );
                  return totalResults > 0
                    ? `${formatNum(Math.round((totalPassed / totalResults) * 100))}%`
                    : '০%';
                })()}
              </strong>
            </div>
          </div>
        )}

        {/* Report Content Data Tables */}
        {currentReportCount === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-300 rounded-xl my-4 space-y-2">
            <p className="text-sm font-bold text-slate-700">
              {language === 'bn'
                ? 'নির্বাচিত ফিল্টারের ভিত্তিতে কোনো তথ্য বা রেকর্ড পাওয়া যায়নি।'
                : 'No data or records found for the selected filters.'}
            </p>
            <p className="text-xs text-slate-400">
              {language === 'bn'
                ? 'অনুগ্রহ করে ফিল্টার পরিবর্তন করে ডাটা প্রদর্শন করুন অথবা নতুন রেকর্ড যুক্ত করুন।'
                : 'Please adjust your filter settings or add new records.'}
            </p>
          </div>
        ) : (
          <div>
            {/* 1. Students Report Table */}
            {reportType === 'students' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-10">
                        {language === 'bn' ? 'ক্রমিক' : 'SL'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'আইডি' : 'ID'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'শ্রেণি' : 'Class'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'বিষয়' : 'Subjects'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'অভিভাবক ও ফোন' : 'Guardian & Phone'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-right">
                        {language === 'bn' ? 'মাসিক বেতন' : 'Monthly Fee'}
                      </th>
                      <th className="p-2 text-center">
                        {language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-2 border-r border-slate-300 text-center font-mono">
                          {formatNum(idx + 1)}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono font-bold text-slate-800">
                          {s.studentId}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-bold text-slate-900">
                          {s.name}
                        </td>
                        <td className="p-2 border-r border-slate-300">
                          {getClassShortText(s.classLevel)}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-[11px]">
                          {s.enrolledSubjects.map((sub) => getSubjectShortText(sub)).join(', ')}
                        </td>
                        <td className="p-2 border-r border-slate-300">
                          {s.guardianName} ({formatNum(s.guardianPhone)})
                        </td>
                        <td className="p-2 border-r border-slate-300 text-right font-bold font-sans">
                          {formatMoney(s.monthlyFee)}
                        </td>
                        <td className="p-2 text-center font-bold">
                          <span
                            className={
                              s.status === 'active' ? 'text-emerald-700' : 'text-slate-400'
                            }
                          >
                            {getStatusText(s.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td colSpan={6} className="p-2 border-r border-slate-300 text-right">
                        {language === 'bn' ? 'সর্বমোট মাসিক ফি:' : 'Total Monthly Fee:'}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-right font-sans text-slate-900">
                        {formatMoney(totalMonthlyFeeCommitment)}
                      </td>
                      <td className="p-2 text-center font-sans">
                        {formatNum(filteredStudents.length)} {language === 'bn' ? 'জন' : ''}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* 2. Fees Report Table */}
            {reportType === 'fees' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-10">
                        {language === 'bn' ? 'ক্রমিক' : 'SL'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'রশিদ নং' : 'Receipt No'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'শিক্ষার্থী' : 'Student'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'মাস' : 'Month'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-right">
                        {language === 'bn' ? 'নির্ধারিত' : 'Fee'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-right">
                        {language === 'bn' ? 'প্রাপ্ত টাকা' : 'Paid'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-right">
                        {language === 'bn' ? 'বকেয়া' : 'Due'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-center">
                        {language === 'bn' ? 'মাধ্যম' : 'Method'}
                      </th>
                      <th className="p-2 text-center">
                        {language === 'bn' ? 'তারিখ' : 'Date'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredFees.map((f, idx) => {
                      const stu = students.find((s) => s.id === f.studentId || s.studentId === f.studentId);
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/50">
                          <td className="p-2 border-r border-slate-300 text-center font-mono">
                            {formatNum(idx + 1)}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold text-slate-800">
                            {f.receiptNo}
                          </td>
                          <td className="p-2 border-r border-slate-300">
                            {stu ? (
                              <div>
                                <span className="font-bold text-slate-900 block">{stu.name}</span>
                                <span className="text-[10px] text-slate-500">
                                  {stu.studentId} • {getClassShortText(stu.classLevel)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">{f.studentId}</span>
                            )}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-semibold">
                            {getMonthText(f.month)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-sans">
                            {formatMoney(f.monthlyFee)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-bold font-sans text-emerald-700">
                            {formatMoney(f.paidAmount)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-bold font-sans text-rose-600">
                            {formatMoney(f.dueAmount)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center uppercase text-[10px] font-bold">
                            {f.paymentMethod}
                          </td>
                          <td className="p-2 text-center font-mono text-[11px]">
                            {formatNum(f.paymentDate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td colSpan={4} className="p-2 border-r border-slate-300 text-right">
                        {language === 'bn' ? 'সর্বমোট যোগফল:' : 'Total Sum:'}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-right font-sans">
                        {formatMoney(totalAssessedFees)}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-right font-sans text-emerald-800">
                        {formatMoney(totalCollectedFees)}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-right font-sans text-rose-700">
                        {formatMoney(totalDueFees)}
                      </td>
                      <td colSpan={2} className="p-2 text-center font-sans">
                        {language === 'bn' ? 'মোট' : 'Total'} {formatNum(filteredFees.length)} {language === 'bn' ? 'টি এন্ট্রি' : 'Entries'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* 3. Attendance Report Table */}
            {reportType === 'attendance' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-10">
                        {language === 'bn' ? 'ক্রমিক' : 'SL'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'তারিখ' : 'Date'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'শ্রেণি ও বিষয়' : 'Class & Subject'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-center">
                        {language === 'bn' ? 'মোট শিক্ষার্থী' : 'Total'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-center">
                        {language === 'bn' ? 'উপস্থিত' : 'Present'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-center">
                        {language === 'bn' ? 'অনুপস্থিত' : 'Absent'}
                      </th>
                      <th className="p-2 text-center">
                        {language === 'bn' ? 'উপস্থিতির হার (%)' : 'Rate (%)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAttendance.map((att, idx) => {
                      const pCount = att.records.filter((r) => r.status === 'present' || r.status === 'late').length;
                      const aCount = att.records.filter((r) => r.status === 'absent').length;
                      const total = att.records.length;
                      const rate = total > 0 ? Math.round((pCount / total) * 100) : 0;
                      return (
                        <tr key={att.id} className="hover:bg-slate-50/50">
                          <td className="p-2 border-r border-slate-300 text-center font-mono">
                            {formatNum(idx + 1)}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold">
                            {formatNum(att.date)}
                          </td>
                          <td className="p-2 border-r border-slate-300">
                            {getClassShortText(att.classLevel)} • {getSubjectShortText(att.subject)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold">
                            {formatNum(total)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center text-emerald-700 font-bold">
                            {formatNum(pCount)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center text-rose-600 font-bold">
                            {formatNum(aCount)}
                          </td>
                          <td className="p-2 text-center font-bold font-sans">
                            {formatNum(rate)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td colSpan={3} className="p-2 border-r border-slate-300 text-right">
                        {language === 'bn' ? 'মোট সেশন:' : 'Total Sessions:'}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center font-sans">
                        {formatNum(filteredAttendance.length)} {language === 'bn' ? 'টি' : ''}
                      </td>
                      <td colSpan={3} className="p-2 text-center">
                        {language === 'bn' ? 'গড় উপস্থিতি হার:' : 'Average Attendance Rate:'}{' '}
                        <strong className="font-sans">
                          {(() => {
                            const totalRecs = filteredAttendance.reduce((acc, a) => acc + a.records.length, 0);
                            const presentRecs = filteredAttendance.reduce(
                              (acc, a) =>
                                acc + a.records.filter((r) => r.status === 'present' || r.status === 'late').length,
                              0
                            );
                            return totalRecs > 0 ? `${formatNum(Math.round((presentRecs / totalRecs) * 100))}%` : '০%';
                          })()}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* 4. Exams Report Table */}
            {reportType === 'exams' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-10">
                        {language === 'bn' ? 'ক্রমিক' : 'SL'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'পরীক্ষার শিরোনাম' : 'Exam Title'}
                      </th>
                      <th className="p-2 border-r border-slate-300">
                        {language === 'bn' ? 'শ্রেণি ও বিষয়' : 'Class & Subject'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-center">
                        {language === 'bn' ? 'তারিখ' : 'Date'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-center">
                        {language === 'bn' ? 'পূর্ণমান' : 'Marks'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-center">
                        {language === 'bn' ? 'পরীক্ষার্থী' : 'Examinees'}
                      </th>
                      <th className="p-2 border-r border-slate-300 text-center">
                        {language === 'bn' ? 'পাসের হার' : 'Pass Rate'}
                      </th>
                      <th className="p-2 text-center">
                        {language === 'bn' ? 'সর্বোচ্চ নম্বর' : 'Highest'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredExams.map((ex, idx) => {
                      const highest = ex.results.length > 0 ? Math.max(...ex.results.map((r) => r.obtainedMarks)) : 0;
                      const passed = ex.results.filter((r) => r.obtainedMarks >= ex.passMarks).length;
                      const total = ex.results.length;
                      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

                      return (
                        <tr key={ex.id} className="hover:bg-slate-50/50">
                          <td className="p-2 border-r border-slate-300 text-center font-mono">
                            {formatNum(idx + 1)}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-bold text-slate-900">
                            {ex.title}
                          </td>
                          <td className="p-2 border-r border-slate-300">
                            {getClassShortText(ex.classLevel)} • {getSubjectShortText(ex.subject)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-mono text-[11px]">
                            {formatNum(ex.date)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold font-sans">
                            {formatNum(ex.totalMarks)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold">
                            {formatNum(total)} {language === 'bn' ? 'জন' : ''}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold font-sans text-blue-700">
                            {formatNum(passRate)}%
                          </td>
                          <td className="p-2 text-center text-emerald-700 font-bold font-sans">
                            {formatNum(highest)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td colSpan={5} className="p-2 border-r border-slate-300 text-right">
                        {language === 'bn' ? 'মোট পরীক্ষা অনুষ্ঠিত:' : 'Total Exams Conducted:'}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center font-sans">
                        {formatNum(filteredExams.length)} {language === 'bn' ? 'টি' : ''}
                      </td>
                      <td colSpan={2} className="p-2 text-center font-sans">
                        {language === 'bn' ? 'মোট পরীক্ষার্থী এন্ট্রি:' : 'Total Examinee Entries:'}{' '}
                        <strong>
                          {formatNum(filteredExams.reduce((acc, ex) => acc + ex.results.length, 0))} {language === 'bn' ? 'জন' : ''}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Official Authority Signatures */}
        <div className="signature-section pt-14 flex items-center justify-between text-xs">
          <div className="text-center">
            <div className="w-28 border-t border-slate-400 mx-auto"></div>
            <span className="text-slate-600 text-[11px] font-medium block mt-1">
              {t('reports.preparedBy', 'প্রস্তুতকারী / প্রশাসনিক কর্মকর্তা')}
            </span>
          </div>

          <div className="text-center">
            <div className="w-32 border-t-2 border-slate-900 mx-auto font-bold text-slate-900">
              {settings.directorName || 'তাজুল স্যার'}
            </div>
            <span className="text-slate-800 font-bold text-[11px] block mt-0.5">
              {t('reports.directorSign', 'পরিচালক')}, {settings.institutionName || 'T@zul’s Care'}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {t('reports.seal', 'সিল ও স্বাক্ষর')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
