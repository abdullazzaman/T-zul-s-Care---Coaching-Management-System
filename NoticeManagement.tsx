import React, { useState } from 'react';
import { Bell, PlusCircle, Trash2, Edit, X, Calendar, AlertTriangle } from 'lucide-react';
import { Notice, ClassLevel, SUPPORTED_CLASSES } from '../types';
import { toBengaliNumber, getClassName } from '../utils/helpers';

interface NoticeManagementProps {
  notices: Notice[];
  onSaveNotice: (notice: Notice) => void;
  onDeleteNotice: (noticeId: string) => void;
}

export const NoticeManagement: React.FC<NoticeManagementProps> = ({
  notices,
  onSaveNotice,
  onDeleteNotice,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState<'normal' | 'important' | 'urgent'>('important');
  const [formTargetClass, setFormTargetClass] = useState<ClassLevel | 'all'>('all');

  const handleOpenAdd = () => {
    setEditingNotice(null);
    setFormTitle('');
    setFormContent('');
    setFormPriority('important');
    setFormTargetClass('all');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormTitle(notice.title);
    setFormContent(notice.content);
    setFormPriority(notice.priority);
    setFormTargetClass(notice.targetClass);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newNotice: Notice = {
      id: editingNotice ? editingNotice.id : `notice_${Date.now()}`,
      title: formTitle.trim(),
      content: formContent.trim(),
      priority: formPriority,
      targetClass: formTargetClass,
      date: new Date().toISOString().split('T')[0],
    };

    onSaveNotice(newNotice);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-rose-600" />
            নোটিশ বোর্ড (Notice Board)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            শিক্ষার্থী ও অভিভাবকদের জন্য জরুরি নোটিশ এবং ছুটির ঘোষণা প্রকাশ করুন
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          নতুন নোটিশ দিন
        </button>
      </div>

      {notices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center shadow-xs">
          <Bell className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">কোনো নোটিশ নেই</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            কোচিং এর ক্লাস বা পরীক্ষার বার্তা প্রকাশ করতে নতুন নোটিশ তৈরি করুন।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:shadow-md transition space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      n.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-700'
                        : n.priority === 'important'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {n.priority === 'urgent'
                      ? 'জরুরি'
                      : n.priority === 'important'
                      ? 'গুরুত্বপূর্ণ'
                      : 'সাধারণ'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {n.targetClass === 'all'
                      ? 'সকল শ্রেণির জন্য'
                      : getClassName(n.targetClass)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-slate-400 mr-2">
                    {toBengaliNumber(n.date)}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(n)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('আপনি কি এই নোটিশটি মুছে ফেলতে চান?')) {
                        onDeleteNotice(n.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900">{n.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {n.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-600" />
                {editingNotice ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ প্রদান'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নোটিশের শিরোনাম*
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="উদাঃ আগামী শুক্রবার বিশেষ গণিত মডেল টেস্ট"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    গুরুত্ব (Priority)
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) =>
                      setFormPriority(e.target.value as 'normal' | 'important' | 'urgent')
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="normal">সাধারণ</option>
                    <option value="important">গুরুত্বপূর্ণ</option>
                    <option value="urgent">জরুরি</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    উদ্দিষ্ট শ্রেণি
                  </label>
                  <select
                    value={formTargetClass}
                    onChange={(e) => setFormTargetClass(e.target.value as ClassLevel | 'all')}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="all">সকল শ্রেণি (Class 5 - 10)</option>
                    {SUPPORTED_CLASSES.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নোটিশের বিস্তারিত বিবরণ*
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={4}
                  placeholder="নোটিশের বিস্তারিত বার্তা লিখুন..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  required
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
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingNotice ? 'সংরক্ষণ করুন' : 'নোটিশ প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
