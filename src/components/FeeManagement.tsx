import React, { useState } from 'react';
import {
  CreditCard,
  PlusCircle,
  Printer,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  Share2,
  Copy,
  Check,
  Building,
  Trash2,
  ShieldAlert,
  Info,
  Layers,
  RefreshCw,
} from 'lucide-react';
import {
  FeePayment,
  Student,
  Batch,
  InstitutionSettings,
  SUPPORTED_CLASSES,
} from '../types';
import {
  toBengaliNumber,
  formatTaka,
  generateReceiptNumber,
  getCurrentMonthNameBn,
  getClassName,
  getClassShortName,
  getSubjectShortName,
  MONTH_NAMES_BN,
} from '../utils/helpers';

interface FeeManagementProps {
  fees: FeePayment[];
  students: Student[];
  batches: Batch[];
  settings: InstitutionSettings;
  onSaveFee: (fee: FeePayment) => void;
  onDeleteFee?: (feeId: string) => void;
  onDeleteMultipleFees?: (feeIds: string[]) => void;
  onUpdateStudentPaymentStatus?: (studentId: string, status: 'paid' | 'partial' | 'unpaid') => void;
}

export const FeeManagement: React.FC<FeeManagementProps> = ({
  fees,
  students,
  batches,
  settings,
  onSaveFee,
  onDeleteFee,
  onDeleteMultipleFees,
  onUpdateStudentPaymentStatus,
}) => {
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState<FeePayment | null>(null);
  const [smsCopiedId, setSmsCopiedId] = useState<string | null>(null);

  // Selection states for batch deletion & record management
  const [selectedFeeIds, setSelectedFeeIds] = useState<Set<string>>(new Set());

  // Filters
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRecordType, setFilterRecordType] = useState<'all' | 'valid' | 'orphaned'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Confirmation modal state
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    mode: 'single' | 'selected' | 'demo';
    targetFee?: FeePayment;
    targetFees?: FeePayment[];
    title: string;
    description: string;
  } | null>(null);

  // Demo review modal
  const [isDemoAuditModalOpen, setIsDemoAuditModalOpen] = useState(false);

  // Feedback notification
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Collect Fee Form states
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formMonth, setFormMonth] = useState<string>(getCurrentMonthNameBn());
  const [formMonthlyFee, setFormMonthlyFee] = useState<number>(1500);
  const [formPaidAmount, setFormPaidAmount] = useState<number>(1500);
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formPaymentDate, setFormPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formPaymentMethod, setFormPaymentMethod] = useState<
    'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank'
  >('cash');
  const [formCollectedBy, setFormCollectedBy] = useState<string>(
    settings.directorName || 'তাজুল স্যার'
  );
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Helper: check if a fee is orphaned (i.e. student profile was deleted)
  const isOrphanedFee = (fee: FeePayment) => {
    return !students.some((s) => s.id === fee.studentId || s.studentId === fee.studentId);
  };

  // Find all orphaned and demo records
  const orphanedDemoFees = fees.filter((f) => isOrphanedFee(f) || (f as any).isDemo === true);

  // Handle student selection in form
  const handleSelectStudent = (studentId: string) => {
    setFormStudentId(studentId);
    const stu = students.find((s) => s.id === studentId);
    if (stu) {
      setFormMonthlyFee(stu.monthlyFee);
      setFormPaidAmount(stu.monthlyFee);
      setFormDiscount(0);
    }
  };

  const formDueAmount = Math.max(0, formMonthlyFee - formDiscount - formPaidAmount);

  // Open Collect Modal
  const handleOpenCollect = (prefillStudentId?: string) => {
    const targetId = prefillStudentId || (students.length > 0 ? students[0].id : '');
    handleSelectStudent(targetId);
    setFormMonth(getCurrentMonthNameBn());
    setFormPaymentDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('cash');
    setFormCollectedBy(settings.directorName || 'তাজুল স্যার');
    setFormNotes('');
    setFormError(null);
    setIsCollectModalOpen(true);
  };

  // Submit payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId) {
      setFormError('অনুগ্রহ করে একজন শিক্ষার্থী নির্বাচন করুন');
      return;
    }

    const calculatedDue = Math.max(0, formMonthlyFee - formDiscount - formPaidAmount);
    const status: 'paid' | 'partial' | 'unpaid' =
      calculatedDue === 0 ? 'paid' : formPaidAmount > 0 ? 'partial' : 'unpaid';

    const newFee: FeePayment = {
      id: `fee_${Date.now()}`,
      receiptNo: generateReceiptNumber(fees.map((f) => f.receiptNo)),
      studentId: formStudentId,
      month: formMonth,
      monthlyFee: formMonthlyFee,
      paidAmount: formPaidAmount,
      discount: formDiscount,
      dueAmount: calculatedDue,
      paymentDate: formPaymentDate,
      paymentMethod: formPaymentMethod,
      status,
      collectedBy: formCollectedBy,
      notes: formNotes.trim() || undefined,
    };

    onSaveFee(newFee);
    if (onUpdateStudentPaymentStatus) {
      onUpdateStudentPaymentStatus(formStudentId, status);
    }
    setIsCollectModalOpen(false);
    showToast(`রশিদ নং ${newFee.receiptNo}-এর ফি সফলভাবে গ্রহণ করা হয়েছে!`);
    setPrintingReceipt(newFee);
  };

  // Checkbox selection handlers
  const handleToggleSelectFee = (id: string) => {
    setSelectedFeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedFeeIds.size === filteredFees.length && filteredFees.length > 0) {
      setSelectedFeeIds(new Set());
    } else {
      setSelectedFeeIds(new Set(filteredFees.map((f) => f.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedFeeIds(new Set());
  };

  // Individual fee delete prompt
  const handlePromptDeleteSingle = (fee: FeePayment) => {
    const student = students.find((s) => s.id === fee.studentId);
    const studentLabel = student ? `${student.name} (${student.studentId})` : 'অনাথ রেকর্ড (প্রোফাইল মুছে ফেলা হয়েছে)';
    setDeleteConfirmModal({
      isOpen: true,
      mode: 'single',
      targetFee: fee,
      targetFees: [fee],
      title: 'ফি রেকর্ড মুছে ফেলার নিশ্চিতকরণ',
      description: `আপনি কি রশিদ নং #${fee.receiptNo} (${studentLabel}, মাস: ${fee.month}, টাকা: ${formatTaka(fee.paidAmount)}) রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?`,
    });
  };

  // Bulk selected delete prompt
  const handlePromptDeleteSelected = () => {
    const selectedList = fees.filter((f) => selectedFeeIds.has(f.id));
    if (selectedList.length === 0) return;

    setDeleteConfirmModal({
      isOpen: true,
      mode: 'selected',
      targetFees: selectedList,
      title: 'নির্বাচিত ফি রেকর্ড মুছে ফেলার নিশ্চিতকরণ',
      description: `আপনি কি নির্বাচিত ${toBengaliNumber(selectedList.length)} টি ফি রেকর্ড স্থায়ীভাবে মুছে ফেলতে চান?`,
    });
  };

  // Demo / Orphaned delete prompt
  const handlePromptDeleteAllDemo = () => {
    if (orphanedDemoFees.length === 0) {
      showToast('কোনো অনাথ বা ডেমো ফি রেকর্ড পাওয়া যায়নি। সকল রেকর্ড বৈধ শিক্ষার্থীর সাথে সংযুক্ত।', 'info');
      return;
    }

    setDeleteConfirmModal({
      isOpen: true,
      mode: 'demo',
      targetFees: orphanedDemoFees,
      title: 'ডেমো ও অনাথ ফি রেকর্ড মুছুন',
      description: `সিস্টেমে মোট ${toBengaliNumber(orphanedDemoFees.length)} টি অনাথ বা ডেমো রেকর্ড শনাক্ত হয়েছে (যাদের শিক্ষার্থী প্রোফাইল পূর্বে মুছে ফেলা হয়েছে)। আপনি কি এগুলো স্থায়ীভাবে মুছে ফেলতে চান?`,
    });
  };

  // Execute confirmed deletion
  const handleExecuteDeletion = () => {
    if (!deleteConfirmModal || !deleteConfirmModal.targetFees) return;

    const feesToDelete = deleteConfirmModal.targetFees;
    const count = feesToDelete.length;

    if (count === 1 && onDeleteFee) {
      onDeleteFee(feesToDelete[0].id);
    } else if (onDeleteMultipleFees) {
      onDeleteMultipleFees(feesToDelete.map((f) => f.id));
    } else if (onDeleteFee) {
      feesToDelete.forEach((f) => onDeleteFee(f.id));
    }

    // Clear selection for deleted IDs
    setSelectedFeeIds((prev) => {
      const next = new Set(prev);
      feesToDelete.forEach((f) => next.delete(f.id));
      return next;
    });

    setDeleteConfirmModal(null);
    setIsDemoAuditModalOpen(false);
    showToast(`সফলভাবে ${toBengaliNumber(count)} টি ফি রেকর্ড মুছে ফেলা হয়েছে এবং হিসাব সমন্বয় করা হয়েছে।`);
  };

  // Calculate stats (Realtime reactive)
  const totalCollected = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalDue = fees.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
  const currentMonthName = getCurrentMonthNameBn();
  const currentMonthCollected = fees
    .filter((f) => f.month === currentMonthName)
    .reduce((sum, f) => sum + (f.paidAmount || 0), 0);

  // Filtered fees
  const filteredFees = fees.filter((fee) => {
    const student = students.find((s) => s.id === fee.studentId);
    const isOrphan = !student;

    // Filter by record type (Valid vs Orphaned)
    if (filterRecordType === 'valid' && isOrphan) return false;
    if (filterRecordType === 'orphaned' && !isOrphan && !(fee as any).isDemo) return false;

    // Filter by month
    const matchesMonth = filterMonth === 'all' || fee.month === filterMonth;

    // Filter by status
    const matchesStatus = filterStatus === 'all' || fee.status === filterStatus;

    // Filter by class
    const matchesClass =
      filterClass === 'all' || (student && student.classLevel === filterClass);

    // Search query: match student name, ID, receipt number, notes, collectedBy
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      fee.receiptNo.toLowerCase().includes(query) ||
      (fee.notes && fee.notes.toLowerCase().includes(query)) ||
      (fee.collectedBy && fee.collectedBy.toLowerCase().includes(query)) ||
      (student &&
        (student.name.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query))) ||
      (isOrphan && ('অনাথ'.includes(query) || 'demo'.includes(query) || 'টেস্ট'.includes(query)));

    return matchesMonth && matchesStatus && matchesClass && matchesSearch;
  });

  // Copy SMS Reminder
  const handleCopySms = (student: Student, dueAmount: number) => {
    const msg = `আসসালামু আলাইকুম। T@zul’s Care কোচিং-এ আপনার সন্তান ${student.name} (ID: ${student.studentId})-এর চলতি মাসের কোচিং ফি বকেয়া রয়েছে ৳${dueAmount}। অনুগ্রহ করে দ্রুত পরিশোধের ব্যবস্থা করবেন। ধন্যবাদ - ${settings.directorName}, T@zul’s Care।`;
    navigator.clipboard.writeText(msg);
    setSmsCopiedId(student.id);
    setTimeout(() => setSmsCopiedId(null), 2500);
  };

  const isAllFilteredSelected =
    filteredFees.length > 0 && selectedFeeIds.size === filteredFees.length;

  return (
    <div className="space-y-6">
      {/* Toast Banner Feedback */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between shadow-xs transition-all animate-in fade-in ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : toastMessage.type === 'info'
              ? 'bg-sky-50 border-sky-200 text-sky-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-700" />
            মাসিক ফি ব্যবস্থাপনা ও পেমেন্ট রেকর্ড
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            শিক্ষার্থীদের মাসিক বেতন গ্রহণ, পেমেন্ট হিসাব, রশিদ প্রিন্ট ও টেস্ট/ডেমো রেকর্ড পরিষ্কারকরণ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {orphanedDemoFees.length > 0 && (
            <button
              onClick={() => setIsDemoAuditModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              ডেমো রেকর্ড পর্যালোচনা ({toBengaliNumber(orphanedDemoFees.length)})
            </button>
          )}

          <button
            onClick={() => handleOpenCollect()}
            className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            নতুন ফি যোগ করুন
          </button>
        </div>
      </div>

      {/* Orphaned Records Alert Bar if detected */}
      {orphanedDemoFees.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm text-amber-900">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">
                ডাটাবেজে {toBengaliNumber(orphanedDemoFees.length)} টি অনাথ বা টেস্ট ফি রেকর্ড শনাক্ত করা হয়েছে
              </p>
              <p className="text-xs text-amber-800/90 mt-0.5">
                এসব রেকর্ডের সংশ্লিষ্ট শিক্ষার্থী প্রোফাইল পূর্বে মুছে ফেলা হয়েছিল। আপনি চাইলে এগুলো নিরাপদে ডিলিট করে হিসাব পরিষ্কার করতে পারেন।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => setIsDemoAuditModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              রেকর্ডগুলো দেখুন
            </button>
            <button
              onClick={handlePromptDeleteAllDemo}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ডেমো রেকর্ড মুছুন
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            সর্বমোট ফি আদায় (পেমেন্ট হিসাব)
          </span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700 font-sans">
            {formatTaka(totalCollected)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            মোট ট্রানজ্যাকশন: {toBengaliNumber(fees.length)} টি
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            মোট বকেয়া ব্যালেন্স
          </span>
          <div className="mt-2 text-2xl font-extrabold text-rose-600 font-sans">
            {formatTaka(totalDue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            বকেয়া ট্রানজ্যাকশন সংখ্যা: {toBengaliNumber(fees.filter((f) => f.dueAmount > 0).length)} টি
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            চলতি মাসের আদায় ({currentMonthName})
          </span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-sans">
            {formatTaka(currentMonthCollected)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            চলতি মাসে এন্ট্রি: {toBengaliNumber(fees.filter((f) => f.month === currentMonthName).length)} জন
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Query */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষার্থী নাম, আইডি, রশিদ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Filter Month */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">সকল মাস</option>
            {MONTH_NAMES_BN.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Filter Class */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">সকল শ্রেণি (Class 5 - 10)</option>
            {SUPPORTED_CLASSES.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.nameBn}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="paid">পরিশোধিত (Paid)</option>
            <option value="partial">আংশিক বকেয়া (Partial)</option>
            <option value="unpaid">সম্পূর্ণ বকেয়া (Unpaid)</option>
          </select>

          {/* Filter Record Type (All, Valid, Orphaned/Demo) */}
          <select
            value={filterRecordType}
            onChange={(e) => setFilterRecordType(e.target.value as any)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">সকল রেকর্ড ({toBengaliNumber(fees.length)})</option>
            <option value="valid">সংযুক্ত শিক্ষার্থী রেকর্ড ({toBengaliNumber(fees.length - orphanedDemoFees.length)})</option>
            <option value="orphaned">অনাথ / ডেমো রেকর্ড ({toBengaliNumber(orphanedDemoFees.length)})</option>
          </select>
        </div>

        {/* Bulk Action Toolbar if records are selected */}
        {selectedFeeIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-300 animate-in fade-in gap-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-950">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>{toBengaliNumber(selectedFeeIds.size)} টি ফি রেকর্ড নির্বাচন করা হয়েছে</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePromptDeleteSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                নির্বাচিত রেকর্ড মুছুন ({toBengaliNumber(selectedFeeIds.size)})
              </button>
              <button
                onClick={handleClearSelection}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                নির্বাচন বাতিল
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Records Table */}
      {fees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            বর্তমানে কোনো ফি রেকর্ড নেই
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
            শিক্ষার্থীদের মাসিক বেতন গ্রহণ করে রশিদ তৈরি ও প্রিন্ট করুন।
          </p>
          <button
            onClick={() => handleOpenCollect()}
            className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            নতুন ফি যোগ করুন
          </button>
        </div>
      ) : filteredFees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs space-y-2">
          <p className="text-sm font-bold text-slate-700">কোনো ফি রেকর্ড পাওয়া যায়নি।</p>
          <p className="text-xs text-slate-400">
            ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন বা নতুন ফি গ্রহণ করুন।
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={handleSelectAllFiltered}
                      title="রেকর্ড নির্বাচন করুন"
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">রশিদ নং ও তারিখ</th>
                  <th className="py-3 px-3">শিক্ষার্থীর বিবরণ</th>
                  <th className="py-3 px-3">মাস</th>
                  <th className="py-3 px-3">নির্ধারিত বেতন</th>
                  <th className="py-3 px-3">প্রাপ্ত টাকা</th>
                  <th className="py-3 px-3">বকেয়া</th>
                  <th className="py-3 px-3">মাধ্যম ও বিবরণ</th>
                  <th className="py-3 px-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFees.map((fee) => {
                  const student = students.find((s) => s.id === fee.studentId || s.studentId === fee.studentId);
                  const isOrphan = !student;
                  const isSelected = selectedFeeIds.has(fee.id);

                  return (
                    <tr
                      key={fee.id}
                      className={`transition ${
                        isSelected ? 'bg-amber-50/70' : isOrphan ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectFee(fee.id)}
                          aria-label={`Select fee ${fee.receiptNo}`}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 cursor-pointer"
                        />
                      </td>

                      {/* Receipt No & Date */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-slate-800 block">
                          {fee.receiptNo}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {toBengaliNumber(fee.paymentDate)}
                        </span>
                      </td>

                      {/* Student Info */}
                      <td className="py-3 px-3">
                        {student ? (
                          <div>
                            <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                              {student.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {student.studentId} • {getClassShortName(student.classLevel)}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              অনাথ / ডেমো রেকর্ড
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              শিক্ষার্থী আইডি: {fee.studentId || 'মুছে গেছে'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Month */}
                      <td className="py-3 px-3 text-xs font-semibold text-slate-700">
                        {fee.month}
                      </td>

                      {/* Monthly Fee */}
                      <td className="py-3 px-3 font-bold text-slate-800 font-sans text-xs">
                        {formatTaka(fee.monthlyFee)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-3 font-bold text-emerald-700 font-sans text-xs">
                        {formatTaka(fee.paidAmount)}
                      </td>

                      {/* Due Amount */}
                      <td className="py-3 px-3">
                        {fee.dueAmount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-rose-600 font-sans text-xs">
                              {formatTaka(fee.dueAmount)}
                            </span>
                            {student && (
                              <button
                                onClick={() => handleCopySms(student, fee.dueAmount)}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="বকেয়া তাগাদা SMS কপি করুন"
                              >
                                {smsCopiedId === student.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600">পরিশোধিত</span>
                        )}
                      </td>

                      {/* Payment Method & Description/Notes */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {fee.paymentMethod}
                          </span>
                          {fee.notes && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-[130px]" title={fee.notes}>
                              {fee.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions: Print Receipt & Delete */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintingReceipt(fee)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg cursor-pointer transition"
                            title="মানি রিসিট প্রিন্ট করুন"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">রশিদ</span>
                          </button>

                          <button
                            onClick={() => handlePromptDeleteSingle(fee)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                            title="এই ফি রেকর্ডটি মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              <span>মোট প্রদর্শিত রেকর্ড: <strong>{toBengaliNumber(filteredFees.length)}</strong> টি</span>
              {selectedFeeIds.size > 0 && (
                <span className="ml-3 text-amber-800 font-bold">
                  ({toBengaliNumber(selectedFeeIds.size)} টি নির্বাচিত)
                </span>
              )}
            </div>
            <div>
              <span>মোট আদায়: <strong>{formatTaka(filteredFees.reduce((s, f) => s + f.paidAmount, 0))}</strong></span>
              <span className="mx-2">•</span>
              <span>মোট বকেয়া: <strong className="text-rose-600">{formatTaka(filteredFees.reduce((s, f) => s + f.dueAmount, 0))}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Demo / Orphaned Records Review & Delete Modal */}
      {isDemoAuditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  অনাথ ও টেস্ট ডেমো ফি রেকর্ড পর্যালোচনা
                </h3>
              </div>
              <button
                onClick={() => setIsDemoAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              নিচে তালিকাভুক্ত ফি রেকর্ডগুলোর মূল শিক্ষার্থী প্রোফাইল সিস্টেম থেকে আগেই মুছে ফেলা হয়েছে। এসব রেকর্ড আপনার বর্তমান আসল শিক্ষার্থীদের হিসাবের সাথে জড়িত নয়। আপনি চাইলে এগুলো পর্যালোচনা করে এক ক্লিকে মুছে ফেলতে পারেন।
            </p>

            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {orphanedDemoFees.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  কোনো অনাথ বা ডেমো রেকর্ড অবশিষ্ট নেই।
                </div>
              ) : (
                orphanedDemoFees.map((fee) => (
                  <div key={fee.id} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{fee.receiptNo}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-700">{fee.month}</span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.2 rounded-full font-bold">
                          প্রোফাইল নেই
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        আইডি: {fee.studentId} • তারিখ: {toBengaliNumber(fee.paymentDate)} • মাধ্যম: {fee.paymentMethod}
                        {fee.notes && ` • নোট: ${fee.notes}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 block">{formatTaka(fee.paidAmount)}</span>
                      <button
                        onClick={() => handlePromptDeleteSingle(fee)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline mt-0.5"
                      >
                        মুছুন
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500">
                মোট শনাক্ত: {toBengaliNumber(orphanedDemoFees.length)} টি রেকর্ড
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDemoAuditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                {orphanedDemoFees.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePromptDeleteAllDemo}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    সবগুলো ডেমো রেকর্ড মুছুন
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {deleteConfirmModal && deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-rose-700 pb-2 border-b border-rose-100">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{deleteConfirmModal.title}</h3>
                <span className="text-[11px] text-rose-600 font-medium">স্থায়ীভাবে রেকর্ড অপসারণ</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {deleteConfirmModal.description}
            </p>

            {deleteConfirmModal.targetFees && deleteConfirmModal.targetFees.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 max-h-36 overflow-y-auto">
                <span className="font-bold text-slate-700 block text-[11px] uppercase">
                  মুছে ফেলার জন্য নির্বাচিত রেকর্ড:
                </span>
                {deleteConfirmModal.targetFees.slice(0, 5).map((f) => (
                  <div key={f.id} className="flex justify-between text-slate-600">
                    <span className="font-mono font-bold">{f.receiptNo} ({f.month})</span>
                    <span className="font-sans font-semibold">{formatTaka(f.paidAmount)}</span>
                  </div>
                ))}
                {deleteConfirmModal.targetFees.length > 5 && (
                  <span className="text-[10px] text-slate-400 italic block pt-1">
                    ...এবং আরও {toBengaliNumber(deleteConfirmModal.targetFees.length - 5)} টি রেকর্ড
                  </span>
                )}
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-normal flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                সতর্কতা: রেকর্ড মুছে ফেললে তা ডাটাবেজ থেকে স্থায়ীভাবে বাদ যাবে। বৈধ শিক্ষার্থীদের ক্ষেত্রে তাদের বকেয়া হিসাব স্বয়ংক্রিয়ভাবে পুনর্গণনা করা হবে।
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleExecuteDeletion}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs cursor-pointer transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                হ্যাঁ, রেকর্ড মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Fee Modal */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-700" />
                শিক্ষার্থীর নতুন ফি গ্রহণ (Fee Collection)
              </h3>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="mt-4 space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                  {formError}
                </div>
              )}

              {/* Student Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শিক্ষার্থী নির্বাচন করুন*
                </label>
                <select
                  value={formStudentId}
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- শিক্ষার্থী নির্বাচন করুন --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentId} • {getClassShortName(s.classLevel)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month & Payment Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কোন মাসের বেতন?
                  </label>
                  <input
                    type="text"
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-medium"
                    placeholder="মার্চ ২০২৬"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পরিশোধের তারিখ
                  </label>
                  <input
                    type="date"
                    value={formPaymentDate}
                    onChange={(e) => setFormPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Fee Amounts: Monthly Fee, Discount, Paid */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      মাসিক বেতন (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMonthlyFee}
                      onChange={(e) => setFormMonthlyFee(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ছাড় / মওকুফ (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      প্রাপ্ত টাকা (৳)*
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formPaidAmount}
                      onChange={(e) => setFormPaidAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-500 bg-white font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 font-bold">
                  <span className="text-slate-600">অবশিষ্ট বকেয়া:</span>
                  <span
                    className={
                      formDueAmount > 0 ? 'text-rose-600 font-bold text-sm' : 'text-emerald-600'
                    }
                  >
                    {formatTaka(formDueAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Method & Collected By */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) =>
                      setFormPaymentMethod(
                        e.target.value as 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank'
                      )
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="cash">নগদ (Cash)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="rocket">রকেট (Rocket)</option>
                    <option value="bank">ব্যাংক (Bank)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    আদায়কারী
                  </label>
                  <input
                    type="text"
                    value={formCollectedBy}
                    onChange={(e) => setFormCollectedBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মন্তব্য / ট্রানজ্যাকশন আইডি ও বিবরণ (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="উদাঃ bKash TrxID: 9X8Y7Z"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs cursor-pointer"
                >
                  ফি সংরক্ষণ ও রশিদ তৈরি
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal (Official Money Receipt) */}
      {printingReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 print-container">
            {/* Header controls (hidden when printed) */}
            <div className="no-print flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase">
                মানি রিসিট প্রিভিউ
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-800 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট করুন
                </button>
                <button
                  onClick={() => setPrintingReceipt(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="border-2 border-slate-900 p-6 rounded-xl bg-white text-slate-900">
              {/* Institution Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      className="w-10 h-10 object-contain"
                    />
                  ) : null}
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    {settings.institutionName || 'T@zul’s Care'}
                  </h1>
                </div>
                <p className="text-xs font-bold text-slate-700">
                  {settings.tagline || 'গণিত ও উচ্চতর গণিত স্পেশাল কেয়ার'}
                </p>
                <p className="text-[11px] text-slate-600">
                  {settings.address} • মোবাইল: {toBengaliNumber(settings.phone)}
                </p>
                <div className="inline-block mt-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full">
                  টাকা প্রাপ্তির মানি রিসিট (MONEY RECEIPT)
                </div>
              </div>

              {/* Receipt Details */}
              {(() => {
                const stu = students.find((s) => s.id === printingReceipt.studentId || s.studentId === printingReceipt.studentId);
                return (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
                      <span>
                        <strong>রশিদ নম্বর:</strong>{' '}
                        <span className="font-mono font-bold">{printingReceipt.receiptNo}</span>
                      </span>
                      <span>
                        <strong>তারিখ:</strong> {toBengaliNumber(printingReceipt.paymentDate)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-b border-dashed border-slate-300 pb-2">
                      <div>
                        <strong>শিক্ষার্থীর নাম:</strong>{' '}
                        <span className="font-bold">{stu ? stu.name : 'অনাথ রেকর্ড (প্রোফাইল মুছে ফেলা হয়েছে)'}</span>
                      </div>
                      <div>
                        <strong>আইডি:</strong>{' '}
                        <span className="font-mono">{stu ? stu.studentId : printingReceipt.studentId}</span>
                      </div>
                      <div>
                        <strong>শ্রেণি:</strong>{' '}
                        <span>{stu ? getClassShortName(stu.classLevel) : '—'}</span>
                      </div>
                      <div>
                        <strong>অভিভাবক:</strong>{' '}
                        <span>{stu ? stu.guardianName : '—'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex justify-between">
                        <span>বেতনের মাস:</span>
                        <strong className="font-bold">{printingReceipt.month}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>নির্ধারিত মাসিক ফি:</span>
                        <span className="font-bold font-sans">{formatTaka(printingReceipt.monthlyFee)}</span>
                      </div>
                      {printingReceipt.discount > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>মওকুফ / ছাড়:</span>
                          <span className="font-sans">(-) {formatTaka(printingReceipt.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-300 pt-1 text-sm">
                        <span>প্রাপ্ত টাকা (পরিশোধিত):</span>
                        <span className="font-sans">{formatTaka(printingReceipt.paidAmount)}</span>
                      </div>
                      {printingReceipt.dueAmount > 0 && (
                        <div className="flex justify-between text-rose-600 font-bold">
                          <span>অবশিষ্ট বকেয়া:</span>
                          <span className="font-sans">{formatTaka(printingReceipt.dueAmount)}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600 pt-1">
                      <span>পেমেন্ট পদ্ধতি: <strong>{printingReceipt.paymentMethod.toUpperCase()}</strong></span>
                      {printingReceipt.notes && (
                        <span className="ml-3">বিবরণ / নোট: {printingReceipt.notes}</span>
                      )}
                    </div>

                    {/* Signature lines */}
                    <div className="pt-10 flex items-center justify-between text-[11px]">
                      <div className="text-center">
                        <div className="w-24 border-t border-slate-400"></div>
                        <span className="text-slate-500 text-[10px] block mt-1">অভিভাবকের স্বাক্ষর</span>
                      </div>

                      <div className="text-center">
                        <div className="w-28 border-t border-slate-900 font-bold text-slate-900">
                          {printingReceipt.collectedBy || settings.directorName}
                        </div>
                        <span className="text-slate-700 font-bold text-[10px] block mt-0.5">
                          কর্তৃপক্ষের স্বাক্ষর
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
