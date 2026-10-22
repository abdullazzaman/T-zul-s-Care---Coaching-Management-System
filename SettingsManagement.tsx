import React, { useState, useId } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Upload,
  Trash2,
  Save,
  Download,
  RefreshCw,
  Check,
  AlertTriangle,
  Image as ImageIcon,
  ShieldCheck,
  FileCode,
  Sigma,
  KeyRound,
  CreditCard,
  Lock,
} from 'lucide-react';
import { InstitutionSettings } from '../types';
import { storage } from '../services/storage';
import { hashPassword, verifyPassword } from '../utils/crypto';

interface SettingsManagementProps {
  settings: InstitutionSettings;
  onSaveSettings: (settings: InstitutionSettings) => void;
  onRestoreBackup: () => void;
}

export const SettingsManagement: React.FC<SettingsManagementProps> = ({
  settings,
  onSaveSettings,
  onRestoreBackup,
}) => {
  const [formName, setFormName] = useState(settings.institutionName || 'T@zul’s Care');
  const [formTagline, setFormTagline] = useState(
    settings.tagline || 'গণিত ও উচ্চতর গণিত স্পেশাল কেয়ার'
  );
  const [formDirector, setFormDirector] = useState(settings.directorName || 'তাজুল স্যার');
  const [formPhone, setFormPhone] = useState(settings.phone || '01712-345678');
  const [formEmail, setFormEmail] = useState(settings.email || 'tazuls.care@gmail.com');
  const [formAddress, setFormAddress] = useState(
    settings.address || 'বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা'
  );
  const [formAcademicYear, setFormAcademicYear] = useState(settings.academicYear || '২০২৬');
  const [formLogoUrl, setFormLogoUrl] = useState(settings.logoUrl || '');
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoUrl || '');

  // Payment Instructions
  const [bkashNumber, setBkashNumber] = useState(
    settings.paymentInstructions?.bkashNumber || '01712-345678 (Personal / Send Money)'
  );
  const [nagadNumber, setNagadNumber] = useState(
    settings.paymentInstructions?.nagadNumber || '01712-345678 (Personal / Send Money)'
  );
  const [rocketNumber, setRocketNumber] = useState(
    settings.paymentInstructions?.rocketNumber || '01712-345678-9'
  );
  const [paymentInstructionsBn, setPaymentInstructionsBn] = useState(
    settings.paymentInstructions?.instructionsBn ||
      'বিকাশ বা নগদ থেকে সেন্ড মানি করে ট্রানজ্যাকশন আইডি ও শিক্ষার্থীর আইডি সংরক্ষণ করুন এবং কোচিং অফিসে অবহিত করুন।'
  );

  // Admin Password Change
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [adminPassSuccess, setAdminPassSuccess] = useState(false);
  const [adminPassError, setAdminPassError] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const logoUploadId = useId();
  const backupImportId = useId();

  // Handle Logo Upload and Preview
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('লোগোর সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormLogoUrl('');
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: InstitutionSettings = {
      institutionName: formName.trim() || 'T@zul’s Care',
      tagline: formTagline.trim(),
      directorName: formDirector.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      address: formAddress.trim(),
      logoUrl: logoPreview,
      academicYear: formAcademicYear.trim(),
      currencySymbol: '৳',
      paymentInstructions: {
        bkashNumber: bkashNumber.trim(),
        nagadNumber: nagadNumber.trim(),
        rocketNumber: rocketNumber.trim(),
        instructionsBn: paymentInstructionsBn.trim(),
      },
    };

    setFormLogoUrl(logoPreview);
    onSaveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Handle Admin Password Change
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassError(null);
    setAdminPassSuccess(false);

    if (newAdminPassword.length < 6) {
      setAdminPassError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setAdminPassError('পাসওয়ার্ড দুটি মেলেনি।');
      return;
    }

    try {
      const admin = await storage.getAdminAccount();
      const isMatch = await verifyPassword(currentAdminPassword, admin.passwordHash);
      if (!isMatch) {
        setAdminPassError('বর্তমান অ্যাডমিন পাসওয়ার্ড ভুল।');
        return;
      }

      admin.passwordHash = await hashPassword(newAdminPassword);
      admin.mustChangePassword = false;
      admin.updatedAt = new Date().toISOString();
      storage.saveAdminAccount(admin);

      setAdminPassSuccess(true);
      setCurrentAdminPassword('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      setTimeout(() => setAdminPassSuccess(false), 4000);
    } catch {
      setAdminPassError('পাসওয়ার্ড পরিবর্তনে ত্রুটি হয়েছে।');
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const jsonStr = storage.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tazuls_care_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const success = storage.importBackup(content);
          if (success) {
            setImportStatus('সফলভাবে ব্যাকআপ থেকে ডাটা রিস্টোর করা হয়েছে!');
            onRestoreBackup();
          } else {
            setImportStatus('ত্রুটি: ব্যাকআপ ফাইলটি সঠিক নয়।');
          }
        } catch {
          setImportStatus('ত্রুটি: ফাইলটি পড়া যায়নি।');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-700" />
          প্রতিষ্ঠান সেটিংস ও ব্র্যান্ডিং (Institution Settings)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          কোচিং এর নাম, লোগো, যোগাযোগের ঠিকানা, অনলাইন ফি নির্দেশনাবলী ও ডাটা ব্যাকআপ পরিচালনা করুন
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          প্রতিষ্ঠান সেটিংস ও ব্র্যান্ডিং সফলভাবে সংরক্ষিত হয়েছে!
        </div>
      )}

      {importStatus && (
        <div className="p-3.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4" />
          {importStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-5 h-5 text-blue-700" />
              প্রাতিষ্ঠানিক তথ্য ও ব্র্যান্ডিং
            </h3>

            <form onSubmit={handleSaveBranding} className="space-y-4">
              {/* Institution Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রতিষ্ঠানের নাম (Institution Name)*
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-300"
                  placeholder="T@zul’s Care"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  এই নামটি স্টুডেন্ট পোর্টাল, অ্যাডমিন ড্যাশবোর্ড, মানি রিসিট ও মার্কশিটে প্রদর্শিত হবে
                </span>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ট্যাগলাইন বা স্লোগান
                </label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  placeholder="গণিত ও উচ্চতর গণিত স্পেশাল কেয়ার"
                />
              </div>

              {/* Director & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পরিচালক / শিক্ষকের নাম*
                  </label>
                  <input
                    type="text"
                    value={formDirector}
                    onChange={(e) => setFormDirector(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-semibold"
                    placeholder="তাজুল স্যার"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    চলতি শিক্ষাবর্ষ
                  </label>
                  <input
                    type="text"
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="২০২৬"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    অফিসিয়াল ফোন নম্বর*
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-mono"
                    placeholder="01712-345678"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইমেইল ঠিকানা
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                    placeholder="tazuls.care@gmail.com"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কোচিং এর ঠিকানা (রশিদে প্রিন্ট হবে)
                </label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300"
                  placeholder="বাড়ি #১২, রোড #৪, ধানমন্ডি, ঢাকা"
                />
              </div>

              {/* Payment Instructions for Student Portal */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  স্টুডেন্ট পোর্টালে প্রদর্শিত ফি পরিশোধ নির্দেশনাবলী
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">বিকাশ নম্বর</label>
                    <input
                      type="text"
                      value={bkashNumber}
                      onChange={(e) => setBkashNumber(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      placeholder="017XXXXXXXX (Personal)"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">নগদ নম্বর</label>
                    <input
                      type="text"
                      value={nagadNumber}
                      onChange={(e) => setNagadNumber(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      placeholder="017XXXXXXXX (Personal)"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পরিশোধের বার্তা/নির্দেশনা</label>
                  <textarea
                    value={paymentInstructionsBn}
                    onChange={(e) => setPaymentInstructionsBn(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  সেটিংস সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>

          {/* Admin Password Change Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-5 h-5 text-slate-800" />
              অ্যাডমিন পাসওয়ার্ড পরিবর্তন (Change Admin Password)
            </h3>

            {adminPassSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!
              </div>
            )}

            {adminPassError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {adminPassError}
              </div>
            )}

            <form onSubmit={handleChangeAdminPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বর্তমান অ্যাডমিন পাসওয়ার্ড*
                </label>
                <input
                  type="password"
                  value={currentAdminPassword}
                  onChange={(e) => setCurrentAdminPassword(e.target.value)}
                  placeholder="বর্তমান পাসওয়ার্ড"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)*
                  </label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="নতুন গোপন পাসওয়ার্ড"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    নতুন পাসওয়ার্ড নিশ্চিত করুন*
                  </label>
                  <input
                    type="password"
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    placeholder="পুনরায় একই পাসওয়ার্ড"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition"
              >
                পাসওয়ার্ড পরিবর্তন করুন
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Logo Preview & Backup */}
        <div className="space-y-6">
          {/* Logo Management */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              প্রতিষ্ঠানের লোগো (Logo)
            </h3>

            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center">
              {logoPreview ? (
                <div className="space-y-3">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-24 h-24 object-contain mx-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xs"
                  />
                  <span className="text-xs font-bold text-emerald-700 block">
                    লোগো প্রিভিউ প্রদর্শিত হচ্ছে
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-blue-700 via-indigo-700 to-slate-900 flex items-center justify-center text-white mx-auto shadow-md">
                    <Sigma className="w-10 h-10 stroke-[2.5]" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium block">
                    ডিফল্ট ম্যাথ আইকন সক্রিয় রয়েছে
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <label
                  htmlFor={logoUploadId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  নতুন লোগো আপলোড
                </label>
                <input
                  id={logoUploadId}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                    title="লোগো মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block">
                PNG, JPG বা SVG (সর্বোচ্চ ২ MB)
              </span>
            </div>
          </div>

          {/* Backup & Data Persistence */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ডাটা ব্যাকআপ ও নিরাপত্তা
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              আপনার শিক্ষার্থী, ব্যাচ, উপস্থিতি, ফি, পরীক্ষা এবং অ্যাকাউন্টসমূহ ব্রাউজার লোকাল ডাটাবেসে সুরক্ষিত রয়েছে।
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                সম্পূর্ণ ব্যাকআপ ডাউনলোড (JSON)
              </button>

              <div>
                <label
                  htmlFor={backupImportId}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer transition"
                >
                  <FileCode className="w-4 h-4 text-slate-600" />
                  ব্যাকআপ থেকে রিস্টোর করুন
                </label>
                <input
                  id={backupImportId}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
