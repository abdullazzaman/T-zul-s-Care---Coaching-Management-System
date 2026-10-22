import { ClassLevel, SubjectId, SUPPORTED_CLASSES, SUPPORTED_SUBJECTS } from '../types';

export const BENGALI_DIGITS: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBengaliNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '০';
  const str = String(num);
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[digit] || digit);
}

export function formatTaka(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN').format(amount || 0);
  return `৳${toBengaliNumber(formatted)}`;
}

export function getClassName(classId: ClassLevel): string {
  const found = SUPPORTED_CLASSES.find((c) => c.id === classId);
  return found ? `${found.nameBn} (${found.nameEn})` : classId;
}

export function getClassShortName(classId: ClassLevel): string {
  const found = SUPPORTED_CLASSES.find((c) => c.id === classId);
  return found ? found.nameBn : classId;
}

export function getSubjectName(subjectId: SubjectId): string {
  const found = SUPPORTED_SUBJECTS.find((s) => s.id === subjectId);
  return found ? `${found.nameBn} (${found.nameEn})` : subjectId;
}

export function getSubjectShortName(subjectId: SubjectId): string {
  const found = SUPPORTED_SUBJECTS.find((s) => s.id === subjectId);
  return found ? found.nameBn : subjectId;
}

export interface GradeResult {
  grade: 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F';
  gpa: number;
  percentage: number;
  status: 'Pass' | 'Fail';
}

export function calculateGrade(obtainedMarks: number, totalMarks: number): GradeResult {
  if (totalMarks <= 0) {
    return { grade: 'F', gpa: 0, percentage: 0, status: 'Fail' };
  }
  const percentage = Math.round((obtainedMarks / totalMarks) * 100);

  if (percentage >= 80) return { grade: 'A+', gpa: 5.0, percentage, status: 'Pass' };
  if (percentage >= 70) return { grade: 'A', gpa: 4.0, percentage, status: 'Pass' };
  if (percentage >= 60) return { grade: 'A-', gpa: 3.5, percentage, status: 'Pass' };
  if (percentage >= 50) return { grade: 'B', gpa: 3.0, percentage, status: 'Pass' };
  if (percentage >= 40) return { grade: 'C', gpa: 2.0, percentage, status: 'Pass' };
  if (percentage >= 33) return { grade: 'D', gpa: 1.0, percentage, status: 'Pass' };
  return { grade: 'F', gpa: 0.0, percentage, status: 'Fail' };
}

export function generateNextStudentId(existingIds: string[]): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `TC-${year}`;
  
  // Find highest number with prefix
  let maxNum = 0;
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const parts = id.split('-');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
}

export function generateReceiptNumber(existingReceipts: string[]): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `REC-${year}`;
  
  let maxNum = 0;
  for (const r of existingReceipts) {
    if (r.startsWith(prefix)) {
      const parts = r.split('-');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

export const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export function getCurrentMonthNameBn(): string {
  const date = new Date();
  const month = MONTH_NAMES_BN[date.getMonth()];
  const yearBn = toBengaliNumber(date.getFullYear());
  return `${month} ${yearBn}`;
}
