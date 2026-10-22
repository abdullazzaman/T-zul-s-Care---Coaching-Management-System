import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  PlusCircle,
  Menu,
  X,
  Calendar,
  Clock,
  Calculator,
  Sigma,
  Shield,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { InstitutionSettings } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface NavbarProps {
  settings: InstitutionSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickAddStudent: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  activeTab,
  setActiveTab,
  onQuickAddStudent,
  onLogout,
}) => {
  const { t, language, formatNum } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentTime(formatNum(timeStr));

      const bngMonths = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
      ];
      const enMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];

      if (language === 'bn') {
        const day = formatNum(now.getDate());
        const month = bngMonths[now.getMonth()];
        const year = formatNum(now.getFullYear());
        setCurrentDate(`${day} ${month}, ${year}`);
      } else {
        const day = now.getDate();
        const month = enMonths[now.getMonth()];
        const year = now.getFullYear();
        setCurrentDate(`${month} ${day}, ${year}`);
      }
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, [language, formatNum]);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'ড্যাশবোর্ড') },
    { id: 'students', label: t('nav.students', 'শিক্ষার্থী') },
    { id: 'accounts', label: t('nav.accounts', 'স্টুডেন্ট অ্যাকাউন্ট') },
    { id: 'batches', label: t('nav.batches', 'ব্যাচ ও ক্লাস') },
    { id: 'attendance', label: t('nav.attendance', 'উপস্থিতি') },
    { id: 'fees', label: t('nav.fees', 'মাসিক ফি') },
    { id: 'admit-cards', label: t('nav.admitCards', 'পরীক্ষা ও অ্যাডমিট কার্ড') },
    { id: 'exams', label: t('nav.exams', 'পরীক্ষা ও ফলাফল') },
    { id: 'routine', label: t('nav.routine', 'ক্লাস রুটিন') },
    { id: 'notices', label: t('nav.notices', 'নোটিশ') },
    { id: 'reports', label: t('nav.reports', 'রিপোর্ট') },
    { id: 'settings', label: t('nav.settings', 'সেটিংস') },
  ];

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner Bar */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-700">
              <Shield className="w-3 h-3 text-emerald-400" />
              {t('app.adminPanel', 'অ্যাডমিন প্যানেল')}
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline text-slate-300">
              {settings.institutionName || t('app.title', 'T@zul’s Care')} • {t('app.tagline', 'গণিত ও উচ্চতর গণিত')}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{currentDate}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{currentTime}</span>
            </div>
            {/* Top Language Selector */}
            <LanguageSelector variant="dark" />
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Institution Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.institutionName}
                className="h-11 w-11 object-contain rounded-lg border border-slate-200 shadow-xs p-0.5"
              />
            ) : (
              <div className="h-11 w-11 rounded-xl bg-linear-to-br from-blue-700 via-indigo-700 to-slate-900 flex items-center justify-center text-white shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform">
                <Sigma className="w-6 h-6 stroke-[2.5]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  {settings.institutionName || t('app.title', 'T@zul’s Care')}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[220px] sm:max-w-xs">
                {settings.tagline || t('app.tagline', 'গণিত ও উচ্চতর গণিত স্পেশাল কেয়ার')}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onQuickAddStudent}
              className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2 rounded-lg text-sm font-semibold shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.quickAddStudent', 'নতুন শিক্ষার্থী ভর্তি')}</span>
              <span className="sm:hidden">{t('common.add', 'ভর্তি')}</span>
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg border border-slate-200 transition cursor-pointer"
              title={t('nav.logout', 'লগআউট')}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">{t('nav.logout', 'লগআউট')}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 border-t border-slate-100 py-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 shadow-2xs font-bold border-b-2 border-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in fade-in slide-in-from-top duration-200">
          <div className="pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t('lang.selectLanguage', 'ভাষা নির্বাচন')}:</span>
            <LanguageSelector variant="light" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{settings.directorName || 'তাজুল স্যার'}</span>
            <button
              onClick={onLogout}
              className="text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> {t('nav.logout', 'লগআউট')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
