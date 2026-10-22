import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  X,
  CheckCircle,
  FileText,
  AlertTriangle,
  Sigma,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldCheck,
} from 'lucide-react';
import {
  Student,
  Batch,
  ExaminationEvent,
  AdmitCardClearanceRecord,
  InstitutionSettings,
} from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AdmitCardDocumentProps {
  student: Student;
  batch?: Batch | null;
  exam: ExaminationEvent;
  clearance: AdmitCardClearanceRecord;
  settings: InstitutionSettings;
  onClose?: () => void;
  isModal?: boolean;
}

export const AdmitCardDocument: React.FC<AdmitCardDocumentProps> = ({
  student,
  batch,
  exam,
  clearance,
  settings,
  onClose,
  isModal = true,
}) => {
  const {
    t,
    language,
    formatNum,
    getClassNameText,
    getClassShortText,
    getSubjectShortText,
  } = useLanguage();

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    // Generate high-resolution, secure QR verification code
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const verifyPayload = JSON.stringify({
      ref: clearance.admitCardRef,
      studentId: student.studentId,
      examId: exam.id,
      institution: settings.institutionName || 'T@zul’s Care',
      issuedTo: student.name,
      status: 'VERIFIED_AUTHORIZED',
    });

    QRCode.toDataURL(verifyPayload, {
      width: 140,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR code generation note:', err));
  }, [clearance.admitCardRef, student.studentId, student.name, exam.id, settings.institutionName]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Admit_Card_${student.studentId}_${exam.title.replace(/\s+/g, '_')}`;
    window.focus();
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const examTypeLabels: Record<string, { bn: string; en: string }> = {
    monthly: { bn: 'মাসিক মূল্যায়ন পরীক্ষা', en: 'Monthly Examination' },
    model_test: { bn: 'মডেল টেস্ট পরীক্ষা', en: 'Model Test Examination' },
    terminal: { bn: 'টার্মিনাল / সেমিস্টার পরীক্ষা', en: 'Terminal Examination' },
    other: { bn: 'বিশেষ মূল্যায়ন পরীক্ষা', en: 'Special Assessment' },
  };

  const examTypeText =
    examTypeLabels[exam.examType]
      ? language === 'bn'
        ? examTypeLabels[exam.examType].bn
        : examTypeLabels[exam.examType].en
      : exam.examType;

  const cardContent = (
    <div
      id="printable-admit-card-doc"
      className="bg-white text-slate-900 border-2 border-slate-900 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto shadow-sm print:border-2 print:border-black print:rounded-none print:shadow-none print:p-6 print:m-0 print:w-full"
    >
      {/* Official Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center relative">
        {/* Top Reference & Watermark ID */}
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 mb-2 border-b border-dashed border-slate-200 pb-1">
          <span>
            {language === 'bn' ? 'অ্যাডমিট রেফারেন্স:' : 'Admit Card Ref:'}{' '}
            <strong className="text-slate-900">{clearance.admitCardRef}</strong>
          </span>
          <span className="flex items-center gap-1 text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            {language === 'bn' ? 'অনুমোদিত ও যাচাইকৃত' : 'Authorized & Verified'}
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 mb-1.5">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="w-12 h-12 object-contain rounded-xl border border-slate-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Sigma className="w-7 h-7 stroke-[2.5]" />
            </div>
          )}
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {settings.institutionName || 'T@zul’s Care'}
            </h1>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              {settings.tagline || 'গণিত ও উচ্চতর গণিত স্পেশাল কেয়ার (Class 5 - SSC)'}
            </p>
            <p className="text-[11px] text-slate-500">
              {settings.address} • {language === 'bn' ? 'মোবাইল: ' : 'Phone: '}
              {formatNum(settings.phone)}
            </p>
          </div>
        </div>

        {/* Big Bold Admit Card Banner */}
        <div className="inline-block mt-3 bg-slate-900 text-white font-extrabold text-sm sm:text-base px-6 py-1 rounded-full uppercase tracking-widest shadow-2xs">
          ADMIT CARD • প্রবেশপত্র
        </div>

        <div className="mt-2 text-xs font-bold text-blue-900">
          <span>{exam.title}</span>
          <span className="mx-2 text-slate-300">•</span>
          <span className="text-slate-600 font-semibold">{examTypeText}</span>
        </div>
      </div>

      {/* Student Details and Photo / QR Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5 items-start">
        {/* Left 3 Columns: Student Examination Information */}
        <div className="sm:col-span-3 border border-slate-300 rounded-xl p-4 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'শিক্ষার্থীর পুরো নাম:' : 'Student Name:'}
              </span>
              <strong className="text-sm font-bold text-slate-900">{student.name}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'শিক্ষার্থী আইডি (Student ID):' : 'Student ID:'}
              </span>
              <strong className="text-sm font-mono font-extrabold text-blue-900">
                {student.studentId}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'শ্রেণি (Class Level):' : 'Class Level:'}
              </span>
              <strong className="text-slate-800">{getClassNameText(student.classLevel)}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'ব্যাচ ও সময়সূচী:' : 'Assigned Batch:'}
              </span>
              <strong className="text-slate-800">
                {batch ? `${batch.name} (${batch.scheduleDays})` : 'সব ব্যাচ'}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'পরীক্ষার তারিখ (Date):' : 'Exam Date:'}
              </span>
              <strong className="text-slate-900 font-mono text-xs">
                {formatNum(exam.examDate)}
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'পরীক্ষার সময়সূচী (Time):' : 'Exam Time:'}
              </span>
              <strong className="text-slate-900 font-mono text-xs">
                {formatNum(exam.examTime)}
              </strong>
            </div>

            <div className="sm:col-span-2 border-t border-slate-200 pt-2">
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'পরীক্ষা কেন্দ্র ও কক্ষ:' : 'Exam Center / Room:'}
              </span>
              <strong className="text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {exam.centerRoom || 'T@zul’s Care Coaching Center'}
              </strong>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-500 block text-[11px]">
                {language === 'bn' ? 'ভর্তিকৃত বিষয়সমূহ:' : 'Enrolled Subjects:'}
              </span>
              <span className="text-slate-700 font-semibold">
                {student.enrolledSubjects.map((s) => getSubjectShortText(s)).join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Student Photo & QR Code */}
        <div className="sm:col-span-1 flex flex-col items-center justify-between gap-3 text-center">
          {/* Photo Box */}
          <div className="w-24 h-28 border-2 border-slate-400 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shadow-2xs">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-slate-400">
                <User className="w-8 h-8" />
                <span className="text-[9px] mt-1 font-bold text-slate-500">ছবি (Photo)</span>
              </div>
            )}
          </div>

          {/* Verification QR Code */}
          {qrCodeDataUrl ? (
            <div className="flex flex-col items-center">
              <img
                src={qrCodeDataUrl}
                alt="Verification QR"
                className="w-20 h-20 border border-slate-200 p-0.5 rounded bg-white"
              />
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 font-bold">
                {clearance.admitCardRef}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Examination Instructions Section */}
      <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/70 mb-6 text-xs text-slate-700">
        <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          {language === 'bn'
            ? 'পরীক্ষার্থীদের জন্য সাধারণ নির্দেশাবলী:'
            : 'General Instructions for Examinees:'}
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-600">
          <li>
            {language === 'bn'
              ? 'পরীক্ষার হলে প্রবেশের সময় এই প্রবেশপত্র (Admit Card) সাথে প্রদর্শন বাধ্যতামূলক।'
              : 'This admit card must be brought and presented upon entering the examination hall.'}
          </li>
          <li>
            {language === 'bn'
              ? 'পরীক্ষা শুরুর কমপক্ষে ১৫ মিনিট পূর্বে নির্ধারিত আসন গ্রহণ করতে হবে।'
              : 'Examinees must report to the examination center at least 15 minutes before exam starts.'}
          </li>
          <li>
            {language === 'bn'
              ? 'গণিত ও উচ্চতর গণিত পরীক্ষার ক্ষেত্রে শুধুমাত্র অনুমোদিত সাইন্টিফিক ক্যালকুলেটর ব্যবহার করা যাবে।'
              : 'Approved scientific calculators are permitted for Mathematics and Higher Mathematics only.'}
          </li>
          <li>
            {language === 'bn'
              ? 'পরীক্ষার হলে যেকোনো ধরণের মোবাইল ফোন, স্মার্টওয়াচ ও অননুমোদিত কাগজ রাখা কঠোরভাবে নিষিদ্ধ।'
              : 'Mobile phones, smart devices, and unauthorized papers are strictly prohibited.'}
          </li>
          {exam.instructions && (
            <li className="font-semibold text-slate-800">
              <strong>{language === 'bn' ? 'বিশেষ নির্দেশনা:' : 'Special Directive:'}</strong>{' '}
              {exam.instructions}
            </li>
          )}
        </ol>
      </div>

      {/* Signature and Verification Footer */}
      <div className="pt-8 flex items-end justify-between text-xs">
        <div className="text-center">
          <div className="w-32 border-t border-slate-400 mx-auto"></div>
          <span className="text-slate-600 text-[11px] font-medium block mt-1">
            {language === 'bn' ? 'পরীক্ষার্থীর পূর্ণ স্বাক্ষর' : 'Candidate’s Signature'}
          </span>
        </div>

        <div className="text-center font-mono text-[10px] text-slate-400">
          <span>{language === 'bn' ? 'ইস্যুর তারিখ:' : 'Issue Date:'} </span>
          <strong>
            {formatNum(
              clearance.approvedAt
                ? clearance.approvedAt.split('T')[0]
                : new Date().toISOString().split('T')[0]
            )}
          </strong>
        </div>

        <div className="text-center">
          <div className="w-36 border-t-2 border-slate-900 mx-auto font-bold text-slate-900 text-sm">
            {settings.directorName || 'তাজুল স্যার'}
          </div>
          <span className="text-slate-800 font-bold text-[11px] block mt-0.5">
            {language === 'bn' ? 'পরিচালক, ' : 'Director, '}
            {settings.institutionName || 'T@zul’s Care'}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {language === 'bn' ? 'কর্তৃপক্ষের সিল ও স্বাক্ষর' : 'Authorized Seal & Signature'}
          </span>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'bn' ? 'অফিসিয়াল প্রবেশপত্র' : 'Official Admit Card'}
              </h3>
              <span className="text-xs text-slate-500 font-mono">{clearance.admitCardRef}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition shadow-2xs"
              title="ব্রাউজার প্রিন্ট ডায়ালগ ওপেন করুন"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>{t('admitCards.printBtn', 'অ্যাডমিট কার্ড প্রিন্ট করুন')}</span>
            </button>

            {/* PDF Download Button (Directly triggers high-fidelity print to PDF dialog) */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-blue-500/20 active:scale-95"
              title="A4 সাইজে PDF হিসেবে ডাউনলোড করুন"
            >
              <Download className="w-4 h-4" />
              <span>{t('admitCards.downloadPdf', 'PDF ডাউনলোড করুন')}</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Printable Container */}
        <div className="overflow-y-auto flex-1 pr-1 pb-2">
          {cardContent}
        </div>
      </div>
    </div>
  );
};
