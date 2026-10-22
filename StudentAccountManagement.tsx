import React, { useState } from 'react';
import {
  UserCheck,
  UserX,
  KeyRound,
  Lock,
  Search,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  ShieldAlert,
  RefreshCw,
  PlusCircle,
  Users,
} from 'lucide-react';
import { Student, StudentAccount } from '../types';
import { storage } from '../services/storage';
import { hashPassword, generateRandomPassword } from '../utils/crypto';
import { toBengaliNumber, getClassShortName } from '../utils/helpers';
import {
  createStudentFirebaseAuthAccount,
  firestoreService,
} from '../services/firebase';

interface StudentAccountManagementProps {
  students: Student[];
  studentAccounts: StudentAccount[];
  onRefreshAccounts: () => void;
}

export const StudentAccountManagement: React.FC<StudentAccountManagementProps> = ({
  students,
  studentAccounts,
  onRefreshAccounts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newCredentialsModal, setNewCredentialsModal] = useState<{
    studentName: string;
    studentId: string;
    plainPassword: string;
  } | null>(null);

  // Activate / Create Account for Student
  const handleCreateOrResetAccount = async (student: Student) => {
    const randomPassword = generateRandomPassword(8);
    const passwordHash = await hashPassword(randomPassword);
    const username = (student.username || student.studentId).toLowerCase();

    let authUid: string | undefined = undefined;
    try {
      const res = await createStudentFirebaseAuthAccount(username, randomPassword);
      authUid = res.uid;
    } catch (authErr) {
      console.warn('Firebase Auth notice in account manager:', authErr);
    }

    const existingIndex = studentAccounts.findIndex((a) => a.studentId === student.studentId);
    let updated: StudentAccount[];

    if (existingIndex >= 0) {
      updated = [...studentAccounts];
      updated[existingIndex] = {
        ...updated[existingIndex],
        passwordHash,
        tempPlainPassword: randomPassword,
        uid: authUid || updated[existingIndex].uid,
        mustChangePassword: true,
        status: 'active',
      };
    } else {
      const newAccount: StudentAccount = {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        studentId: student.studentId,
        studentDbId: student.id,
        username,
        passwordHash,
        tempPlainPassword: randomPassword,
        uid: authUid,
        status: 'active',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      };
      updated = [newAccount, ...studentAccounts];
    }

    storage.saveStudentAccounts(updated);
    if (student.id) {
      firestoreService.updateStudentPasswordFlag(student.id, true).catch(() => {});
    }
    onRefreshAccounts();

    setNewCredentialsModal({
      studentName: student.name,
      studentId: student.studentId,
      plainPassword: randomPassword,
    });
  };

  // Toggle Account Active / Deactivated
  const handleToggleStatus = (account: StudentAccount) => {
    const updated = studentAccounts.map((a) =>
      a.id === account.id
        ? { ...a, status: (a.status === 'active' ? 'deactivated' : 'active') as 'active' | 'deactivated' }
        : a
    );
    storage.saveStudentAccounts(updated);
    onRefreshAccounts();
  };

  // Copy Login Credentials
  const handleCopyCredentials = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredStudents = students.filter((s) => {
    const acc = studentAccounts.find((a) => a.studentId === s.studentId);
    const hasAccount = !!acc;
    const isAct = acc?.status === 'active';

    const matchesSearch =
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guardianPhone.includes(searchQuery);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'has_account' && hasAccount) ||
      (filterStatus === 'no_account' && !hasAccount) ||
      (filterStatus === 'active' && isAct) ||
      (filterStatus === 'deactivated' && acc?.status === 'deactivated');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-blue-700" />
          শিক্ষার্থী অ্যাকাউন্ট ও লগইন ব্যবস্থাপনা (Student Accounts)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          স্টুডেন্ট পোর্টালে শিক্ষার্থীদের ব্যক্তিগত অ্যাক্সেস, প্রাথমিক পাসওয়ার্ড ও অ্যাকাউন্ট সক্রিয়/নিষ্ক্রিয়করণ
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম বা আইডি..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 w-56 sm:w-64"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium"
          >
            <option value="all">সকল শিক্ষার্থী</option>
            <option value="has_account">অ্যাকাউন্ট প্রস্তুত আছে</option>
            <option value="no_account">অ্যাকাউন্ট তৈরি হয়নি</option>
            <option value="active">সক্রিয় অ্যাকাউন্ট (Active)</option>
            <option value="deactivated">নিষ্ক্রিয় অ্যাকাউন্ট (Deactivated)</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          মোট অ্যাকাউন্ট: {toBengaliNumber(studentAccounts.length)} টি
        </span>
      </div>

      {/* Account Table */}
      {students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center shadow-xs">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">কোনো শিক্ষার্থী নিবন্ধিত নেই</h3>
          <p className="text-xs text-slate-500 mt-1">
            প্রথমে শিক্ষার্থী ব্যবস্থাপনা থেকে শিক্ষার্থী যোগ করুন। এরপর এখান থেকে তাদের পোর্টাল অ্যাকাউন্ট চালু করতে পারবেন।
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">শিক্ষার্থী</th>
                <th className="py-3 px-4">শ্রেণি</th>
                <th className="py-3 px-4">লগইন আইডি / ইউজারনেম</th>
                <th className="py-3 px-4">অ্যাকাউন্ট স্ট্যাটাস</th>
                <th className="py-3 px-4">সর্বশেষ লগইন</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const account = studentAccounts.find((a) => a.studentId === student.studentId);
                const hasAccount = !!account;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {student.name.slice(0, 1)}
                        </div>
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

                    <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                      {getClassShortName(student.classLevel)}
                    </td>

                    <td className="py-3 px-4">
                      {hasAccount ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {account.username}
                          </code>
                          {account.tempPlainPassword && (
                            <button
                              onClick={() =>
                                handleCopyCredentials(
                                  student.id,
                                  `T@zul’s Care Student Portal Login:\nID: ${account.studentId}\nPassword: ${account.tempPlainPassword}`
                                )
                              }
                              className="text-slate-400 hover:text-blue-600 p-1 rounded"
                              title="লগইন তথ্য কপি করুন"
                            >
                              {copiedId === student.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">অ্যাকাউন্ট খোলা হয়নি</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {hasAccount ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            account.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {account.status === 'active' ? (
                            <>
                              <UserCheck className="w-3 h-3" /> সক্রিয় (Active)
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" /> নিষ্ক্রিয় (Deactivated)
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                          অপেক্ষমান
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {account?.lastLogin ? toBengaliNumber(account.lastLogin.split('T')[0]) : '—'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasAccount ? (
                          <>
                            <button
                              onClick={() => handleToggleStatus(account)}
                              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                account.status === 'active'
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={account.status === 'active' ? 'অ্যাকাউন্ট নিষ্ক্রিয় করুন' : 'অ্যাকাউন্ট সক্রিয় করুন'}
                            >
                              {account.status === 'active' ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() => handleCreateOrResetAccount(student)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                              title="পাসওয়ার্ড রিসেট করুন"
                            >
                              <RefreshCw className="w-3 h-3 text-blue-600" />
                              পাসওয়ার্ড রিসেট
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleCreateOrResetAccount(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            অ্যাকাউন্ট তৈরি করুন
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Credentials Modal (Shown to admin immediately upon creation/reset) */}
      {newCredentialsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                স্টুডেন্ট লগইন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                এই তথ্যগুলো শিক্ষার্থী বা তার অভিভাবককে সরবরাহ করুন।
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">শিক্ষার্থীর নাম:</span>
                <strong className="text-slate-800">{newCredentialsModal.studentName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">লগইন আইডি (Student ID):</span>
                <code className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {newCredentialsModal.studentId}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">প্রাথমিক পাসওয়ার্ড:</span>
                <code className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {newCredentialsModal.plainPassword}
                </code>
              </div>
              <p className="text-[11px] text-amber-700 pt-1 border-t border-slate-200 font-medium">
                * শিক্ষার্থী প্রথমবার লগইন করার সময় তাকে নতুন ব্যক্তিগত পাসওয়ার্ড সেট করতে বলা হবে।
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() =>
                  handleCopyCredentials(
                    'modal',
                    `T@zul’s Care Student Portal Login:\nশিক্ষার্থী: ${newCredentialsModal.studentName}\nলগইন আইডি: ${newCredentialsModal.studentId}\nপাসওয়ার্ড: ${newCredentialsModal.plainPassword}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                {copiedId === 'modal' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                তথ্য কপি করুন
              </button>
              <button
                onClick={() => setNewCredentialsModal(null)}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
