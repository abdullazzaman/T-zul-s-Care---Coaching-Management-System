import React, { useState } from 'react';
import {
  Layers,
  PlusCircle,
  Edit,
  Trash2,
  Users,
  Clock,
  Calendar,
  MapPin,
  CheckCircle,
  AlertTriangle,
  X,
  Sigma,
  Calculator,
} from 'lucide-react';
import {
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

interface BatchManagementProps {
  batches: Batch[];
  students: Student[];
  onSaveBatch: (batch: Batch) => void;
  onDeleteBatch: (batchId: string) => void;
}

export const BatchManagement: React.FC<BatchManagementProps> = ({
  batches,
  students,
  onSaveBatch,
  onDeleteBatch,
}) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deleteConfirmBatch, setDeleteConfirmBatch] = useState<Batch | null>(null);
  const [viewingEnrolledBatch, setViewingEnrolledBatch] = useState<Batch | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formClassLevel, setFormClassLevel] = useState<ClassLevel>('class_9');
  const [formSubject, setFormSubject] = useState<SubjectId>('math');
  const [formTeacher, setFormTeacher] = useState('তাজুল স্যার');
  const [formScheduleDays, setFormScheduleDays] = useState('শনি, সোম, বুধ');
  const [formTime, setFormTime] = useState('০৩:৩০ PM - ০৫:০০ PM');
  const [formRoom, setFormRoom] = useState('রুম-১০১');
  const [formStatus, setFormStatus] = useState<'active' | 'archived'>('active');
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setFormName('');
    setFormClassLevel('class_9');
    setFormSubject('math');
    setFormTeacher('তাজুল স্যার');
    setFormScheduleDays('শনি, সোম, বুধ');
    setFormTime('০৩:৩০ PM - ০৫:০০ PM');
    setFormRoom('রুম-১০১');
    setFormStatus('active');
    setFormNotes('');
    setFormErrors({});
    setIsModalOpen(true);
  };

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

  const handleClassChange = (newClass: ClassLevel) => {
    setFormClassLevel(newClass);
    const classDef = SUPPORTED_CLASSES.find((c) => c.id === newClass);
    if (!classDef?.supportsHigherMath && formSubject === 'higher_math') {
      setFormSubject('math');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formName.trim()) {
      errors.name = 'ব্যাচের নাম আবশ্যক';
    }
    if (!formTeacher.trim()) {
      errors.teacher = 'শিক্ষকের নাম আবশ্যক';
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

    onSaveBatch(newOrUpdatedBatch);
    setIsModalOpen(false);
  };

  const filteredBatches = batches.filter((b) => {
    const matchesClass = filterClass === 'all' || b.classLevel === filterClass;
    const matchesSubject = filterSubject === 'all' || b.subject === filterSubject;
    return matchesClass && matchesSubject;
  });

  const selectedClassDef = SUPPORTED_CLASSES.find((c) => c.id === formClassLevel);

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-700" />
            ব্যাচ ও ক্লাস ব্যবস্থাপনা (Batches & Classes)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            শ্রেণি ও বিষয়ভিত্তিক নির্ধারিত ব্যাচ এবং সময়সূচি পরিচালনা করুন
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          নতুন ব্যাচ তৈরি করুন
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">সকল শ্রেণি (Class 5 - 10)</option>
            {SUPPORTED_CLASSES.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.nameBn} ({cls.nameEn})
              </option>
            ))}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">সকল বিষয়</option>
            <option value="math">সাধারণ গণিত</option>
            <option value="higher_math">উচ্চতর গণিত</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          মোট ব্যাচ: {toBengaliNumber(filteredBatches.length)} টি
        </span>
      </div>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center shadow-xs">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">কোনো ব্যাচ পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            নতুন ব্যাচ তৈরি করে শ্রেণি ও বিষয় অনুযায়ী শিক্ষার্থীদের অন্তর্ভুক্ত করুন।
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-800"
          >
            <PlusCircle className="w-4 h-4" />
            নতুন ব্যাচ যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map((batch) => {
            const enrolledStudents = students.filter(
              (s) => s.status === 'active' && s.batchId === batch.id
            );
            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        batch.subject === 'higher_math'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {getSubjectShortName(batch.subject)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        batch.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {batch.status === 'active' ? 'চলমান' : 'আর্কাইভ'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {batch.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium block">
                    {getClassName(batch.classLevel)}
                  </span>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>দিন: {batch.scheduleDays}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>সময়: {batch.time}</span>
                    </div>
                    {batch.room && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>কক্ষ: {batch.room}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 font-medium text-slate-800 pt-1">
                      <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>শিক্ষক: {batch.teacher}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setViewingEnrolledBatch(batch)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{toBengaliNumber(enrolledStudents.length)} জন শিক্ষার্থী</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(batch)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                      title="সম্পাদনা করুন"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmBatch(batch)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-700" />
                {editingBatch ? 'ব্যাচ সম্পাদনা' : 'নতুন ব্যাচ তৈরি করুন'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ব্যাচের নাম*
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="উদাঃ Class 10 উচ্চতর গণিত (ব্যাচ-১)"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    formErrors.name ? 'border-rose-500' : 'border-slate-300'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.name}</p>
                )}
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
                    বিষয়*
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value as SubjectId)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="math">সাধারণ গণিত (Math)</option>
                    {selectedClassDef?.supportsHigherMath && (
                      <option value="higher_math">উচ্চতর গণিত (Higher Math)</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শিক্ষকের নাম*
                  </label>
                  <input
                    type="text"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    placeholder="তাজুল স্যার"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্লাসরুম / রুম নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    placeholder="রুম-১০১"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্লাসের দিনসমূহ
                  </label>
                  <input
                    type="text"
                    value={formScheduleDays}
                    onChange={(e) => setFormScheduleDays(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    placeholder="শনি, সোম, বুধ"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্লাসের সময়সূচি
                  </label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    placeholder="০৩:৩০ PM - ০৫:০০ PM"
                  />
                </div>
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
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingBatch ? 'সংরক্ষণ করুন' : 'ব্যাচ তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmBatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              ব্যাচ মুছে ফেলার নিশ্চিতকরণ
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              আপনি কি নিশ্চিতভাবে <strong className="text-slate-900">"{deleteConfirmBatch.name}"</strong> ব্যাচটি মুছে ফেলতে চান?
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmBatch(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  onDeleteBatch(deleteConfirmBatch.id);
                  setDeleteConfirmBatch(null);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Enrolled Students in Batch */}
      {viewingEnrolledBatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {viewingEnrolledBatch.name}
                </h3>
                <span className="text-xs text-slate-500">
                  নিবন্ধিত শিক্ষার্থী তালিকা
                </span>
              </div>
              <button
                onClick={() => setViewingEnrolledBatch(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100">
              {students.filter((s) => s.batchId === viewingEnrolledBatch.id).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  এই ব্যাচে এখনো কোনো শিক্ষার্থী যুক্ত করা হয়নি।
                </p>
              ) : (
                students
                  .filter((s) => s.batchId === viewingEnrolledBatch.id)
                  .map((student) => (
                    <div key={student.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {student.name.slice(0, 1)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {student.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {student.studentId}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-600">
                        {student.guardianPhone}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setViewingEnrolledBatch(null)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
