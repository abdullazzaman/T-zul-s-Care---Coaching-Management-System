import React, { useState } from 'react';
import {
  Clock,
  Printer,
  Calendar,
  PlusCircle,
  Edit,
  Trash2,
  Filter,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Layers,
  MapPin,
  User,
  Info,
  RotateCcw,
} from 'lucide-react';
import {
  Batch,
  InstitutionSettings,
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

interface RoutineManagementProps {
  batches: Batch[];
  settings: InstitutionSettings;
  onSaveBatch?: (batch: Batch) => void;
  onDeleteBatch?: (batchId: string) => void;
  onClearDefaultBatches?: (batchIds?: string[]) => void;
}

const WEEK_DAYS = [
  { id: 'sat', nameBn: 'শনিবার', shortBn: 'শনি' },
  { id: 'sun', nameBn: 'রবিবার', shortBn: 'রবি' },
  { id: 'mon', nameBn: 'সোমবার', shortBn: 'সোম' },
  { id: 'tue', nameBn: 'মঙ্গলবার', shortBn: 'মঙ্গল' },
  { id: 'wed', nameBn: 'বুধবার', shortBn: 'বুধ' },
  { id: 'thu', nameBn: 'বৃহস্পতিবার', shortBn: 'বৃহঃ' },
  { id: 'fri', nameBn: 'শুক্রবার (বিশেষ ক্লাস/পরীক্ষা)', shortBn: 'শুক্র' },
];

export const RoutineManagement: React.FC<RoutineManagementProps> = ({
  batches,
  settings,
  onSaveBatch,
  onDeleteBatch,
  onClearDefaultBatches,
}) => {
  const [viewMode, setViewMode] = useState<'days' | 'table'>('days');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deleteConfirmBatch, setDeleteConfirmBatch] = useState<Batch | null>(null);
  const [isClearDefaultModalOpen, setIsClearDefaultModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formClassLevel, setFormClassLevel] = useState<ClassLevel>('class_10');
  const [formSubject, setFormSubject] = useState<SubjectId>('math');
  const [formTeacher, setFormTeacher] = useState(settings.directorName || 'তাজুল স্যার');
  const [formScheduleDays, setFormScheduleDays] = useState('শনি, সোম, বুধ');
  const [formTime, setFormTime] = useState('০৩:৩০ PM - ০৫:০০ PM');
  const [formRoom, setFormRoom] = useState('রুম-১০১');
  const [formStatus, setFormStatus] = useState<'active' | 'archived'>('active');
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Toast feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Open Add Schedule Modal
  const handleOpenAdd = () => {
    setEditingBatch(null);
    setFormName('');
    setFormClassLevel('class_10');
    setFormSubject('math');
    setFormTeacher(settings.directorName || 'তাজুল স্যার');
    setFormScheduleDays('শনি, সোম, বুধ');
    setFormTime('০৩:৩০ PM - ০৫:০০ PM');
    setFormRoom('রুম-১০১');
    setFormStatus('active');
    setFormNotes('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Schedule Modal
  const handleOpenEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormName(batch.name);
    setFormClassLevel(batch.classLevel);
    setFormSubject(batch.subject);
    setFormTeacher(batch.teacher);
    setFormScheduleDays(batch.scheduleDays);
    setFormTime(batch.time);
    setFormRoom(batch.room || '');
    setFormStatus(batch.status);
    setFormNotes(batch.notes || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle Class change to check higher math support
  const handleClassChange = (newClass: ClassLevel) => {
    setFormClassLevel(newClass);
    const classDef = SUPPORTED_CLASSES.find((c) => c.id === newClass);
    if (!classDef?.supportsHigherMath && formSubject === 'higher_math') {
      setFormSubject('math');
    }
  };

  // Submit Schedule form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formName.trim()) {
      errors.name = 'ক্লাস বা ব্যাচের নাম আবশ্যক';
    }
    if (!formTeacher.trim()) {
      errors.teacher = 'শিক্ষকের নাম আবশ্যক';
    }
    if (!formScheduleDays.trim()) {
      errors.scheduleDays = 'ক্লাসের দিনসমূহ আবশ্যক';
    }
    if (!formTime.trim()) {
      errors.time = 'ক্লাসের সময়সূচী আবশ্যক';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newOrUpdatedBatch: Batch = {
      id: editingBatch ? editingBatch.id : `batch_${Date.now()}`,
      name: formName.trim(),
      classLevel: formClassLevel,
      subject: formSubject,
      teacher: formTeacher.trim(),
      scheduleDays: formScheduleDays.trim(),
      time: formTime.trim(),
      room: formRoom.trim() || undefined,
      status: formStatus,
      notes: formNotes.trim() || undefined,
    };

    if (onSaveBatch) {
      onSaveBatch(newOrUpdatedBatch);
    }

    setIsModalOpen(false);
    showFeedback(
      editingBatch
        ? 'ক্লাস সময়সূচী সফলভাবে আপডেট করা হয়েছে!'
        : 'নতুন ক্লাস সময়সূচী সফলভাবে যুক্ত করা হয়েছে!'
    );
  };

  // Execute single schedule delete
  const handleConfirmDelete = () => {
    if (!deleteConfirmBatch) return;
    if (onDeleteBatch) {
      onDeleteBatch(deleteConfirmBatch.id);
    }
    const name = deleteConfirmBatch.name;
    setDeleteConfirmBatch(null);
    showFeedback(`"${name}" সময়সূচী সফলভাবে মুছে ফেলা হয়েছে।`);
  };

  // Execute clearing all default / demo schedules
  const handleConfirmClearDefaults = () => {
    if (onClearDefaultBatches) {
      onClearDefaultBatches();
    }
    setIsClearDefaultModalOpen(false);
    showFeedback('ডিফল্ট সময়সূচীসমূহ সফলভাবে মুছে ফেলা হয়েছে। এখন আপনি নিজস্ব রুটিন তৈরি করতে পারেন।');
  };

  // Filtered active & all batches
  const filteredBatches = batches.filter((b) => {
    const matchesClass = filterClass === 'all' || b.classLevel === filterClass;
    const matchesSubject = filterSubject === 'all' || b.subject === filterSubject;
    const matchesDay =
      filterDay === 'all' ||
      b.scheduleDays.toLowerCase().includes(filterDay.toLowerCase());

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      b.name.toLowerCase().includes(query) ||
      b.teacher.toLowerCase().includes(query) ||
      (b.room && b.room.toLowerCase().includes(query)) ||
      b.scheduleDays.toLowerCase().includes(query) ||
      b.time.toLowerCase().includes(query);

    return matchesClass && matchesSubject && matchesDay && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-sky-700" />
            ক্লাস রুটিন ও সময়সূচী ব্যবস্থাপনা
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            পঞ্চম শ্রেণি থেকে এসএসসি পর্যন্ত গণিত ও উচ্চতর গণিতের সাপ্তাহিক ক্লাস সময়সূচী নির্ধারণ, পরিবর্তন ও প্রিন্ট
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {batches.length > 0 && (
            <button
              onClick={() => setIsClearDefaultModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer"
              title="ডিফল্ট ডেমো শিডিউল মুছে ফেলে নতুন করে শুরু করুন"
            >
              <Trash2 className="w-4 h-4" />
              ডিফল্ট শিডিউল মুছুন
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            রুটিন প্রিন্ট
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            নতুন সময়সূচী যোগ করুন
          </button>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Query */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষক, ব্যাচ, রুম..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Filter Day */}
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">সকল দিন (Saturday - Friday)</option>
            {WEEK_DAYS.map((d) => (
              <option key={d.id} value={d.shortBn}>
                {d.nameBn}
              </option>
            ))}
          </select>

          {/* Filter Class */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">সকল শ্রেণি (Class 5 - 10)</option>
            {SUPPORTED_CLASSES.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.nameBn}
              </option>
            ))}
          </select>

          {/* Filter Subject */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">সকল বিষয়</option>
            <option value="math">গণিত (Mathematics)</option>
            <option value="higher_math">উচ্চতর গণিত (Higher Math)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-end gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('days')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'days'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সাপ্তাহিক ভিউ
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              তালিকা ভিউ
            </button>
          </div>
        </div>
      </div>

      {/* Routine Content Area (Print Friendly Container) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 print-container space-y-6">
        {/* Printable Institution Header */}
        <div className="text-center pb-4 border-b border-slate-200 space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            {settings.institutionName || 'T@zul’s Care'}
          </h3>
          <p className="text-xs font-bold text-slate-600">
            সাপ্তাহিক ক্লাস রুটিন ও সময়সূচী • {settings.academicYear || '২০২৬'} শিক্ষাবর্ষ
          </p>
          <p className="text-[11px] text-slate-500">
            {settings.address} • যোগাযোগ: {toBengaliNumber(settings.phone)}
          </p>
        </div>

        {batches.length === 0 ? (
          <div className="p-8 sm:p-12 text-center border border-dashed border-slate-300 rounded-2xl space-y-3">
            <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              বর্তমানে কোনো ক্লাস সময়সূচী নির্ধারিত নেই
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              আপনি আপনার সুবিধামতো নতুন ক্লাস শিডিউল যোগ করতে পারেন।
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              প্রথম সময়সূচী তৈরি করুন
            </button>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            ফিল্টারের সাথে কোনো ক্লাস সময়সূচী মেলেনি।
          </div>
        ) : viewMode === 'days' ? (
          /* Weekly Day-by-Day View */
          <div className="space-y-6">
            {WEEK_DAYS.map((day) => {
              // Match batches scheduled on this day
              const dayBatches = filteredBatches.filter((b) =>
                b.scheduleDays.toLowerCase().includes(day.shortBn.toLowerCase())
              );

              // If a day filter is applied, only show the matching day
              if (filterDay !== 'all' && !day.shortBn.toLowerCase().includes(filterDay.toLowerCase())) {
                return null;
              }

              return (
                <div key={day.id} className="space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-sky-600 pb-1.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sky-700" />
                      <h4 className="text-sm font-bold text-slate-900">{day.nameBn}</h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      মোট ক্লাস: {toBengaliNumber(dayBatches.length)} টি
                    </span>
                  </div>

                  {dayBatches.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      এই দিনে কোনো ক্লাস নির্ধারিত নেই
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dayBatches.map((b) => (
                        <div
                          key={b.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-300 transition shadow-2xs space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                b.subject === 'higher_math'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {getSubjectShortName(b.subject)}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {b.time}
                            </span>
                          </div>

                          <div>
                            <h5 className="text-sm font-bold text-slate-900 leading-snug">{b.name}</h5>
                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                              {getClassName(b.classLevel)} {b.room ? `• ${b.room}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200/80">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {b.teacher}
                            </span>

                            {/* Actions (Hidden on print) */}
                            <div className="no-print flex items-center gap-1 opacity-80 group-hover:opacity-100">
                              <button
                                onClick={() => handleOpenEdit(b)}
                                className="p-1 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded cursor-pointer"
                                title="সম্পাদনা করুন"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmBatch(b)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">ব্যাচ ও শ্রেণি</th>
                  <th className="py-3 px-3">বিষয়</th>
                  <th className="py-3 px-3">দিনসমূহ</th>
                  <th className="py-3 px-3">সময়সূচী</th>
                  <th className="py-3 px-3">রুম</th>
                  <th className="py-3 px-3">শিক্ষক</th>
                  <th className="py-3 px-3 text-right no-print">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{b.name}</span>
                      <span className="text-[11px] text-slate-500">{getClassShortName(b.classLevel)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.subject === 'higher_math'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {getSubjectShortName(b.subject)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{b.scheduleDays}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 text-xs">{b.time}</td>
                    <td className="py-3 px-3 text-slate-600">{b.room || '—'}</td>
                    <td className="py-3 px-3 text-slate-700">{b.teacher}</td>
                    <td className="py-3 px-3 text-right no-print">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmBatch(b)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-700" />
                {editingBatch ? 'ক্লাস সময়সূচী সম্পাদনা' : 'নতুন ক্লাস সময়সূচী নির্ধারণ'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {/* Batch / Schedule Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ক্লাস বা ব্যাচের নাম*
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="উদাঃ Class 10 গণিত (SSC Special)"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {formErrors.name && (
                  <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
                    {formErrors.name}
                  </span>
                )}
              </div>

              {/* Class & Subject */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শ্রেণি (Class Level)*
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
                    বিষয় (Subject)*
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value as SubjectId)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="math">গণিত (Math)</option>
                    {SUPPORTED_CLASSES.find((c) => c.id === formClassLevel)?.supportsHigherMath && (
                      <option value="higher_math">উচ্চতর গণিত (Higher Math)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Schedule Days & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্লাসের দিনসমূহ*
                  </label>
                  <input
                    type="text"
                    value={formScheduleDays}
                    onChange={(e) => setFormScheduleDays(e.target.value)}
                    placeholder="উদাঃ শনি, সোম, বুধ"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                  {formErrors.scheduleDays && (
                    <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
                      {formErrors.scheduleDays}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    সময়সূচী (Time)*
                  </label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="উদাঃ ০৩:৩০ PM - ০৫:০০ PM"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-mono"
                  />
                  {formErrors.time && (
                    <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
                      {formErrors.time}
                    </span>
                  )}
                </div>
              </div>

              {/* Teacher & Room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শিক্ষক*
                  </label>
                  <input
                    type="text"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কক্ষ নং (Room)
                  </label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="উদাঃ রুম-১০১"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিশেষ নির্দেশনা বা নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="উদাঃ প্রতি শুক্রবার বিশেষ মডেল টেস্ট"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs cursor-pointer transition active:scale-95"
                >
                  {editingBatch ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Schedule Modal */}
      {deleteConfirmBatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-rose-700 pb-2 border-b border-rose-100">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">সময়সূচী মুছে ফেলার নিশ্চিতকরণ</h3>
                <span className="text-[11px] text-rose-600 font-medium">রুটিন থেকে অপসারণ</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              আপনি কি নিশ্চিত যে <strong>"{deleteConfirmBatch.name}"</strong> ({deleteConfirmBatch.scheduleDays}, {deleteConfirmBatch.time}) সময়সূচীটি মুছে ফেলতে চান?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmBatch(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs cursor-pointer transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Default Schedules Modal */}
      {isClearDefaultModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-rose-700 pb-2 border-b border-rose-100">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ডিফল্ট শিডিউলসমূহ মুছে ফেলুন</h3>
                <span className="text-[11px] text-rose-600 font-medium">সম্পূর্ণ নতুন করে তৈরি করুন</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              সিস্টেমের সকল প্রাক-নির্ধারিত ডিফল্ট ব্যাচ ও ক্লাস রুটিন মুছে ফেলতে চান? এটি সম্পন্ন হলে রুটিন তালিকা পরিষ্কার হয়ে যাবে এবং আপনি সম্পূর্ণ নিজের মতো করে নতুন সময়সূচী ও ব্যাচ তৈরি করতে পারবেন।
            </p>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                টিপস: আপনি যখনই চান "নতুন সময়সূচী যোগ করুন" বাটনে ক্লিক করে আপনার আসল ক্লাসের সময়সূচী তৈরি করতে পারবেন।
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearDefaultModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleConfirmClearDefaults}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs cursor-pointer transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                হ্যাঁ, শিডিউল মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
