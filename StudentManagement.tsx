import React, { useState, useId } from 'react';
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  Edit,
  Trash2,
  Phone,
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  UserCheck,
  UserX,
  Sigma,
  Calculator,
  Download,
  X,
  Lock,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Student,
  Batch,
  ClassLevel,
  SubjectId,
  SUPPORTED_CLASSES,
  SUPPORTED_SUBJECTS,
  FeePayment,
  AttendanceSession,
  Exam,
} from '../types';
import {
  toBengaliNumber,
  formatTaka,
  getClassName,
  getSubjectShortName,
  generateNextStudentId,
  getClassShortName,
} from '../utils/helpers';
import { generateRandomPassword } from '../utils/crypto';

interface StudentManagementProps {
  students: Student[];
  batches: Batch[];
  fees: FeePayment[];
  attendance: AttendanceSession[];
  exams: Exam[];
  onSaveStudent: (
    student: Student,
    accountData?: { createAccount: boolean; username: string; initialPassword?: string }
  ) => Promise<{ success: boolean; plainPassword?: string; error?: string } | void> | void;
  onDeleteStudent: (studentId: string) => void;
  isAddModalOpenInitially?: boolean;
  onCloseAddModal?: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  batches,
  fees,
  attendance,
  exams,
  onSaveStudent,
  onDeleteStudent,
  isAddModalOpenInitially = false,
  onCloseAddModal,
}) => {
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(isAddModalOpenInitially);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formStudentPhone, setFormStudentPhone] = useState('');
  const [formClassLevel, setFormClassLevel] = useState<ClassLevel>('class_9');
  const [formEnrolledSubjects, setFormEnrolledSubjects] = useState<SubjectId[]>(['math']);
  const [formBatchId, setFormBatchId] = useState('');
  const [formAdmissionDate, setFormAdmissionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formMonthlyFee, setFormMonthlyFee] = useState<number>(1500);
  const [formPaymentStatus, setFormPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formNotes, setFormNotes] = useState('');

  // Account creation fields
  const [formCreateAccount, setFormCreateAccount] = useState<boolean>(true);
  const [formInitialPassword, setFormInitialPassword] = useState<string>('');
  const [formConfirmPassword, setFormConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // One-time Initial Credentials modal
  const [credentialsModal, setCredentialsModal] = useState<{
    studentName: string;
    studentId: string;
    username: string;
    initialPassword: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState<boolean>(false);

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const photoInputId = useId();

  // Open Form for Adding New Student
  const handleOpenAddModal = () => {
    const nextId = generateNextStudentId(students.map((s) => s.studentId));
    const randomPass = generateRandomPassword(8);
    setEditingStudent(null);
    setFormName('');
    setFormStudentId(nextId);
    setFormUsername(nextId.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
    setFormPhotoUrl('');
    setFormGuardianName('');
    setFormGuardianPhone('');
    setFormStudentPhone('');
    setFormClassLevel('class_9');
    setFormEnrolledSubjects(['math']);

    // Account creation defaults
    setFormCreateAccount(true);
    setFormInitialPassword(randomPass);
    setFormConfirmPassword(randomPass);
    setShowPassword(false);
    
    // Pick first matching batch
    const matchingBatches = batches.filter((b) => b.classLevel === 'class_9');
    setFormBatchId(matchingBatches.length > 0 ? matchingBatches[0].id : '');
    
    setFormAdmissionDate(new Date().toISOString().split('T')[0]);
    setFormMonthlyFee(1500);
    setFormPaymentStatus('paid');
    setFormStatus('active');
    setFormNotes('');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Generate random password on demand
  const handleGeneratePassword = () => {
    const pass = generateRandomPassword(8);
    setFormInitialPassword(pass);
    setFormConfirmPassword(pass);
    if (formErrors.password || formErrors.confirmPassword) {
      const errs = { ...formErrors };
      delete errs.password;
      delete errs.confirmPassword;
      setFormErrors(errs);
    }
  };

  // Open Form for Editing Existing Student
  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormStudentId(student.studentId);
    setFormUsername(student.username || student.studentId);
    setFormPhotoUrl(student.photoUrl || '');
    setFormGuardianName(student.guardianName);
    setFormGuardianPhone(student.guardianPhone);
    setFormStudentPhone(student.studentPhone || '');
    setFormClassLevel(student.classLevel);
    setFormEnrolledSubjects(student.enrolledSubjects);
    setFormBatchId(student.batchId);
    setFormAdmissionDate(student.admissionDate);
    setFormMonthlyFee(student.monthlyFee);
    setFormPaymentStatus(student.paymentStatus);
    setFormStatus(student.status);
    setFormNotes(student.notes || '');

    // Existing student editing doesn't require new initial password unless specified
    setFormCreateAccount(false);
    setFormInitialPassword('');
    setFormConfirmPassword('');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handle Class change in form - enforce Higher Math restrictions!
  const handleClassChange = (newClass: ClassLevel) => {
    setFormClassLevel(newClass);
    // If new class is Class 5, 6, 7, 8, Higher Math is NOT supported!
    const classDef = SUPPORTED_CLASSES.find((c) => c.id === newClass);
    if (!classDef?.supportsHigherMath) {
      setFormEnrolledSubjects(['math']);
    }

    // Adjust batch selection
    const matchingBatches = batches.filter((b) => b.classLevel === newClass);
    if (matchingBatches.length > 0) {
      setFormBatchId(matchingBatches[0].id);
    } else {
      setFormBatchId('');
    }
  };

  // Handle Subject toggle
  const toggleSubject = (subj: SubjectId) => {
    const classDef = SUPPORTED_CLASSES.find((c) => c.id === formClassLevel);
    if (subj === 'higher_math' && !classDef?.supportsHigherMath) {
      return; // Not allowed for class 5-8
    }

    if (formEnrolledSubjects.includes(subj)) {
      if (formEnrolledSubjects.length === 1) {
        // Must keep at least one subject
        return;
      }
      setFormEnrolledSubjects(formEnrolledSubjects.filter((s) => s !== subj));
    } else {
      setFormEnrolledSubjects([...formEnrolledSubjects, subj]);
    }
  };

  // Handle Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ছবির আকার সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে।');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate and submit form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formName.trim()) {
      errors.name = 'শিক্ষার্থীর নাম আবশ্যক';
    }
    if (!formStudentId.trim()) {
      errors.studentId = 'শিক্ষার্থী আইডি আবশ্যক';
    } else {
      // Check ID uniqueness if changed
      const duplicate = students.find(
        (s) => s.studentId === formStudentId.trim() && s.id !== editingStudent?.id
      );
      if (duplicate) {
        errors.studentId = 'এই আইডিটি ইতিমধ্যে অন্য শিক্ষার্থীর জন্য ব্যবহৃত হয়েছে';
      }
    }

    if (!formGuardianName.trim()) {
      errors.guardianName = 'অভিভাবকের নাম আবশ্যক';
    }
    if (!formGuardianPhone.trim()) {
      errors.guardianPhone = 'অভিভাবকের মোবাইল নম্বর আবশ্যক';
    }

    if (formEnrolledSubjects.length === 0) {
      errors.subjects = 'কমপক্ষে একটি বিষয় নির্বাচন করুন';
    }

    // Account creation validation
    if (!editingStudent && formCreateAccount) {
      const cleanUser = formUsername.trim();
      if (!cleanUser) {
        errors.username = 'ইউজারনেম প্রদান করুন';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
        errors.username = 'ইউজারনেমে শুধুমাত্র ইংরেজি অক্ষর, সংখ্যা, আন্ডারস্কোর (_) বা ড্যাশ (-) ব্যবহার করুন';
      } else {
        const dupUser = students.find(
          (s) =>
            (s.username && s.username.toLowerCase() === cleanUser.toLowerCase()) ||
            s.studentId.toLowerCase() === cleanUser.toLowerCase()
        );
        if (dupUser) {
          errors.username = 'এই ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হয়েছে';
        }
      }

      if (!formInitialPassword) {
        errors.password = 'প্রাথমিক পাসওয়ার্ড প্রদান করুন';
      } else if (formInitialPassword.length < 6) {
        errors.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
      }

      if (!formConfirmPassword) {
        errors.confirmPassword = 'পাসওয়ার্ড নিশ্চিতকরণ আবশ্যক';
      } else if (formInitialPassword !== formConfirmPassword) {
        errors.confirmPassword = 'উভয় পাসওয়ার্ড হুবহু এক হতে হবে';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrUpdatedStudent: Student = {
        id: editingStudent
          ? editingStudent.id
          : `stu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        studentId: formStudentId.trim(),
        username: (formUsername.trim() || formStudentId.trim()).toLowerCase(),
        name: formName.trim(),
        photoUrl: formPhotoUrl || undefined,
        guardianName: formGuardianName.trim(),
        guardianPhone: formGuardianPhone.trim(),
        studentPhone: formStudentPhone.trim() || undefined,
        classLevel: formClassLevel,
        enrolledSubjects: formEnrolledSubjects,
        batchId: formBatchId,
        admissionDate: formAdmissionDate,
        monthlyFee: Number(formMonthlyFee) || 0,
        paymentStatus: formPaymentStatus,
        status: formStatus,
        notes: formNotes.trim() || undefined,
        hasAuthAccount: !editingStudent ? formCreateAccount : editingStudent.hasAuthAccount,
        createdAt: editingStudent ? editingStudent.createdAt : new Date().toISOString(),
      };

      const accountData =
        !editingStudent && formCreateAccount
          ? {
              createAccount: true,
              username: (formUsername.trim() || formStudentId.trim()).toLowerCase(),
              initialPassword: formInitialPassword,
            }
          : undefined;

      await onSaveStudent(newOrUpdatedStudent, accountData);

      setIsFormModalOpen(false);
      if (onCloseAddModal) onCloseAddModal();

      if (!editingStudent && formCreateAccount && formInitialPassword) {
        setCredentialsModal({
          studentName: newOrUpdatedStudent.name,
          studentId: newOrUpdatedStudent.studentId,
          username: newOrUpdatedStudent.username || newOrUpdatedStudent.studentId,
          initialPassword: formInitialPassword,
        });
      }
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'শিক্ষার্থী সংরক্ষণে সমস্যা হয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    // Search query
    const matchesSearch =
      searchQuery === '' ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.guardianPhone.includes(searchQuery) ||
      (student.studentPhone && student.studentPhone.includes(searchQuery));

    // Class filter
    const matchesClass = filterClass === 'all' || student.classLevel === filterClass;

    // Subject filter
    const matchesSubject =
      filterSubject === 'all' || student.enrolledSubjects.includes(filterSubject as SubjectId);

    // Batch filter
    const matchesBatch = filterBatch === 'all' || student.batchId === filterBatch;

    // Status filter
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;

    return matchesSearch && matchesClass && matchesSubject && matchesBatch && matchesStatus;
  });

  const selectedClassDef = SUPPORTED_CLASSES.find((c) => c.id === formClassLevel);

  return (
    <div className="space-y-6">
      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-700" />
            শিক্ষার্থী ব্যবস্থাপনা (Student Directory)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            পঞ্চম শ্রেণি থেকে এসএসসি পরীক্ষার্থীদের (Class 5 - SSC) তালিকা ও প্রোফাইল
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          নতুন শিক্ষার্থী যোগ করুন
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম, আইডি বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Class Filter (Only Class 5 - 10) */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">সকল শ্রেণি (Class 5 - 10)</option>
            {SUPPORTED_CLASSES.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.nameBn} ({cls.nameEn})
              </option>
            ))}
          </select>

          {/* Subject Filter (Only Math & Higher Math) */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">সকল বিষয়</option>
            <option value="math">গণিত (Mathematics)</option>
            <option value="higher_math">উচ্চতর গণিত (Higher Math)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="active">সক্রিয় (Active)</option>
            <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
          </select>
        </div>

        {/* Active Filters count summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            প্রদর্শিত হচ্ছে: <strong className="text-slate-800">{toBengaliNumber(filteredStudents.length)}</strong> জন (সর্বমোট: {toBengaliNumber(students.length)} জন)
          </span>
          {(searchQuery || filterClass !== 'all' || filterSubject !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterClass('all');
                setFilterSubject('all');
                setFilterStatus('all');
              }}
              className="text-blue-700 hover:underline font-semibold cursor-pointer"
            >
              ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      </div>

      {/* Main Student Records Display */}
      {students.length === 0 ? (
        /* Empty State (Explicit requirement 2) */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800">
            এখনো কোনো শিক্ষার্থী যোগ করা হয়নি
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            সকল ডেমো বা স্যাম্পল ডাটা সফলভাবে মুছে দেওয়া হয়েছে। আপনি এখন আপনার কোচিং-এর বাস্তব শিক্ষার্থীদের ম্যানুয়ালি যোগ করতে পারেন।
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            নতুন শিক্ষার্থী যোগ করুন
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <p className="text-sm text-slate-600 font-semibold">
            আপনার ফিল্টার বা অনুসন্ধানের সাথে কোনো শিক্ষার্থী মেলেনি।
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterClass('all');
              setFilterSubject('all');
              setFilterStatus('all');
            }}
            className="mt-3 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 cursor-pointer"
          >
            সকল শিক্ষার্থী দেখুন
          </button>
        </div>
      ) : (
        /* Student Cards / Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">আইডি ও নাম</th>
                  <th className="py-3.5 px-4">শ্রেণি ও বিষয়</th>
                  <th className="py-3.5 px-4">ব্যাচ</th>
                  <th className="py-3.5 px-4">অভিভাবক ও যোগাযোগ</th>
                  <th className="py-3.5 px-4">মাসিক বেতন</th>
                  <th className="py-3.5 px-4">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const assignedBatch = batches.find((b) => b.id === student.batchId);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* Name & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200">
                              {student.name.slice(0, 1)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-blue-700 transition">
                              {student.name}
                            </span>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {student.studentId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Class & Subject */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-slate-800 block">
                            {getClassShortName(student.classLevel)}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {student.enrolledSubjects.map((sub) => (
                              <span
                                key={sub}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  sub === 'higher_math'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {getSubjectShortName(sub)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Batch */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-700 font-medium">
                          {assignedBatch ? assignedBatch.name : 'ব্যাচ নির্ধারিত নেই'}
                        </span>
                      </td>

                      {/* Guardian & Contact */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="text-xs text-slate-700 font-medium block">
                            {student.guardianName}
                          </span>
                          <a
                            href={`tel:${student.guardianPhone}`}
                            className="inline-flex items-center gap-1 text-xs text-blue-700 font-medium hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {student.guardianPhone}
                          </a>
                        </div>
                      </td>

                      {/* Monthly Fee */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 font-sans">
                          {formatTaka(student.monthlyFee)}
                        </span>
                        <span
                          className={`block text-[10px] font-semibold ${
                            student.paymentStatus === 'paid'
                              ? 'text-emerald-600'
                              : student.paymentStatus === 'partial'
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {student.paymentStatus === 'paid'
                            ? 'পরিশোধিত'
                            : student.paymentStatus === 'partial'
                            ? 'আংশিক পরিশোধ'
                            : 'বকেয়া'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            student.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {student.status === 'active' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              সক্রিয়
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              নিষ্ক্রিয়
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="বিস্তারিত দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-700" />
                {editingStudent ? 'শিক্ষার্থীর তথ্য সম্পাদনা' : 'নতুন শিক্ষার্থী নিবন্ধন'}
              </h3>
              <button
                onClick={() => {
                  setIsFormModalOpen(false);
                  if (onCloseAddModal) onCloseAddModal();
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
              {/* Photo & ID Row */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="relative group shrink-0">
                  {formPhotoUrl ? (
                    <img
                      src={formPhotoUrl}
                      alt="Student"
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl border border-blue-200">
                      <Users className="w-8 h-8" />
                    </div>
                  )}
                  <label
                    htmlFor={photoInputId}
                    className="absolute -bottom-1 -right-1 bg-blue-700 text-white p-1 rounded-full shadow-xs cursor-pointer hover:bg-blue-800"
                    title="ছবি আপলোড করুন"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </label>
                  <input
                    id={photoInputId}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      শিক্ষার্থী আইডি (Student ID)*
                    </label>
                    <input
                      type="text"
                      value={formStudentId}
                      onChange={(e) => {
                        setFormStudentId(e.target.value);
                        if (!editingStudent) {
                          setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                        }
                      }}
                      className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border bg-white ${
                        formErrors.studentId ? 'border-rose-500' : 'border-slate-300'
                      }`}
                      placeholder="TC-26-001"
                    />
                    {formErrors.studentId && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.studentId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ইউজারনেম (Username)*
                    </label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) =>
                        setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                      }
                      className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border bg-white ${
                        formErrors.username ? 'border-rose-500' : 'border-slate-300'
                      }`}
                      placeholder="tc_26_001"
                    />
                    {formErrors.username && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ভর্তির তারিখ
                    </label>
                    <input
                      type="date"
                      value={formAdmissionDate}
                      onChange={(e) => setFormAdmissionDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Name & Class Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শিক্ষার্থীর পুরো নাম (বাংলা বা ইংরেজি)*
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="উদাঃ সাদিউজ্জামান তানভীর"
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      formErrors.name ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শ্রেণি (Class 5 - Class 10 / SSC)*
                  </label>
                  <select
                    value={formClassLevel}
                    onChange={(e) => handleClassChange(e.target.value as ClassLevel)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    {SUPPORTED_CLASSES.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.nameBn} ({cls.nameEn})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Enrolled Subjects Selection (Math & Higher Math only!) */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-blue-700" />
                  ভর্তিযোগ্য বিষয় নির্বাচন করুন (Mathematics Only)*
                </label>
                <div className="flex flex-wrap gap-3">
                  {/* Mathematics (available for all classes 5-10) */}
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-300 transition">
                    <input
                      type="checkbox"
                      checked={formEnrolledSubjects.includes('math')}
                      onChange={() => toggleSubject('math')}
                      className="rounded text-blue-600"
                    />
                    <span>গণিত (Mathematics)</span>
                  </label>

                  {/* Higher Mathematics (Class 9 & 10 only) */}
                  {selectedClassDef?.supportsHigherMath ? (
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-purple-300 transition">
                      <input
                        type="checkbox"
                        checked={formEnrolledSubjects.includes('higher_math')}
                        onChange={() => toggleSubject('higher_math')}
                        className="rounded text-purple-600"
                      />
                      <span className="text-purple-900 font-bold">
                        উচ্চতর গণিত (Higher Mathematics)
                      </span>
                    </label>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic py-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      উচ্চতর গণিত শুধুমাত্র ৯ম ও ১০ম শ্রেণির জন্য প্রযোজ্য
                    </div>
                  )}
                </div>
                {formErrors.subjects && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.subjects}</p>
                )}
              </div>

              {/* Batch Assignment & Monthly Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    নির্ধারিত ব্যাচ
                  </label>
                  <select
                    value={formBatchId}
                    onChange={(e) => setFormBatchId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- ব্যাচ নির্বাচন করুন --</option>
                    {batches
                      .filter((b) => b.classLevel === formClassLevel)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.scheduleDays} • {b.time})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মাসিক বেতন (টাকা ৳)*
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMonthlyFee}
                    onChange={(e) => setFormMonthlyFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-bold font-sans"
                    placeholder="1500"
                  />
                </div>
              </div>

              {/* Guardian Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    অভিভাবকের নাম*
                  </label>
                  <input
                    type="text"
                    value={formGuardianName}
                    onChange={(e) => setFormGuardianName(e.target.value)}
                    placeholder="উদাঃ মোঃ রফিকুল ইসলাম"
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      formErrors.guardianName ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.guardianName && (
                    <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.guardianName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    অভিভাবকের মোবাইল নম্বর*
                  </label>
                  <input
                    type="tel"
                    value={formGuardianPhone}
                    onChange={(e) => setFormGuardianPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      formErrors.guardianPhone ? 'border-rose-500' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.guardianPhone && (
                    <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.guardianPhone}</p>
                  )}
                </div>
              </div>

              {/* Student Phone (optional) & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শিক্ষার্থীর মোবাইল (ঐচ্ছিক)
                  </label>
                  <input
                    type="tel"
                    value={formStudentPhone}
                    onChange={(e) => setFormStudentPhone(e.target.value)}
                    placeholder="018XXXXXXXX"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পেমেন্ট স্ট্যাটাস
                  </label>
                  <select
                    value={formPaymentStatus}
                    onChange={(e) =>
                      setFormPaymentStatus(e.target.value as 'paid' | 'partial' | 'unpaid')
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="paid">পরিশোধিত (Paid)</option>
                    <option value="partial">আংশিক (Partial)</option>
                    <option value="unpaid">বকেয়া (Unpaid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শিক্ষার্থী স্ট্যাটাস
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Student Portal Account & Security Section (Requirement 1 & 2) */}
              {!editingStudent && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formCreateAccount}
                        onChange={(e) => setFormCreateAccount(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-blue-700" />
                        স্টুডেন্ট অ্যাকাউন্ট তৈরি করুন (Create Student Account)
                      </span>
                    </label>

                    {formCreateAccount && (
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-blue-200 hover:border-blue-300 cursor-pointer transition active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        পাসওয়ার্ড জেনারেট করুন
                      </button>
                    )}
                  </div>

                  {formCreateAccount && (
                    <div className="space-y-3 pt-2 border-t border-slate-200/70">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            প্রাথমিক পাসওয়ার্ড (Initial Password)*
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={formInitialPassword}
                              onChange={(e) => setFormInitialPassword(e.target.value)}
                              placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                              className={`w-full pl-3 pr-10 py-1.5 text-xs font-mono font-bold rounded-lg border bg-white ${
                                formErrors.password ? 'border-rose-500' : 'border-slate-300'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showPassword ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {formErrors.password && (
                            <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.password}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            পাসওয়ার্ড নিশ্চিতকরণ (Confirm Password)*
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formConfirmPassword}
                            onChange={(e) => setFormConfirmPassword(e.target.value)}
                            placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                            className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border bg-white ${
                              formErrors.confirmPassword ? 'border-rose-500' : 'border-slate-300'
                            }`}
                          />
                          {formErrors.confirmPassword && (
                            <p className="text-[11px] text-rose-600 mt-0.5">
                              {formErrors.confirmPassword}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-white/80 p-2 rounded-lg border border-slate-200/60">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          শিক্ষার্থী প্রথমবার লগইন করার পর তাকে অবশ্যই নতুন পাসওয়ার্ড সেট করতে হবে।
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form submit error */}
              {formErrors.submit && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  {formErrors.submit}
                </div>
              )}

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিশেষ মন্তব্য বা নোট (ঐচ্ছিক)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="যেমন: কোনো নির্দিষ্ট অধ্যায়ে দুর্বলতা বা বিশেষ নির্দেশনা..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormModalOpen(false);
                    if (onCloseAddModal) onCloseAddModal();
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      সংরক্ষণ ও অ্যাকাউন্ট তৈরি হচ্ছে...
                    </>
                  ) : editingStudent ? (
                    'সংরক্ষণ করুন'
                  ) : (
                    'নিবন্ধন সম্পন্ন করুন'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-time Initial Credentials Modal (Requirement 3: Secure display once with copy button) */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 text-center animate-in fade-in zoom-in-95 duration-150 border border-emerald-100">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              শিক্ষার্থী অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <strong className="text-slate-800">{credentialsModal.studentName}</strong>-এর প্রাথমিক লগইন তথ্য নিচে দেওয়া হলো। এই তথ্যটি কপি করে শিক্ষার্থী বা অভিভাবককে প্রদান করুন।
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-sans text-slate-500 font-medium">শিক্ষার্থীর নাম:</span>
                <span className="font-sans font-bold text-slate-900">
                  {credentialsModal.studentName}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-sans text-slate-500 font-medium">শিক্ষার্থী আইডি:</span>
                <span className="font-bold text-blue-700">{credentialsModal.studentId}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-sans text-slate-500 font-medium">ইউজারনেম (Username):</span>
                <span className="font-bold text-purple-700">{credentialsModal.username}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-sans text-slate-500 font-medium">প্রাথমিক পাসওয়ার্ড:</span>
                <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  {credentialsModal.initialPassword}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>নিরাপত্তা সতর্কবার্তা:</strong> নিরাপত্তার স্বার্থে এই প্রাথমিক পাসওয়ার্ডটি পরবর্তীতে আর কখনোই ডেটাবেসে বা স্ক্রিনে প্রদর্শিত হবে না। শিক্ষার্থী প্রথমবার লগইন করার সাথে সাথে নতুন পাসওয়ার্ড সেট করতে হবে।
              </span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const info = `T@zul’s Care Student Portal Login Credentials:\nStudent Name: ${credentialsModal.studentName}\nStudent ID: ${credentialsModal.studentId}\nUsername: ${credentialsModal.username}\nInitial Password: ${credentialsModal.initialPassword}\nPortal Login Link: ${window.location.origin}\nNote: Change password upon first login.`;
                  navigator.clipboard.writeText(info);
                  setCopiedCredentials(true);
                  setTimeout(() => setCopiedCredentials(false), 2500);
                }}
                className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  copiedCredentials
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-700 hover:bg-blue-800 text-white shadow-md'
                }`}
              >
                {copiedCredentials ? (
                  <>
                    <Check className="w-4 h-4" />
                    লগইন তথ্য কপি করা হয়েছে!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    লগইন তথ্য কপি করুন
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCredentialsModal(null);
                  setCopiedCredentials(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog (Requirement 2: Ask for confirmation before permanently deleting) */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              শিক্ষার্থী মুছে ফেলার নিশ্চিতকরণ
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              আপনি কি নিশ্চিতভাবে <strong className="text-slate-900">"{deleteConfirmStudent.name}"</strong> (আইডি: {deleteConfirmStudent.studentId}) কে স্থায়ীভাবে মুছে ফেলতে চান?
            </p>
            <p className="text-xs text-rose-600 font-medium mt-1">
              সতর্কতা: মুছে ফেলার পর এই শিক্ষার্থীর সকল তথ্য আর পুনরুদ্ধার করা যাবে না।
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmStudent(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(deleteConfirmStudent.id);
                  setDeleteConfirmStudent(null);
                }}
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                হ্যাঁ, স্থায়ীভাবে মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Detail Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {viewingStudent.photoUrl ? (
                  <img
                    src={viewingStudent.photoUrl}
                    alt={viewingStudent.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center border border-blue-200">
                    {viewingStudent.name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {viewingStudent.name}
                  </h3>
                  <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">
                    {viewingStudent.studentId}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block">শ্রেণি</span>
                  <span className="text-sm font-bold text-slate-800">
                    {getClassName(viewingStudent.classLevel)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block">বিষয়সমূহ</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {viewingStudent.enrolledSubjects.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800"
                      >
                        {getSubjectShortName(s)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-400 block">মাসিক বেতন</span>
                  <span className="text-sm font-bold text-slate-800 font-sans">
                    {formatTaka(viewingStudent.monthlyFee)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  যোগাযোগ ও অভিভাবক
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">অভিভাবকের নাম:</span>
                    <strong className="block text-slate-800 text-sm">
                      {viewingStudent.guardianName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">অভিভাবকের মোবাইল:</span>
                    <a
                      href={`tel:${viewingStudent.guardianPhone}`}
                      className="block text-blue-700 font-bold text-sm hover:underline"
                    >
                      {viewingStudent.guardianPhone}
                    </a>
                  </div>
                  {viewingStudent.studentPhone && (
                    <div>
                      <span className="text-slate-500">শিক্ষার্থীর মোবাইল:</span>
                      <a
                        href={`tel:${viewingStudent.studentPhone}`}
                        className="block text-slate-800 font-bold hover:underline"
                      >
                        {viewingStudent.studentPhone}
                      </a>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">ভর্তির তারিখ:</span>
                    <strong className="block text-slate-800 font-mono">
                      {toBengaliNumber(viewingStudent.admissionDate)}
                    </strong>
                  </div>
                </div>
              </div>

              {viewingStudent.notes && (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-xs text-amber-900">
                  <strong className="block mb-0.5">বিশেষ মন্তব্য:</strong>
                  {viewingStudent.notes}
                </div>
              )}

              {/* Quick action buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/88${viewingStudent.guardianPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100"
                  >
                    WhatsApp এ মেসেজ পাঠান
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const studentToEdit = viewingStudent;
                      setViewingStudent(null);
                      handleOpenEditModal(studentToEdit);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    তথ্য সম্পাদনা
                  </button>
                  <button
                    onClick={() => setViewingStudent(null)}
                    className="px-4 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-bold cursor-pointer hover:bg-blue-800"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
