import React, { useState } from 'react';
import {
  Award,
  PlusCircle,
  Printer,
  Calendar,
  CheckCircle,
  TrendingUp,
  X,
  FileText,
  Save,
  Users,
  Search,
} from 'lucide-react';
import {
  Exam,
  ExamResultItem,
  Student,
  Batch,
  ClassLevel,
  SubjectId,
  InstitutionSettings,
  SUPPORTED_CLASSES,
} from '../types';
import {
  toBengaliNumber,
  calculateGrade,
  getClassName,
  getClassShortName,
  getSubjectShortName,
} from '../utils/helpers';

interface ExamManagementProps {
  exams: Exam[];
  students: Student[];
  batches: Batch[];
  settings: InstitutionSettings;
  onSaveExam: (exam: Exam) => void;
  onDeleteExam: (examId: string) => void;
}

export const ExamManagement: React.FC<ExamManagementProps> = ({
  exams,
  students,
  batches,
  settings,
  onSaveExam,
  onDeleteExam,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [enteringMarksExam, setEnteringMarksExam] = useState<Exam | null>(null);
  const [printingMarksheet, setPrintingMarksheet] = useState<Exam | null>(null);

  // Filter
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // Exam Form
  const [formTitle, setFormTitle] = useState('');
  const [formClassLevel, setFormClassLevel] = useState<ClassLevel>('class_10');
  const [formSubject, setFormSubject] = useState<SubjectId>('math');
  const [formBatchId, setFormBatchId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formTotalMarks, setFormTotalMarks] = useState<number>(50);
  const [formPassMarks, setFormPassMarks] = useState<number>(17);

  // Marks Entry state
  const [marksMap, setMarksMap] = useState<{ [studentId: string]: number }>({});
  const [commentMap, setCommentMap] = useState<{ [studentId: string]: string }>({});

  const handleOpenCreate = () => {
    setFormTitle('');
    setFormClassLevel('class_10');
    setFormSubject('math');
    setFormBatchId('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTotalMarks(50);
    setFormPassMarks(17);
    setIsCreateModalOpen(true);
  };

  const handleClassChange = (newClass: ClassLevel) => {
    setFormClassLevel(newClass);
    const classDef = SUPPORTED_CLASSES.find((c) => c.id === newClass);
    if (!classDef?.supportsHigherMath && formSubject === 'higher_math') {
      setFormSubject('math');
    }
  };

  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('পরীক্ষার নাম আবশ্যক');
      return;
    }

    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      title: formTitle.trim(),
      classLevel: formClassLevel,
      subject: formSubject,
      batchId: formBatchId || undefined,
      date: formDate,
      totalMarks: Number(formTotalMarks) || 50,
      passMarks: Number(formPassMarks) || 17,
      results: [],
      isPublished: true,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    onSaveExam(newExam);
    setIsCreateModalOpen(false);
    // Directly open marks entry for this exam
    handleOpenMarksEntry(newExam);
  };

  const handleOpenMarksEntry = (exam: Exam) => {
    setEnteringMarksExam(exam);
    const mMap: { [id: string]: number } = {};
    const cMap: { [id: string]: string } = {};

    exam.results.forEach((r) => {
      mMap[r.studentId] = r.obtainedMarks;
      if (r.comment) cMap[r.studentId] = r.comment;
    });

    setMarksMap(mMap);
    setCommentMap(cMap);
  };

  const handleSaveMarks = () => {
    if (!enteringMarksExam) return;

    // Filter students enrolled in this class and subject
    const eligibleStudents = students.filter(
      (s) =>
        s.status === 'active' &&
        s.classLevel === enteringMarksExam.classLevel &&
        s.enrolledSubjects.includes(enteringMarksExam.subject) &&
        (!enteringMarksExam.batchId || s.batchId === enteringMarksExam.batchId)
    );

    const results: ExamResultItem[] = eligibleStudents.map((stu) => {
      const marks = marksMap[stu.id] !== undefined ? Number(marksMap[stu.id]) : 0;
      const gradeRes = calculateGrade(marks, enteringMarksExam.totalMarks);
      return {
        studentId: stu.id,
        obtainedMarks: marks,
        grade: gradeRes.grade,
        gpa: gradeRes.gpa,
        comment: commentMap[stu.id] || undefined,
      };
    });

    const updatedExam: Exam = {
      ...enteringMarksExam,
      results,
    };

    onSaveExam(updatedExam);
    setEnteringMarksExam(null);
  };

  const filteredExams = exams.filter((e) => {
    const matchesClass = filterClass === 'all' || e.classLevel === filterClass;
    const matchesSubject = filterSubject === 'all' || e.subject === filterSubject;
    return matchesClass && matchesSubject;
  });

  const selectedClassDef = SUPPORTED_CLASSES.find((c) => c.id === formClassLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-700" />
            পরীক্ষা ও ফলাফল ব্যবস্থাপনা (Exams & Results)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            গণিত ও উচ্চতর গণিতের অধ্যায়ভিত্তিক পরীক্ষা, মার্কশিট ও ফলাফল পত্র
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          নতুন পরীক্ষা তৈরি করুন
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">সকল শ্রেণি (Class 5 - 10)</option>
            {SUPPORTED_CLASSES.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.nameBn}
              </option>
            ))}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">সকল বিষয়</option>
            <option value="math">সাধারণ গণিত</option>
            <option value="higher_math">উচ্চতর গণিত</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          মোট পরীক্ষা: {toBengaliNumber(filteredExams.length)} টি
        </span>
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-xs">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            কোনো পরীক্ষা এখনো তৈরি করা হয়নি
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            অধ্যায়ভিত্তিক বা মডেল টেস্ট পরীক্ষা তৈরি করে শিক্ষার্থীদের প্রাপ্ত নম্বর এন্ট্রি করুন।
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-purple-800"
          >
            <PlusCircle className="w-4 h-4" />
            নতুন পরীক্ষা তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => {
            const hasMarks = exam.results.length > 0;
            const highestMark = hasMarks
              ? Math.max(...exam.results.map((r) => r.obtainedMarks))
              : 0;
            const passCount = hasMarks
              ? exam.results.filter((r) => r.obtainedMarks >= exam.passMarks).length
              : 0;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        exam.subject === 'higher_math'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {getSubjectShortName(exam.subject)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onSaveExam({
                            ...exam,
                            isPublished: !exam.isPublished,
                            publishedAt: !exam.isPublished ? new Date().toISOString() : undefined,
                          })
                        }
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition ${
                          exam.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        }`}
                        title="স্টুডেন্ট পোর্টালে ফলাফল প্রকাশ স্থিতি পরিবর্তন করুন"
                      >
                        {exam.isPublished ? '● প্রকাশিত' : '○ অপ্রকাশিত'}
                      </button>
                      <span className="text-xs font-mono text-slate-500">
                        {toBengaliNumber(exam.date)}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {exam.title}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium block">
                    {getClassName(exam.classLevel)}
                  </span>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">পূর্ণমান</span>
                      <strong className="text-slate-800 font-sans">
                        {toBengaliNumber(exam.totalMarks)} নম্বর
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">পাশ নম্বর</span>
                      <strong className="text-slate-800 font-sans">
                        {toBengaliNumber(exam.passMarks)} নম্বর
                      </strong>
                    </div>
                  </div>

                  {hasMarks && (
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>পরীক্ষার্থী: {toBengaliNumber(exam.results.length)} জন</span>
                      <span className="text-emerald-700 font-bold">
                        সর্বোচ্চ: {toBengaliNumber(highestMark)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenMarksEntry(exam)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg cursor-pointer transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {hasMarks ? 'নম্বর সম্পাদনা' : 'নম্বর এন্ট্রি করুন'}
                  </button>

                  <div className="flex items-center gap-1">
                    {hasMarks && (
                      <button
                        onClick={() => setPrintingMarksheet(exam)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer transition"
                        title="মার্কশিট প্রিন্ট"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`আপনি কি "${exam.title}" পরীক্ষাটি মুছে ফেলতে চান?`)) {
                          onDeleteExam(exam.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Exam Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-700" />
                নতুন পরীক্ষা তৈরি করুন
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExamSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পরীক্ষার নাম / শিরোনাম*
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="উদাঃ অধ্যায় ৪ ও ৫ মূল্যায়ন পরীক্ষা"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শ্রেণি (Class 5 - 10)*
                  </label>
                  <select
                    value={formClassLevel}
                    onChange={(e) => handleClassChange(e.target.value as ClassLevel)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    {SUPPORTED_CLASSES.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.nameBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বিষয় (Math Only)*
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value as SubjectId)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="math">সাধারণ গণিত</option>
                    {selectedClassDef?.supportsHigherMath && (
                      <option value="higher_math">উচ্চতর গণিত</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পরীক্ষার তারিখ
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পূর্ণমান
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalMarks}
                    onChange={(e) => setFormTotalMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাশ নম্বর
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formPassMarks}
                    onChange={(e) => setFormPassMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs cursor-pointer"
                >
                  পরবর্তী: নম্বর এন্ট্রি
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marks Entry Sheet Modal */}
      {enteringMarksExam && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {enteringMarksExam.title} - নম্বর এন্ট্রি শিট
                </h3>
                <span className="text-xs text-slate-500">
                  {getClassName(enteringMarksExam.classLevel)} • {getSubjectShortName(enteringMarksExam.subject)} • পূর্ণমান: {toBengaliNumber(enteringMarksExam.totalMarks)}
                </span>
              </div>
              <button
                onClick={() => setEnteringMarksExam(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto">
              {(() => {
                const eligibleStudents = students.filter(
                  (s) =>
                    s.status === 'active' &&
                    s.classLevel === enteringMarksExam.classLevel &&
                    s.enrolledSubjects.includes(enteringMarksExam.subject)
                );

                if (eligibleStudents.length === 0) {
                  return (
                    <p className="text-xs text-slate-500 text-center py-8">
                      এই শ্রেণি ও বিষয়ের জন্য কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি।
                    </p>
                  );
                }

                return (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">শিক্ষার্থী</th>
                        <th className="py-2.5 px-3">প্রাপ্ত নম্বর</th>
                        <th className="py-2.5 px-3">গ্রেড / জিপিএ</th>
                        <th className="py-2.5 px-3">মন্তব্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eligibleStudents.map((stu) => {
                        const currentMark = marksMap[stu.id] !== undefined ? marksMap[stu.id] : 0;
                        const gradeRes = calculateGrade(currentMark, enteringMarksExam.totalMarks);

                        return (
                          <tr key={stu.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block">{stu.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {stu.studentId}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                max={enteringMarksExam.totalMarks}
                                value={marksMap[stu.id] !== undefined ? marksMap[stu.id] : ''}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setMarksMap({ ...marksMap, [stu.id]: val });
                                }}
                                className="w-20 px-2 py-1 rounded border border-slate-300 font-bold font-sans text-center"
                                placeholder="0"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                  gradeRes.grade === 'F'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {gradeRes.grade} ({gradeRes.gpa.toFixed(2)})
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={commentMap[stu.id] || ''}
                                onChange={(e) =>
                                  setCommentMap({ ...commentMap, [stu.id]: e.target.value })
                                }
                                placeholder="উদাঃ চমৎকার"
                                className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setEnteringMarksExam(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveMarks}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                ফলাফল সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Mark Sheet */}
      {printingMarksheet && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 print-container animate-in fade-in zoom-in-95 duration-150">
            <div className="no-print flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase">
                অফিসিয়াল মার্কশিট প্রিভিউ
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-800 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট করুন
                </button>
                <button
                  onClick={() => setPrintingMarksheet(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Marksheet Paper */}
            <div className="border-2 border-slate-900 p-6 rounded-xl bg-white text-slate-900">
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                <h1 className="text-2xl font-black text-slate-900">
                  {settings.institutionName || 'T@zul’s Care'}
                </h1>
                <p className="text-xs font-bold text-slate-700">
                  {settings.tagline || 'গণিত ও উচ্চতর গণিত স্পেশাল কেয়ার'}
                </p>
                <div className="inline-block mt-2 bg-slate-900 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase">
                  অফিসিয়াল ফলাফল ও মার্কশিট (OFFICIAL MARKSHEET)
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pb-3 border-b border-dashed border-slate-300 mb-3">
                <div>
                  <strong>পরীক্ষা:</strong> {printingMarksheet.title}
                </div>
                <div>
                  <strong>শ্রেণি:</strong> {getClassName(printingMarksheet.classLevel)}
                </div>
                <div>
                  <strong>বিষয়:</strong> {getSubjectShortName(printingMarksheet.subject)}
                </div>
                <div>
                  <strong>পূর্ণমান:</strong> {toBengaliNumber(printingMarksheet.totalMarks)}
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">ক্রম</th>
                    <th className="p-2 border-r border-slate-300">শিক্ষার্থীর নাম ও আইডি</th>
                    <th className="p-2 border-r border-slate-300 text-center">প্রাপ্ত নম্বর</th>
                    <th className="p-2 border-r border-slate-300 text-center">গ্রেড</th>
                    <th className="p-2 border-r border-slate-300 text-center">জিপিএ</th>
                    <th className="p-2">মন্তব্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printingMarksheet.results
                    .slice()
                    .sort((a, b) => b.obtainedMarks - a.obtainedMarks)
                    .map((res, i) => {
                      const stu = students.find((s) => s.id === res.studentId);
                      return (
                        <tr key={res.studentId}>
                          <td className="p-2 border-r border-slate-300 font-mono">
                            {toBengaliNumber(i + 1)}
                          </td>
                          <td className="p-2 border-r border-slate-300">
                            <strong>{stu ? stu.name : '—'}</strong>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {stu ? stu.studentId : ''}
                            </span>
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold font-sans">
                            {toBengaliNumber(res.obtainedMarks)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-bold">
                            {res.grade}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-mono">
                            {res.gpa.toFixed(2)}
                          </td>
                          <td className="p-2 text-slate-600">{res.comment || '—'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              <div className="pt-10 flex items-center justify-between text-xs">
                <div className="text-center">
                  <div className="w-24 border-t border-slate-400"></div>
                  <span className="text-slate-500 text-[10px] block mt-1">তৈরি করেছেন</span>
                </div>
                <div className="text-center">
                  <div className="w-28 border-t border-slate-900 font-bold text-slate-900">
                    {settings.directorName}
                  </div>
                  <span className="text-slate-700 font-bold text-[10px] block mt-0.5">
                    প্রধান শিক্ষক / পরিচালক
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
