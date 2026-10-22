import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  PlusCircle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Edit,
  Trash2,
  DollarSign,
  Printer,
  Eye,
  Check,
  X,
  Shield,
  ShieldCheck,
  Layers,
  MapPin,
  Info,
  History,
  Download,
  AlertCircle,
} from 'lucide-react';
import {
  Student,
  Batch,
  ClassLevel,
  ExaminationEvent,
  ExaminationType,
  ExamFeeRecord,
  AdmitCardClearanceRecord,
  ClearanceAuditLog,
  InstitutionSettings,
  SUPPORTED_CLASSES,
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AdmitCardDocument } from './AdmitCardDocument';
import { evaluateAdmitCardAccess } from '../utils/admitCardAuth';

interface ExaminationAdmitCardManagementProps {
  students: Student[];
  batches: Batch[];
  examinationEvents: ExaminationEvent[];
  examFeeRecords: ExamFeeRecord[];
  admitCardClearances: AdmitCardClearanceRecord[];
  auditLogs: ClearanceAuditLog[];
  settings: InstitutionSettings;
  adminUsername: string;
  onSaveExamEvent: (event: ExaminationEvent) => void;
  onDeleteExamEvent: (id: string) => void;
  onSaveExamFeeRecord: (record: ExamFeeRecord) => void;
  onSaveClearance: (record: AdmitCardClearanceRecord) => void;
  onAddAuditLog: (log: ClearanceAuditLog) => void;
}

export const ExaminationAdmitCardManagement: React.FC<ExaminationAdmitCardManagementProps> = ({
  students,
  batches,
  examinationEvents,
  examFeeRecords,
  admitCardClearances,
  auditLogs,
  settings,
  adminUsername,
  onSaveExamEvent,
  onDeleteExamEvent,
  onSaveExamFeeRecord,
  onSaveClearance,
  onAddAuditLog,
}) => {
  const {
    t,
    language,
    formatNum,
    formatMoney,
    getClassNameText,
    getClassShortText,
  } = useLanguage();

  // Navigation Subtabs
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'clearance' | 'audit'>(
    'overview'
  );

  // Filters
  const [filterExamId, setFilterExamId] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterClearanceStatus, setFilterClearanceStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExaminationEvent | null>(null);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState<ExaminationEvent | null>(null);

  const [paymentModalRecord, setPaymentModalRecord] = useState<{
    student: Student;
    exam: ExaminationEvent;
    feeRecord?: ExamFeeRecord;
  } | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [payMethodInput, setPayMethodInput] = useState<
    'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank'
  >('cash');
  const [payTrxRefInput, setPayTrxRefInput] = useState<string>('');
  const [payNotesInput, setPayNotesInput] = useState<string>('');

  // Admit Card Preview Modal
  const [previewAdmitCard, setPreviewAdmitCard] = useState<{
    student: Student;
    batch?: Batch | null;
    exam: ExaminationEvent;
    clearance: AdmitCardClearanceRecord;
  } | null>(null);

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );
  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Exam Form States
  const [formTitle, setFormTitle] = useState('');
  const [formExamType, setFormExamType] = useState<ExaminationType>('monthly');
  const [formClassLevels, setFormClassLevels] = useState<ClassLevel[]>(['class_10']);
  const [formBatchIds, setFormBatchIds] = useState<string[]>([]);
  const [formSubject, setFormSubject] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('10:00 AM - 01:00 PM');
  const [formFee, setFormFee] = useState<number>(300);
  const [formCenter, setFormCenter] = useState('Room-101 & 102, Main Campus');
  const [formInstructions, setFormInstructions] = useState(
    'প্রবেশপত্র ছাড়া পরীক্ষায় অংশগ্রহণ করা যাবে না। পরীক্ষা শুরুর ১৫ মিনিট পূর্বে আসন গ্রহণ করতে হবে।'
  );
  const [formStatus, setFormStatus] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [formIsAdmitPublished, setFormIsAdmitPublished] = useState<boolean>(true);

  // Open Create Exam Modal
  const handleOpenCreateExam = () => {
    setEditingExam(null);
    setFormTitle('');
    setFormExamType('monthly');
    setFormClassLevels(['class_10']);
    setFormBatchIds([]);
    setFormSubject('math');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setFormDate(defaultDate.toISOString().split('T')[0]);
    setFormTime('10:00 AM - 01:00 PM');
    setFormFee(300);
    setFormCenter('Room-101 & 102, Main Campus');
    setFormInstructions(
      'প্রবেশপত্র ছাড়া পরীক্ষায় অংশগ্রহণ করা যাবে না। পরীক্ষা শুরুর ১৫ মিনিট পূর্বে আসন গ্রহণ করতে হবে।'
    );
    setFormStatus('active');
    setFormIsAdmitPublished(true);
    setIsExamModalOpen(true);
  };

  // Open Edit Exam Modal
  const handleOpenEditExam = (exam: ExaminationEvent) => {
    setEditingExam(exam);
    setFormTitle(exam.title);
    setFormExamType(exam.examType);
    setFormClassLevels(exam.classLevels);
    setFormBatchIds(exam.batchIds);
    setFormSubject(exam.subject || '');
    setFormDate(exam.examDate);
    setFormTime(exam.examTime);
    setFormFee(exam.examFee);
    setFormCenter(exam.centerRoom);
    setFormInstructions(exam.instructions);
    setFormStatus(exam.status);
    setFormIsAdmitPublished(exam.isAdmitCardPublished);
    setIsExamModalOpen(true);
  };

  // Save Examination
  const handleSaveExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showFeedback('অনুগ্রহ করে পরীক্ষার নাম লিখুন।', 'error');
      return;
    }
    if (formClassLevels.length === 0) {
      showFeedback('অনুগ্রহ করে অন্তত একটি শ্রেণি নির্বাচন করুন।', 'error');
      return;
    }

    const examId = editingExam ? editingExam.id : `exam_${Date.now()}`;
    const eventObj: ExaminationEvent = {
      id: examId,
      title: formTitle.trim(),
      examType: formExamType,
      classLevels: formClassLevels,
      batchIds: formBatchIds,
      subject: formSubject.trim() || undefined,
      examDate: formDate,
      examTime: formTime.trim(),
      examFee: Number(formFee) || 0,
      centerRoom: formCenter.trim(),
      instructions: formInstructions.trim(),
      status: formStatus,
      isAdmitCardPublished: formIsAdmitPublished,
      createdAt: editingExam ? editingExam.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveExamEvent(eventObj);

    // Record audit log
    onAddAuditLog({
      id: `audit_${Date.now()}`,
      action: 'create_exam',
      adminUsername,
      studentId: 'ALL',
      studentName: 'System Broadcast',
      examId: eventObj.id,
      examTitle: eventObj.title,
      newStatus: eventObj.status,
      timestamp: new Date().toISOString(),
      notes: editingExam ? 'Examination updated' : 'New examination created',
    });

    setIsExamModalOpen(false);
    showFeedback(
      editingExam ? 'পরীক্ষার বিবরণ সফলভাবে আপডেট করা হয়েছে।' : 'নতুন পরীক্ষা সফলভাবে তৈরি করা হয়েছে।'
    );
  };

  // Delete Examination
  const handleConfirmDeleteExam = () => {
    if (!deleteConfirmExam) return;
    onDeleteExamEvent(deleteConfirmExam.id);
    setDeleteConfirmExam(null);
    showFeedback('পরীক্ষাটি সফলভাবে মুছে ফেলা হয়েছে।');
  };

  // Toggle Publish Admit Cards for an Exam
  const handleTogglePublishAdmit = (exam: ExaminationEvent) => {
    const updated: ExaminationEvent = {
      ...exam,
      isAdmitCardPublished: !exam.isAdmitCardPublished,
      updatedAt: new Date().toISOString(),
    };
    onSaveExamEvent(updated);
    onAddAuditLog({
      id: `audit_${Date.now()}`,
      action: 'publish_admit_card',
      adminUsername,
      studentId: 'ALL',
      studentName: 'All Candidates',
      examId: exam.id,
      examTitle: exam.title,
      newStatus: updated.isAdmitCardPublished ? 'PUBLISHED' : 'UNPUBLISHED',
      timestamp: new Date().toISOString(),
      notes: updated.isAdmitCardPublished
        ? 'Admit cards published to candidates'
        : 'Admit cards publication suspended',
    });
    showFeedback(
      updated.isAdmitCardPublished
        ? 'অ্যাডমিট কার্ড সফলভাবে শিক্ষার্থীদের জন্য প্রকাশ করা হয়েছে।'
        : 'অ্যাডমিট কার্ডের প্রকাশনা স্থগিত করা হয়েছে।'
    );
  };

  // Open Payment Verification Modal
  const handleOpenPaymentVerification = (
    student: Student,
    exam: ExaminationEvent,
    feeRecord?: ExamFeeRecord
  ) => {
    setPaymentModalRecord({ student, exam, feeRecord });
    setPayAmountInput(feeRecord ? feeRecord.paidAmount || exam.examFee : exam.examFee);
    setPayMethodInput((feeRecord?.paymentMethod as any) || 'cash');
    setPayTrxRefInput(feeRecord?.transactionRef || feeRecord?.transactionId || '');
    setPayNotesInput(feeRecord?.notes || '');
  };

  // Submit Verified Payment
  const handleConfirmPayment = (status: 'paid' | 'rejected') => {
    if (!paymentModalRecord) return;
    const { student, exam, feeRecord } = paymentModalRecord;

    const recordId = feeRecord ? feeRecord.id : `examfee_${exam.id}_${student.studentId}`;
    const updatedFeeRecord: ExamFeeRecord = {
      id: recordId,
      examId: exam.id,
      examTitle: exam.title,
      studentId: student.studentId,
      studentDbId: student.id,
      studentName: student.name,
      classLevel: student.classLevel,
      batchId: student.batchId,
      requiredFee: exam.examFee,
      paidAmount: status === 'paid' ? Number(payAmountInput) || exam.examFee : 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: payMethodInput,
      transactionRef: payTrxRefInput.trim(),
      status,
      notes: payNotesInput.trim(),
      verifiedBy: adminUsername,
      verifiedAt: new Date().toISOString(),
      createdAt: feeRecord ? feeRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveExamFeeRecord(updatedFeeRecord);

    // If payment rejected, automatically set clearance to pending or rejected
    if (status === 'rejected') {
      const clearanceId = `clr_${exam.id}_${student.studentId}`;
      const existingClr = admitCardClearances.find(
        (c) => c.examId === exam.id && c.studentId === student.studentId
      );
      if (existingClr && existingClr.clearanceStatus === 'approved') {
        onSaveClearance({
          ...existingClr,
          clearanceStatus: 'pending',
          remarks: 'Payment was rejected during verification',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Record Audit Log
    onAddAuditLog({
      id: `audit_${Date.now()}`,
      action: status === 'paid' ? 'verify_payment' : 'reject_payment',
      adminUsername,
      studentId: student.studentId,
      studentName: student.name,
      examId: exam.id,
      examTitle: exam.title,
      newStatus: status.toUpperCase(),
      timestamp: new Date().toISOString(),
      notes: `Amount: ৳${updatedFeeRecord.paidAmount}, Ref: ${updatedFeeRecord.transactionRef || 'N/A'}`,
    });

    setPaymentModalRecord(null);
    showFeedback(
      status === 'paid'
        ? `শিক্ষার্থী ${student.name}-এর পরীক্ষার ফি যাচাই ও অনুমোদিত হয়েছে।`
        : `শিক্ষার্থী ${student.name}-এর পেমেন্ট বাতিল চিহ্নিত করা হয়েছে।`
    );
  };

  // Approve Clearance for a Student
  const handleApproveClearance = (student: Student, exam: ExaminationEvent) => {
    const feeRecord = examFeeRecords.find(
      (f) => f.examId === exam.id && f.studentId === student.studentId
    );
    const clearanceId = `clr_${exam.id}_${student.studentId}`;
    const existing = admitCardClearances.find(
      (c) => c.examId === exam.id && c.studentId === student.studentId
    );

    const admitCardRef =
      existing?.admitCardRef ||
      `AC-${student.studentId}-${exam.id.slice(-4).toUpperCase()}`;

    const newClearance: AdmitCardClearanceRecord = {
      id: clearanceId,
      examId: exam.id,
      studentId: student.studentId,
      studentDbId: student.id,
      studentName: student.name,
      classLevel: student.classLevel,
      batchId: student.batchId,
      clearanceStatus: 'approved',
      approvedBy: adminUsername,
      approvedAt: new Date().toISOString(),
      remarks: 'Clearance explicitly approved by administrator',
      admitCardRef,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveClearance(newClearance);

    onAddAuditLog({
      id: `audit_${Date.now()}`,
      action: 'approve_clearance',
      adminUsername,
      studentId: student.studentId,
      studentName: student.name,
      examId: exam.id,
      examTitle: exam.title,
      previousStatus: existing ? existing.clearanceStatus : 'pending',
      newStatus: 'APPROVED',
      timestamp: new Date().toISOString(),
      notes: `Admit card reference issued: ${admitCardRef}`,
    });

    showFeedback(`শিক্ষার্থী ${student.name}-এর অ্যাডমিট কার্ড ক্লিয়ারেন্স অনুমোদিত হয়েছে।`);
  };

  // Revoke / Reject Clearance
  const handleRevokeClearance = (
    student: Student,
    exam: ExaminationEvent,
    status: 'revoked' | 'rejected'
  ) => {
    const clearanceId = `clr_${exam.id}_${student.studentId}`;
    const existing = admitCardClearances.find(
      (c) => c.examId === exam.id && c.studentId === student.studentId
    );

    const updated: AdmitCardClearanceRecord = {
      id: clearanceId,
      examId: exam.id,
      studentId: student.studentId,
      studentDbId: student.id,
      studentName: student.name,
      classLevel: student.classLevel,
      batchId: student.batchId,
      clearanceStatus: status,
      approvedBy: adminUsername,
      approvedAt: new Date().toISOString(),
      remarks: status === 'revoked' ? 'Clearance revoked by administrator' : 'Clearance rejected',
      admitCardRef: existing?.admitCardRef || `AC-${student.studentId}-${exam.id.slice(-4)}`,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveClearance(updated);

    onAddAuditLog({
      id: `audit_${Date.now()}`,
      action: status === 'revoked' ? 'revoke_clearance' : 'reject_clearance',
      adminUsername,
      studentId: student.studentId,
      studentName: student.name,
      examId: exam.id,
      examTitle: exam.title,
      previousStatus: existing ? existing.clearanceStatus : 'pending',
      newStatus: status.toUpperCase(),
      timestamp: new Date().toISOString(),
      notes: `Status changed to ${status}`,
    });

    showFeedback(
      status === 'revoked'
        ? `শিক্ষার্থী ${student.name}-এর ক্লিয়ারেন্স প্রত্যাহার (Revoke) করা হয়েছে।`
        : `শিক্ষার্থী ${student.name}-এর ক্লিয়ারেন্স প্রত্যাখ্যাত হয়েছে।`
    );
  };

  // Compile all Candidate-Exam Pairs for the Clearance Table & Overview
  const candidateExamPairs = useMemo(() => {
    const pairs: {
      student: Student;
      exam: ExaminationEvent;
      batch?: Batch | null;
      feeRecord?: ExamFeeRecord;
      clearanceRecord?: AdmitCardClearanceRecord;
      evaluation: ReturnType<typeof evaluateAdmitCardAccess>;
    }[] = [];

    // Filter which exams to process
    const examsToConsider =
      filterExamId === 'all'
        ? examinationEvents
        : examinationEvents.filter((e) => e.id === filterExamId);

    examsToConsider.forEach((exam) => {
      // Find students eligible by class and batch assignment
      const assignedStudents = students.filter((s) => {
        const matchesClass = exam.classLevels.includes(s.classLevel);
        const matchesBatch =
          exam.batchIds.length === 0 ||
          (s.batchId && exam.batchIds.includes(s.batchId));
        return matchesClass || matchesBatch;
      });

      assignedStudents.forEach((student) => {
        const batch = batches.find((b) => b.id === student.batchId) || null;
        const feeRecord = examFeeRecords.find(
          (f) => f.examId === exam.id && f.studentId === student.studentId
        );
        const clearanceRecord = admitCardClearances.find(
          (c) => c.examId === exam.id && c.studentId === student.studentId
        );
        const evaluation = evaluateAdmitCardAccess(
          student,
          exam,
          feeRecord,
          clearanceRecord
        );

        pairs.push({
          student,
          exam,
          batch,
          feeRecord,
          clearanceRecord,
          evaluation,
        });
      });
    });

    return pairs;
  }, [examinationEvents, students, batches, examFeeRecords, admitCardClearances, filterExamId]);

  // Filtered Candidate Pairs for the Clearance Table
  const filteredCandidatePairs = useMemo(() => {
    return candidateExamPairs.filter((pair) => {
      // Class filter
      if (filterClass !== 'all' && pair.student.classLevel !== filterClass) return false;

      // Batch filter
      if (filterBatch !== 'all' && pair.student.batchId !== filterBatch) return false;

      // Payment Status filter
      if (filterPaymentStatus !== 'all') {
        const status = pair.feeRecord
          ? pair.feeRecord.status
          : pair.exam.examFee === 0
          ? 'paid'
          : 'unpaid';
        if (status !== filterPaymentStatus) return false;
      }

      // Clearance Status filter
      if (filterClearanceStatus !== 'all') {
        const clrStatus = pair.clearanceRecord
          ? pair.clearanceRecord.clearanceStatus
          : 'pending';
        if (clrStatus !== filterClearanceStatus) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = pair.student.name.toLowerCase().includes(q);
        const matchesId = pair.student.studentId.toLowerCase().includes(q);
        const matchesExam = pair.exam.title.toLowerCase().includes(q);
        const matchesRef = pair.clearanceRecord?.admitCardRef.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesExam && !matchesRef) return false;
      }

      return true;
    });
  }, [
    candidateExamPairs,
    filterClass,
    filterBatch,
    filterPaymentStatus,
    filterClearanceStatus,
    searchQuery,
  ]);

  // Overall Dynamic Analytics Figures
  const stats = useMemo(() => {
    const totalAssigned = candidateExamPairs.length;
    let feesPaid = 0;
    let feesUnpaid = 0;
    let pendingVerification = 0;
    let clearancePending = 0;
    let clearanceApproved = 0;
    let admitCardsPublished = 0;

    candidateExamPairs.forEach((pair) => {
      const pStatus = pair.feeRecord
        ? pair.feeRecord.status
        : pair.exam.examFee === 0
        ? 'paid'
        : 'unpaid';
      const cStatus = pair.clearanceRecord
        ? pair.clearanceRecord.clearanceStatus
        : 'pending';

      if (pStatus === 'paid') feesPaid++;
      else if (pStatus === 'pending') pendingVerification++;
      else feesUnpaid++;

      if (cStatus === 'approved') clearanceApproved++;
      else clearancePending++;

      if (pair.evaluation.canAccess) {
        admitCardsPublished++;
      }
    });

    return {
      totalAssigned,
      feesPaid,
      feesUnpaid,
      pendingVerification,
      clearancePending,
      clearanceApproved,
      admitCardsPublished,
    };
  }, [candidateExamPairs]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Top Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-700" />
            {t('admitCards.adminTitle', 'পরীক্ষা ও অ্যাডমিট কার্ড ব্যবস্থাপনা (Examination & Admit Card Management)')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t(
              'admitCards.adminSubtitle',
              'পরীক্ষা নির্ধারণ, পরীক্ষার ফি যাচাই, অ্যাডমিন ক্লিয়ারেন্স অনুমোদন এবং প্রবেশপত্র প্রকাশ'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateExam}
            className="inline-flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg cursor-pointer transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('admitCards.createExamBtn', 'নতুন পরীক্ষা তৈরি করুন')}</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>{language === 'bn' ? 'সারসংক্ষেপ ও পরিসংখ্যান' : 'Overview & Stats'}</span>
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'exams'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{language === 'bn' ? 'পরীক্ষা তালিকা ও শিডিউল' : 'Examinations'}</span>
            <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">
              {formatNum(examinationEvents.length)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('clearance')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'clearance'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{language === 'bn' ? 'ফি যাচাই ও ক্লিয়ারেন্স টেবিল' : 'Clearance & Verification'}</span>
            <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">
              {formatNum(filteredCandidatePairs.length)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{language === 'bn' ? 'অডিট লগ' : 'Audit Logs'}</span>
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW & ANALYTICS DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Dynamic Figures Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'bn' ? 'মোট পরীক্ষার্থী' : 'Total Candidates'}
              </span>
              <div className="mt-1 text-2xl font-black text-slate-900 font-sans">
                {formatNum(stats.totalAssigned)}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-200/90 shadow-xs text-center bg-emerald-50/20">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                {language === 'bn' ? 'ফি পরিশোধিত' : 'Fees Paid'}
              </span>
              <div className="mt-1 text-2xl font-black text-emerald-700 font-sans">
                {formatNum(stats.feesPaid)}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-200/90 shadow-xs text-center bg-amber-50/20">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                {language === 'bn' ? 'যাচাই অপেক্ষমাণ' : 'Pending Verification'}
              </span>
              <div className="mt-1 text-2xl font-black text-amber-600 font-sans">
                {formatNum(stats.pendingVerification)}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-rose-200/90 shadow-xs text-center bg-rose-50/20">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                {language === 'bn' ? 'ফি বকেয়া' : 'Fees Unpaid'}
              </span>
              <div className="mt-1 text-2xl font-black text-rose-600 font-sans">
                {formatNum(stats.feesUnpaid)}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-sky-200/90 shadow-xs text-center bg-sky-50/20">
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
                {language === 'bn' ? 'ক্লিয়ারেন্স বাকি' : 'Clearance Pending'}
              </span>
              <div className="mt-1 text-2xl font-black text-sky-700 font-sans">
                {formatNum(stats.clearancePending)}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-indigo-200/90 shadow-xs text-center bg-indigo-50/20">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                {language === 'bn' ? 'ক্লিয়ারেন্স অনুমোদিত' : 'Clearance Approved'}
              </span>
              <div className="mt-1 text-2xl font-black text-indigo-700 font-sans">
                {formatNum(stats.clearanceApproved)}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-purple-200/90 shadow-xs text-center bg-purple-50/20">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                {language === 'bn' ? 'অ্যাডমিট প্রস্তুত' : 'Admit Ready'}
              </span>
              <div className="mt-1 text-2xl font-black text-purple-700 font-sans">
                {formatNum(stats.admitCardsPublished)}
              </div>
            </div>
          </div>

          {/* Quick Explanation & Instructions banner */}
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-5 text-xs text-indigo-950 space-y-2">
            <h4 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-700" />
              {language === 'bn'
                ? 'অ্যাডমিট কার্ড অ্যাক্সেস ও ক্লিয়ারেন্স নীতিমালা (Admit Card Access Protocol)'
                : 'Admit Card Access Protocol'}
            </h4>
            <p className="leading-relaxed">
              {language === 'bn'
                ? 'একটি শিক্ষার্থী তার প্রবেশপত্র কেবল তখনই দেখতে ও প্রিন্ট করতে পারবে যখন: ১) পরীক্ষাটি সক্রিয় থাকবে, ২) শিক্ষার্থীর শ্রেণি বা ব্যাচে পরীক্ষাটি নির্ধারিত থাকবে, ৩) নির্ধারিত পরীক্ষার ফি সম্পূর্ণ পরিশোধিত থাকবে, ৪) অ্যাডমিন কর্তৃক পেমেন্ট যাচাই সম্পন্ন হবে, ৫) অ্যাডমিনিস্ট্রেটর ক্লিয়ারেন্স অনুমোদন করবেন এবং ৬) প্রবেশপত্র প্রকাশিত থাকবে।'
                : 'A student can view and download their admit card only when all 6 conditions are fulfilled: 1) Active exam, 2) Assigned class/batch, 3) Full fee paid, 4) Payment verified, 5) Administrator clearance explicitly approved, and 6) Admit cards published.'}
            </p>
          </div>
        </div>
      )}

      {/* 2. EXAMINATIONS & SCHEDULES TAB */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {examinationEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Calendar className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                বর্তমানে কোনো আনুষ্ঠানিক পরীক্ষা তৈরি করা হয়নি
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                মাসিক মূল্যায়ন, মডেল টেস্ট বা টার্মিনাল পরীক্ষা তৈরি করে শিক্ষার্থীদের শ্রেণি ও ব্যাচে নির্ধারণ করুন।
              </p>
              <button
                onClick={handleOpenCreateExam}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>প্রথম পরীক্ষা তৈরি করুন</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {examinationEvents.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                        {exam.examType.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          exam.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {exam.status === 'active' ? 'সক্রিয়' : exam.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {exam.title}
                    </h3>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>তারিখ: </span>
                        <strong className="text-slate-800 font-mono">
                          {formatNum(exam.examDate)}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>সময়: </span>
                        <strong className="text-slate-800 font-mono">
                          {formatNum(exam.examTime)}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span>পরীক্ষার ফি: </span>
                        <strong className="text-slate-900 font-sans">
                          {exam.examFee > 0 ? formatMoney(exam.examFee) : 'বিনামূল্যে (Free)'}
                        </strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>কক্ষ/কেন্দ্র: </span>
                        <span className="text-slate-800 font-medium">
                          {exam.centerRoom || 'Main Campus'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        <span className="text-[11px] text-slate-400 mr-1">নির্ধারিত শ্রেণি:</span>
                        {exam.classLevels.map((c) => (
                          <span
                            key={c}
                            className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                          >
                            {getClassShortText(c)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Exam Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleTogglePublishAdmit(exam)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        exam.isAdmitCardPublished
                          ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="শিক্ষার্থীদের পোর্টালে অ্যাডমিট কার্ড প্রদর্শন অন/অফ করুন"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{exam.isAdmitCardPublished ? 'প্রবেশপত্র প্রকাশিত' : 'অপ্রকাশিত'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditExam(exam)}
                        className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer transition"
                        title="সম্পাদনা করুন"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmExam(exam)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. FEE VERIFICATION & CLEARANCE MANAGEMENT TABLE */}
      {activeTab === 'clearance' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Search Query */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="শিক্ষার্থীর নাম, আইডি, রেফারেন্স..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Exam Filter */}
              <div>
                <select
                  value={filterExamId}
                  onChange={(e) => setFilterExamId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">সকল পরীক্ষা (All Exams)</option>
                  {examinationEvents.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">সকল শ্রেণি (All Classes)</option>
                  {SUPPORTED_CLASSES.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">সকল পেমেন্ট স্ট্যাটাস</option>
                  <option value="paid">পরিশোধিত (Paid)</option>
                  <option value="pending">যাচাই অপেক্ষমাণ (Pending)</option>
                  <option value="unpaid">অপরিশোধিত (Unpaid)</option>
                  <option value="rejected">বাতিল (Rejected)</option>
                </select>
              </div>

              {/* Clearance Status Filter */}
              <div>
                <select
                  value={filterClearanceStatus}
                  onChange={(e) => setFilterClearanceStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">সকল ক্লিয়ারেন্স স্ট্যাটাস</option>
                  <option value="approved">অনুমোদিত (Approved)</option>
                  <option value="pending">অপেক্ষমাণ (Pending)</option>
                  <option value="rejected">প্রত্যাখ্যাত (Rejected)</option>
                  <option value="revoked">স্থগিত/প্রত্যাহার (Revoked)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">শিক্ষার্থী বিবরণ</th>
                    <th className="py-3 px-3">পরীক্ষা ও শ্রেণি</th>
                    <th className="py-3 px-3">ধার্যকৃত ফি</th>
                    <th className="py-3 px-3">পরিশোধ</th>
                    <th className="py-3 px-3">পেমেন্ট স্ট্যাটাস</th>
                    <th className="py-3 px-3">ক্লিয়ারেন্স স্ট্যাটাস</th>
                    <th className="py-3 px-3 text-right">কার্যক্রম (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidatePairs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        কোনো পরীক্ষার্থী বা রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredCandidatePairs.map((pair) => {
                      const {
                        student,
                        exam,
                        batch,
                        feeRecord,
                        clearanceRecord,
                        evaluation,
                      } = pair;

                      const payStatus = feeRecord
                        ? feeRecord.status
                        : exam.examFee === 0
                        ? 'paid'
                        : 'unpaid';

                      const clrStatus = clearanceRecord
                        ? clearanceRecord.clearanceStatus
                        : 'pending';

                      return (
                        <tr
                          key={`${exam.id}_${student.studentId}`}
                          className="hover:bg-slate-50/60 transition"
                        >
                          {/* Student Info */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                              {student.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {student.studentId}
                            </span>
                          </td>

                          {/* Exam & Class */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 block text-xs">
                              {exam.title}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {getClassShortText(student.classLevel)} • {batch ? batch.name : 'সকল ব্যাচ'}
                            </span>
                          </td>

                          {/* Required Fee */}
                          <td className="py-3 px-3 font-sans font-bold text-slate-800">
                            {exam.examFee > 0 ? formatMoney(exam.examFee) : '৳০'}
                          </td>

                          {/* Paid Amount */}
                          <td className="py-3 px-3 font-sans font-bold text-slate-700">
                            {formatMoney(feeRecord?.paidAmount || (exam.examFee === 0 ? 0 : 0))}
                          </td>

                          {/* Payment Status */}
                          <td className="py-3 px-3">
                            <button
                              onClick={() =>
                                handleOpenPaymentVerification(student, exam, feeRecord)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                                payStatus === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : payStatus === 'pending'
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : payStatus === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="ফি যাচাই করতে ক্লিক করুন"
                            >
                              <span>
                                {payStatus === 'paid'
                                  ? 'পরিশোধিত (Paid)'
                                  : payStatus === 'pending'
                                  ? 'যাচাই বাকি (Pending)'
                                  : payStatus === 'rejected'
                                  ? 'বাতিল (Rejected)'
                                  : 'অপরিশোধিত (Unpaid)'}
                              </span>
                            </button>
                          </td>

                          {/* Clearance Status */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                clrStatus === 'approved'
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : clrStatus === 'revoked'
                                  ? 'bg-rose-50 text-rose-700'
                                  : clrStatus === 'rejected'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {clrStatus === 'approved' ? (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              ) : clrStatus === 'revoked' ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {clrStatus === 'approved'
                                  ? 'অনুমোদিত'
                                  : clrStatus === 'revoked'
                                  ? 'প্রত্যাহারকৃত'
                                  : clrStatus === 'rejected'
                                  ? 'প্রত্যাখ্যাত'
                                  : 'অপেক্ষমাণ'}
                              </span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Payment Verify Button */}
                              <button
                                onClick={() =>
                                  handleOpenPaymentVerification(student, exam, feeRecord)
                                }
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition"
                                title="পেমেন্ট রেকর্ড বা যাচাই করুন"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>

                              {/* Clearance Approval / Revoke Actions */}
                              {clrStatus !== 'approved' ? (
                                <button
                                  onClick={() => handleApproveClearance(student, exam)}
                                  className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition"
                                  title="ক্লিয়ারেন্স অনুমোদন করুন"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>অনুমোদন</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRevokeClearance(student, exam, 'revoked')}
                                  className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition"
                                  title="ক্লিয়ারেন্স স্থগিত বা প্রত্যাহার করুন"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>স্থগিত</span>
                                </button>
                              )}

                              {/* View Admit Card (Available for Admin Preview) */}
                              <button
                                onClick={() =>
                                  setPreviewAdmitCard({
                                    student,
                                    batch,
                                    exam,
                                    clearance: clearanceRecord || {
                                      id: `clr_${exam.id}_${student.studentId}`,
                                      examId: exam.id,
                                      studentId: student.studentId,
                                      studentName: student.name,
                                      classLevel: student.classLevel,
                                      clearanceStatus: clrStatus as any,
                                      admitCardRef: `AC-${student.studentId}-${exam.id.slice(-4)}`,
                                      createdAt: new Date().toISOString(),
                                      updatedAt: new Date().toISOString(),
                                    },
                                  })
                                }
                                className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer transition"
                                title="প্রবেশপত্র দেখুন ও প্রিন্ট করুন"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-700" />
              ক্লিয়ারেন্স ও পেমেন্ট অডিট হিস্টোরি (Audit Trail)
            </h3>
            <span className="text-xs text-slate-400">সর্বশেষ {formatNum(auditLogs.length)} টি রেকর্ড</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">তারিখ ও সময়</th>
                  <th className="py-2.5 px-3">অ্যাডমিন</th>
                  <th className="py-2.5 px-3">কার্যক্রম (Action)</th>
                  <th className="py-2.5 px-3">শিক্ষার্থী</th>
                  <th className="py-2.5 px-3">পরীক্ষা</th>
                  <th className="py-2.5 px-3">স্ট্যাটাস ও নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      কোনো অডিট লগ রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                        {formatNum(log.timestamp.replace('T', ' ').slice(0, 19))}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800">{log.adminUsername}</td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-indigo-700 uppercase text-[10px] bg-indigo-50 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-800">{log.studentName}</span>{' '}
                        <span className="text-[10px] text-slate-400">({log.studentId})</span>
                      </td>
                      <td className="py-2 px-3 text-slate-700">{log.examTitle}</td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900">{log.newStatus}</span>
                        {log.notes && (
                          <span className="text-slate-500 block text-[10px]">{log.notes}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EXAMINATION MODAL */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-700" />
                {editingExam ? 'পরীক্ষা সম্পাদনা করুন' : 'নতুন পরীক্ষা তৈরি করুন'}
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExamSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  পরীক্ষার শিরোনাম / নাম*
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Monthly Examination - May 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পরীক্ষার ধরণ*</label>
                  <select
                    value={formExamType}
                    onChange={(e) => setFormExamType(e.target.value as ExaminationType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="monthly">মাসিক পরীক্ষা (Monthly Exam)</option>
                    <option value="model_test">মডেল টেস্ট (Model Test)</option>
                    <option value="terminal">টার্মিনাল পরীক্ষা (Terminal)</option>
                    <option value="other">অন্যান্য (Other Assessment)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">পরীক্ষার ফি (টাকা)*</label>
                  <input
                    type="number"
                    min="0"
                    value={formFee}
                    onChange={(e) => setFormFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                    required
                  />
                  <span className="text-[10px] text-slate-400">০ লিখলে বিনামূল্যে হবে</span>
                </div>
              </div>

              {/* Class Selection Checkboxes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নির্ধারিত শ্রেণি নির্বাচন করুন*
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {SUPPORTED_CLASSES.map((cls) => {
                    const isSelected = formClassLevels.includes(cls.id);
                    return (
                      <button
                        type="button"
                        key={cls.id}
                        onClick={() => {
                          if (isSelected) {
                            setFormClassLevels(formClassLevels.filter((c) => c !== cls.id));
                          } else {
                            setFormClassLevels([...formClassLevels, cls.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-700 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cls.nameBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পরীক্ষার তারিখ*</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">সময়সূচী*</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="10:00 AM - 01:00 PM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">পরীক্ষার কক্ষ / কেন্দ্র</label>
                <input
                  type="text"
                  value={formCenter}
                  onChange={(e) => setFormCenter(e.target.value)}
                  placeholder="e.g. Room-101 & 102, Main Campus"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নির্দেশনাবলী (Admit Card এ প্রদর্শিত হবে)
                </label>
                <textarea
                  rows={2}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formIsAdmitPublished}
                    onChange={(e) => setFormIsAdmitPublished(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <span>প্রবেশপত্র সরাসরি শিক্ষার্থীদের পোর্টালে প্রকাশ করুন</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  {editingExam ? 'পরিবর্তন সংরক্ষণ করুন' : 'পরীক্ষা তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT VERIFICATION MODAL */}
      {paymentModalRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-700" />
                পরীক্ষার ফি যাচাই ও রেকর্ড
              </h3>
              <button
                onClick={() => setPaymentModalRecord(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1 mb-4">
              <div>
                <span className="text-slate-500">শিক্ষার্থীর নাম: </span>
                <strong className="text-slate-900">{paymentModalRecord.student.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">আইডি: </span>
                <strong className="text-blue-900 font-mono">
                  {paymentModalRecord.student.studentId}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">পরীক্ষা: </span>
                <strong className="text-slate-800">{paymentModalRecord.exam.title}</strong>
              </div>
              <div>
                <span className="text-slate-500">নির্ধারিত ফি: </span>
                <strong className="text-slate-900 font-sans">
                  {formatMoney(paymentModalRecord.exam.examFee)}
                </strong>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রাপ্ত ফি (টাকা)*</label>
                <input
                  type="number"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={payMethodInput}
                  onChange={(e) => setPayMethodInput(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="cash">নগদ (Cash)</option>
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                  <option value="rocket">রকেট (Rocket)</option>
                  <option value="bank">ব্যাংক (Bank)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ট্রানজ্যাকশন আইডি / মানি রিসিট নম্বর
                </label>
                <input
                  type="text"
                  value={payTrxRefInput}
                  onChange={(e) => setPayTrxRefInput(e.target.value)}
                  placeholder="e.g. 9J8B7XC12 or MR-401"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">মন্তব্য / নোট</label>
                <input
                  type="text"
                  value={payNotesInput}
                  onChange={(e) => setPayNotesInput(e.target.value)}
                  placeholder="যাচাইকরণ নোট..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleConfirmPayment('rejected')}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer text-xs"
                >
                  পেমেন্ট বাতিল (Reject)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalRecord(null)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmPayment('paid')}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer text-xs shadow-xs"
                  >
                    ফি যাচাই সম্পন্ন করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE EXAM MODAL */}
      {deleteConfirmExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-slate-200 shadow-2xl">
            <Trash2 className="w-12 h-12 text-rose-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">
              আপনি কি এই পরীক্ষাটি মুছে ফেলতে চান?
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              "{deleteConfirmExam.title}" মুছে ফেললে সংশ্লিষ্ট প্রবেশপত্র ও শিডিউল মুছে যাবে।
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteConfirmExam(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmDeleteExam}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIT CARD DOCUMENT PREVIEW MODAL */}
      {previewAdmitCard && (
        <AdmitCardDocument
          student={previewAdmitCard.student}
          batch={previewAdmitCard.batch}
          exam={previewAdmitCard.exam}
          clearance={previewAdmitCard.clearance}
          settings={settings}
          onClose={() => setPreviewAdmitCard(null)}
          isModal={true}
        />
      )}
    </div>
  );
};
