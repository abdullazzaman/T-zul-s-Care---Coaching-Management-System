import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'light' | 'dark' | 'header';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl border transition shadow-2xs ${
        variant === 'dark'
          ? 'bg-slate-800/80 border-slate-700 text-slate-300'
          : variant === 'light'
          ? 'bg-slate-100 border-slate-200 text-slate-700'
          : 'bg-white/95 border-slate-200/90 text-slate-700 shadow-xs'
      } ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          language === 'bn'
            ? variant === 'dark'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-700 text-white shadow-xs'
            : variant === 'dark'
            ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title="বাংলা ভাষায় পরিবর্তন করুন"
      >
        <span className="text-sm leading-none" role="img" aria-label="Bangladesh flag">
          🇧🇩
        </span>
        <span>বাংলা</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          language === 'en'
            ? variant === 'dark'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-700 text-white shadow-xs'
            : variant === 'dark'
            ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title="Switch to English"
      >
        <span className="text-sm leading-none" role="img" aria-label="UK flag">
          🇬🇧
        </span>
        <span>English</span>
      </button>
    </div>
  );
};
