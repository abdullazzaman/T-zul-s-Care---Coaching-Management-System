import {
  Student,
  ExaminationEvent,
  ExamFeeRecord,
  AdmitCardClearanceRecord,
} from '../types';

export type AdmitCardAccessCase =
  | 'UNPAID'
  | 'PAYMENT_PENDING'
  | 'CLEARANCE_PENDING'
  | 'APPROVED'
  | 'REVOKED'
  | 'UNPUBLISHED'
  | 'INACTIVE'
  | 'NOT_ASSIGNED';

export interface AdmitCardAccessEvaluation {
  canAccess: boolean;
  accessCase: AdmitCardAccessCase;
  isEligible: boolean;
  messageBn: string;
  messageEn: string;
  feeRequired: number;
  feePaid: number;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'rejected';
  clearanceStatus: 'pending' | 'approved' | 'rejected' | 'revoked';
  admitCardRef?: string;
}

/**
 * Strict evaluator enforcing ALL 6 admit card access conditions:
 * 1. Examination exists and is active.
 * 2. Examination is assigned to student's class or batch.
 * 3. Required examination fee paid in full.
 * 4. Payment is verified (status === 'paid').
 * 5. Administrator has approved clearance (clearanceStatus === 'approved').
 * 6. Admit card is generated and published (isAdmitCardPublished === true).
 */
export function evaluateAdmitCardAccess(
  student: Student,
  exam: ExaminationEvent,
  feeRecord?: ExamFeeRecord | null,
  clearanceRecord?: AdmitCardClearanceRecord | null
): AdmitCardAccessEvaluation {
  const feeRequired = exam.examFee || 0;
  const feePaid = feeRecord ? feeRecord.paidAmount || 0 : 0;
  const paymentStatus = feeRecord ? feeRecord.status : (feeRequired === 0 ? 'paid' : 'unpaid');
  const clearanceStatus = clearanceRecord ? clearanceRecord.clearanceStatus : 'pending';
  const admitCardRef = clearanceRecord?.admitCardRef || `AC-${student.studentId}-${exam.id.slice(-4)}`;

  // Condition 1: Examination exists and is active
  if (exam.status !== 'active') {
    return {
      canAccess: false,
      accessCase: 'INACTIVE',
      isEligible: false,
      messageBn: 'পরীক্ষাটি বর্তমানে নিষ্ক্রিয় বা সম্পন্ন হয়েছে।',
      messageEn: 'This examination is currently inactive or completed.',
      feeRequired,
      feePaid,
      paymentStatus,
      clearanceStatus,
      admitCardRef,
    };
  }

  // Condition 2: Assigned to student's class or batch
  const isClassAssigned = exam.classLevels.includes(student.classLevel);
  const isBatchAssigned =
    exam.batchIds.length === 0 ||
    (student.batchId && exam.batchIds.includes(student.batchId));

  if (!isClassAssigned && !isBatchAssigned) {
    return {
      canAccess: false,
      accessCase: 'NOT_ASSIGNED',
      isEligible: false,
      messageBn: 'এই পরীক্ষাটি আপনার শ্রেণি বা ব্যাচের জন্য নির্ধারিত নয়।',
      messageEn: 'This examination is not assigned to your class or batch.',
      feeRequired,
      feePaid,
      paymentStatus,
      clearanceStatus,
      admitCardRef,
    };
  }

  // Case E: Clearance revoked or rejected
  if (clearanceStatus === 'revoked' || clearanceStatus === 'rejected') {
    return {
      canAccess: false,
      accessCase: 'REVOKED',
      isEligible: false,
      messageBn: 'আপনার অ্যাডমিট কার্ড ক্লিয়ারেন্স বাতিল করা হয়েছে। অনুগ্রহ করে অফিসে যোগাযোগ করুন।',
      messageEn: 'Your admit card clearance has been revoked. Please contact the office.',
      feeRequired,
      feePaid,
      paymentStatus,
      clearanceStatus,
      admitCardRef,
    };
  }

  // Condition 3 & 4: Fee payment required & verification
  if (feeRequired > 0) {
    if (!feeRecord || feeRecord.status === 'unpaid' || feeRecord.status === 'rejected') {
      return {
        canAccess: false,
        accessCase: 'UNPAID',
        isEligible: false,
        messageBn: 'পরীক্ষার ফি পরিশোধ করা হয়নি। ফি পরিশোধ ও যাচাই সম্পন্ন হলে অ্যাডমিট কার্ড পাওয়া যাবে।',
        messageEn: 'Your examination fee has not been paid. Your admit card will become available after payment and verification.',
        feeRequired,
        feePaid,
        paymentStatus: 'unpaid',
        clearanceStatus,
        admitCardRef,
      };
    }

    if (feeRecord.status === 'pending') {
      return {
        canAccess: false,
        accessCase: 'PAYMENT_PENDING',
        isEligible: false,
        messageBn: 'আপনার পেমেন্ট যাচাইয়ের অপেক্ষায় রয়েছে।',
        messageEn: 'Your payment is awaiting verification.',
        feeRequired,
        feePaid,
        paymentStatus: 'pending',
        clearanceStatus,
        admitCardRef,
      };
    }

    if (feeRecord.status === 'paid' && feePaid < feeRequired) {
      return {
        canAccess: false,
        accessCase: 'UNPAID',
        isEligible: false,
        messageBn: 'পরীক্ষার পূর্ণ ফি পরিশোধ করা হয়নি। ফি পরিশোধ ও যাচাই সম্পন্ন হলে অ্যাডমিট কার্ড পাওয়া যাবে।',
        messageEn: 'Your examination fee has not been fully paid. Your admit card will become available after complete payment and verification.',
        feeRequired,
        feePaid,
        paymentStatus: 'unpaid',
        clearanceStatus,
        admitCardRef,
      };
    }
  }

  // Condition 5: Administrator approved clearance
  if (clearanceStatus !== 'approved') {
    return {
      canAccess: false,
      accessCase: 'CLEARANCE_PENDING',
      isEligible: false,
      messageBn: 'আপনার পেমেন্ট যাচাই হয়েছে। অ্যাডমিট কার্ডের জন্য অ্যাডমিন ক্লিয়ারেন্স অপেক্ষমাণ।',
      messageEn: 'Your payment has been verified. Your admit card is awaiting administrator clearance.',
      feeRequired,
      feePaid,
      paymentStatus: 'paid',
      clearanceStatus: 'pending',
      admitCardRef,
    };
  }

  // Condition 6: Admit card generated / published
  if (!exam.isAdmitCardPublished) {
    return {
      canAccess: false,
      accessCase: 'UNPUBLISHED',
      isEligible: false,
      messageBn: 'আপনার ক্লিয়ারেন্স অনুমোদিত হয়েছে। তবে কর্তৃপক্ষ এখনও অ্যাডমিট কার্ড প্রকাশ করেননি।',
      messageEn: 'Your clearance has been approved. However, admit cards have not yet been published by the administration.',
      feeRequired,
      feePaid,
      paymentStatus: 'paid',
      clearanceStatus: 'approved',
      admitCardRef,
    };
  }

  // Case D: ALL 6 conditions passed!
  return {
    canAccess: true,
    accessCase: 'APPROVED',
    isEligible: true,
    messageBn: 'আপনার অ্যাডমিট কার্ড প্রস্তুত। আপনি এখন এটি দেখতে, ডাউনলোড ও প্রিন্ট করতে পারবেন।',
    messageEn: 'Your admit card is ready. You can now view, download, and print it.',
    feeRequired,
    feePaid,
    paymentStatus: 'paid',
    clearanceStatus: 'approved',
    admitCardRef,
  };
}
