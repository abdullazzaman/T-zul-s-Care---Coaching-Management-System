import React, { useState } from 'react';
import {
  CalendarCheck,
  Calendar,
  Check,
  X as XIcon,
  Clock,
  Save,
  History,
  Filter,
  CheckCheck,
  Users,
  Search,
  Printer,
  AlertCircle,
} from 'lucide-react';
import {
  AttendanceSession,
  AttendanceItem,
  Batch,
  Student,
  ClassLevel,
  SubjectId,
  SUPPORTED_CLASSES,
  SUPPORTED_SUBJECTS,
} from '../types';
import {
  toBengaliNumber,
  getClassName,
  getClassShortName,
  getSubjectShortName,
} from '../utils/helpers';

interface AttendanceManagementProps {
  students: Student[];
  batches: Batch[];
  attendance: AttendanceSession[];
  onSaveAttendance: (session: AttendanceSession) => void;
}

export const AttendanceManagement: React.FC<AttendanceManagementProps> = ({
  students,
  batches,
  attendance,
  onSaveAttendance,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'take' | 'history'>('take');

  // Attendance Form parameters
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('class_9');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('math');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // Current session student statuses
  const [statusMap, setStatusMap] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' }>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // History filters
  const [historyFilterDate, setHistoryFilterDate] = useState<string>('');
  const [historyFilterBatch, setHistoryFilterBatch] = useState<string>('all');

  // Filter batches matching class and subject
  const availableBatches = batches.filter(
    (b) =>
      b.status === 'active' &&
      b.classLevel === selectedClass &&
      b.subject === selectedSubject
  );

  // Auto-select batch when class or subject changes
  const activeBatch = batches.find((b) => b.id === selectedBatchId) || availableBatches[0];

  // Enrolled students in the selected batch
  const enrolledStudents = students.filter(
    (s) =>
      s.status === 'active' &&
      (selectedBatchId ? s.batchId === selectedBatchId : activeBatch ? s.batchId === activeBatch.id : false)
  );

  // Check if attendance already recorded today for this batch
  const targetBatchId = selectedBatchId || activeBatch?.id || '';
  const existingSession = attendance.find(
    (a) => a.date === selectedDate && a.batchId === targetBatchId
  );

  // Initialize or load existing records when batch or date changes
  const handleLoadSession = (batchId: string) => {
    setSelectedBatchId(batchId);
    const existing = attendance.find(
      (a) => a.date === selectedDate && a.batchId === batchId
    );
    if (existing) {
      const map: { [id: string]: 'present' | 'absent' | 'late' } = {};
      existing.records.forEach((r) => {
        map[r.studentId] = r.status;
      });
      setStatusMap(map);
    } else {
      // Default all enrolled students to 'present' for speed
      const map: { [id: string]: 'present' | 'absent' | 'late' } = {};
      const batchStudents = students.filter(
        (s) => s.status === 'active' && s.batchId === batchId
      );
      batchStudents.forEach((s) => {
        map[s.id] = 'present';
      });
      setStatusMap(map);
    }
  };

  // Toggle student status
  const setStudentStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Mark all as present
  const handleMarkAllPresent = () => {
    const map: { [id: string]: 'present' | 'absent' | 'late' } = {};
    enrolledStudents.forEach((s) => {
      map[s.id] = 'present';
    });
    setStatusMap(map);
  };

  // Save attendance session
  const handleSave = () => {
    if (!targetBatchId) {
      alert('অনুগ্রহ করে একটি ব্যাচ নির্বাচন করুন');
      return;
    }

    if (enrolledStudents.length === 0) {
      alert('এই ব্যাচে কোনো শিক্ষার্থী নেই');
      return;
    }

    const records: AttendanceItem[] = enrolledStudents.map((s) => ({
      studentId: s.id,
      status: statusMap[s.id] || 'present',
    }));

    const session: AttendanceSession = {
      id: existingSession ? existingSession.id : `att_${Date.now()}`,
      date: selectedDate,
      batchId: targetBatchId,
      classLevel: selectedClass,
      subject: selectedSubject,
      records,
      recordedAt: new Date().toISOString(),
    };

    onSaveAttendance(session);
    setSaveSuccessMessage('উপস্থিতি সফলভাবে সংরক্ষণ করা হয়েছে!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Calculation for current session
  const totalInSession = enrolledStudents.length;
  const presentCount = enrolledStudents.filter((s) => statusMap[s.id] === 'present').length;
  const absentCount = enrolledStudents.filter((s) => statusMap[s.id] === 'absent').length;
  const lateCount = enrolledStudents.filter((s) => statusMap[s.id] === 'late').length;
  const attendanceRate =
    totalInSession > 0 ? Math.round(((presentCount + lateCount) / totalInSession) * 100) : 0;

  // Filtered history sessions
  const filteredHistory = attendance.filter((session) => {
    const matchesDate = !historyFilterDate || session.date === historyFilterDate;
    const matchesBatch =
      historyFilterBatch === 'all' || session.batchId === historyFilterBatch;
    return matchesDate && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
            উপস্থিতি ও হাজিরা ব্যবস্থাপনা (Attendance)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            ব্যাচভিত্তিক শিক্ষার্থীদের দৈনিক হাজিরা গ্রহণ ও পূর্ববর্তী রেকর্ড সংরক্ষণ
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('take')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'take'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            হাজিরা গ্রহণ করুন
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            পূর্ববর্তী হাজিরা রেকর্ড
          </button>
        </div>
      </div>

      {activeSubTab === 'take' ? (
        <div className="space-y-5">
          {/* Controls Bar: Date, Class, Subject, Batch */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  হাজিরার তারিখ
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
                  />
                </div>
              </div>

              {/* Class */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শ্রেণি (Class 5 - 10)
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    const newClass = e.target.value as ClassLevel;
                    setSelectedClass(newClass);
                    const classDef = SUPPORTED_CLASSES.find((c) => c.id === newClass);
                    if (!classDef?.supportsHigherMath && selectedSubject === 'higher_math') {
                      setSelectedSubject('math');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {SUPPORTED_CLASSES.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameBn} ({cls.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিষয় (Mathematics Only)
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value as SubjectId)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="math">সাধারণ গণিত</option>
                  {SUPPORTED_CLASSES.find((c) => c.id === selectedClass)?.supportsHigherMath && (
                    <option value="higher_math">উচ্চতর গণিত</option>
                  )}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ব্যাচ নির্বাচন করুন
                </label>
                <select
                  value={targetBatchId}
                  onChange={(e) => handleLoadSession(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {availableBatches.length === 0 ? (
                    <option value="">কোনো ব্যাচ নেই</option>
                  ) : (
                    availableBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Attendance Status Banner */}
            {existingSession && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCheck className="w-4 h-4 text-blue-600" />
                  এই তারিখ ও ব্যাচের জন্য পূর্বে হাজিরা সেভ করা হয়েছিল। পরিবর্তন করতে চাইলে নতুন করে সেভ করুন।
                </span>
                <span className="text-[11px] font-mono text-blue-600">
                  রেকর্ড আইডি: {existingSession.id.slice(-6)}
                </span>
              </div>
            )}
          </div>

          {/* Quick Summary Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
              <span className="text-slate-600">
                মোট শিক্ষার্থী: <strong className="text-slate-900">{toBengaliNumber(totalInSession)}</strong> জন
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                উপস্থিত: {toBengaliNumber(presentCount)} জন
              </span>
              <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                অনুপস্থিত: {toBengaliNumber(absentCount)} জন
              </span>
              <span className="text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                দেরিতে এসেছে: {toBengaliNumber(lateCount)} জন
              </span>
              <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-sans">
                উপস্থিতির হার: {toBengaliNumber(attendanceRate)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                সবাই উপস্থিত
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer transition flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                হাজিরা সংরক্ষণ করুন
              </button>
            </div>
          </div>

          {saveSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              {saveSuccessMessage}
            </div>
          )}

          {/* Student Attendance List */}
          {enrolledStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center shadow-xs">
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">
                এই ব্যাচে কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                শিক্ষার্থী ব্যবস্থাপনা থেকে শিক্ষার্থীদের এই ব্যাচে অন্তর্ভুক্ত করুন।
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">রোল / ক্রম</th>
                    <th className="py-3 px-4">শিক্ষার্থীর তথ্য</th>
                    <th className="py-3 px-4">অভিভাবকের মোবাইল</th>
                    <th className="py-3 px-4 text-center">উপস্থিতি নির্বাচন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledStudents.map((student, idx) => {
                    const currentStatus = statusMap[student.id] || 'present';
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 text-xs font-mono font-bold text-slate-500">
                          #{toBengaliNumber(idx + 1)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {student.photoUrl ? (
                              <img
                                src={student.photoUrl}
                                alt={student.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                                {student.name.slice(0, 1)}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                                {student.name}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {student.studentId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-xs font-mono text-slate-600">
                          {student.guardianPhone}
                        </td>

                        {/* Status Toggle Buttons */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            {/* Present */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.id, 'present')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">উপস্থিত</span>
                            </button>

                            {/* Late */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.id, 'late')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                currentStatus === 'late'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">দেরিতে</span>
                            </button>

                            {/* Absent */}
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.id, 'absent')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                currentStatus === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                            >
                              <XIcon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">অনুপস্থিত</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <input
                  type="date"
                  value={historyFilterDate}
                  onChange={(e) => setHistoryFilterDate(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white"
                  placeholder="তারিখ অনুযায়ী ফিল্টার"
                />
              </div>

              <div>
                <select
                  value={historyFilterBatch}
                  onChange={(e) => setHistoryFilterBatch(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="all">সকল ব্যাচ</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {historyFilterDate && (
                <button
                  onClick={() => setHistoryFilterDate('')}
                  className="text-xs text-blue-700 hover:underline font-semibold cursor-pointer"
                >
                  তারিখ মুছুন
                </button>
              )}
            </div>

            <span className="text-xs text-slate-500 font-semibold">
              মোট রেকর্ড: {toBengaliNumber(filteredHistory.length)} টি সেশন
            </span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
              <History className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">
                কোনো সংরক্ষিত হাজিরার ইতিহাস পাওয়া যায়নি
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHistory.map((sess) => {
                const batch = batches.find((b) => b.id === sess.batchId);
                const pCount = sess.records.filter((r) => r.status === 'present').length;
                const aCount = sess.records.filter((r) => r.status === 'absent').length;
                const lCount = sess.records.filter((r) => r.status === 'late').length;
                const total = sess.records.length;
                const rate = total > 0 ? Math.round(((pCount + lCount) / total) * 100) : 0;

                return (
                  <div
                    key={sess.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {toBengaliNumber(sess.date)}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-sans">
                        {toBengaliNumber(rate)}% উপস্থিত
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {batch ? batch.name : 'ব্যাচ'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {getClassName(sess.classLevel)} • {getSubjectShortName(sess.subject)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>উপস্থিত: {toBengaliNumber(pCount)}</span>
                      <span>দেরিতে: {toBengaliNumber(lCount)}</span>
                      <span className="text-rose-600">অনুপস্থিত: {toBengaliNumber(aCount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
