import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../i18n/translations';
import { ClassLevel, SubjectId, SUPPORTED_CLASSES, SUPPORTED_SUBJECTS } from '../types';
import { toBengaliNumber, MONTH_NAMES_BN } from '../utils/helpers';

const STORAGE_KEY = 'tzc_language_preference';

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
  formatNum: (num: number | string | undefined | null) => string;
  formatMoney: (amount: number) => string;
  getClassNameText: (classId: ClassLevel) => string;
  getClassShortText: (classId: ClassLevel) => string;
  getSubjectNameText: (subjectId: SubjectId) => string;
  getSubjectShortText: (subjectId: SubjectId) => string;
  getStatusText: (status: string) => string;
  getMonthText: (monthStr: string) => string;
  getCurrentMonthText: () => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Requirement 4: Set English as default for first-time users unless an existing language preference is configured
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'bn' || saved === 'en') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  };

  // Translation lookup function
  const t = (key: string, defaultText?: string): string => {
    const dict = translations[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English dictionary if not found in Bengali
    if (language !== 'en' && translations.en[key]) {
      return translations.en[key];
    }
    return defaultText || key;
  };

  // Language-aware number formatting
  const formatNum = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return language === 'bn' ? '০' : '0';
    if (language === 'bn') {
      return toBengaliNumber(num);
    }
    return String(num);
  };

  // Language-aware currency formatting (Bangladeshi Taka ৳)
  const formatMoney = (amount: number): string => {
    const num = amount || 0;
    const formatted = new Intl.NumberFormat('en-IN').format(num);
    if (language === 'bn') {
      return `৳${toBengaliNumber(formatted)}`;
    }
    return `৳${formatted}`;
  };

  // Language-aware class full name
  const getClassNameText = (classId: ClassLevel): string => {
    const classDef = SUPPORTED_CLASSES.find((c) => c.id === classId);
    if (!classDef) return classId;
    return language === 'bn' ? classDef.nameBn : classDef.nameEn;
  };

  // Language-aware class short name
  const getClassShortText = (classId: ClassLevel): string => {
    const key = `class.short.${classId}`;
    return t(key, classId);
  };

  // Language-aware subject full name
  const getSubjectNameText = (subjectId: SubjectId): string => {
    const subDef = SUPPORTED_SUBJECTS.find((s) => s.id === subjectId);
    if (!subDef) return subjectId;
    return language === 'bn' ? subDef.nameBn : subDef.nameEn;
  };

  // Language-aware subject short name
  const getSubjectShortText = (subjectId: SubjectId): string => {
    const key = `subject.short.${subjectId}`;
    return t(key, subjectId);
  };

  // Status mapping
  const getStatusText = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return t('common.active', 'Active');
      case 'inactive':
        return t('common.inactive', 'Inactive');
      case 'deactivated':
        return t('common.deactivated', 'Deactivated');
      case 'paid':
        return t('common.paid', 'Paid');
      case 'unpaid':
        return t('common.unpaid', 'Unpaid');
      case 'partial':
        return t('common.partial', 'Partial');
      case 'present':
        return t('common.present', 'Present');
      case 'absent':
        return t('common.absent', 'Absent');
      case 'late':
        return t('common.late', 'Late');
      default:
        return status;
    }
  };

  // Month translation helper
  const getMonthText = (monthStr: string): string => {
    if (!monthStr) return '';
    // If English, translate known Bengali months
    if (language === 'en') {
      let result = monthStr;
      MONTH_NAMES_BN.forEach((bnMonth, idx) => {
        if (result.includes(bnMonth)) {
          result = result.replace(bnMonth, MONTH_NAMES_EN[idx]);
        }
      });
      // Replace Bengali digits with English digits if any
      const bDigits: { [k: string]: string } = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
      };
      return result.replace(/[০-৯]/g, (d) => bDigits[d] || d);
    }
    // If Bengali, translate known English months
    let result = monthStr;
    MONTH_NAMES_EN.forEach((enMonth, idx) => {
      if (result.includes(enMonth)) {
        result = result.replace(enMonth, MONTH_NAMES_BN[idx]);
      }
    });
    return result.replace(/[0-9]/g, (d) => toBengaliNumber(d));
  };

  const getCurrentMonthText = (): string => {
    const now = new Date();
    if (language === 'bn') {
      const month = MONTH_NAMES_BN[now.getMonth()];
      const year = toBengaliNumber(now.getFullYear());
      return `${month} ${year}`;
    }
    const month = MONTH_NAMES_EN[now.getMonth()];
    return `${month} ${now.getFullYear()}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatNum,
        formatMoney,
        getClassNameText,
        getClassShortText,
        getSubjectNameText,
        getSubjectShortText,
        getStatusText,
        getMonthText,
        getCurrentMonthText,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
