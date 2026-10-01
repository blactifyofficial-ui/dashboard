export interface MonthlyExpenseEntry {
  id: string;
  month: string;
  templateId?: string | null;
  name: string;
  category: string;
  expectedAmount: string;
  actualAmount: string;
  dueDay?: string | null;
  status: 'PENDING' | 'PAID' | 'SKIPPED';
  paidDate?: string | null;
  paymentMethodId?: string | null;
  paymentMethodName?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  expenseId?: string | null;
  paidById?: string | null;
  paidByName?: string | null;
  displayOrder: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyExpenseTemplate {
  id: string;
  name: string;
  defaultAmount: string;
  dueDay: string;
  category: string;
  paymentMethodId?: string | null;
  notes?: string | null;
  isActive: string;
  displayOrder: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthMeta {
  month: string; // 'YYYY-MM'
  label: string; // 'March 2026'
  year: number;
  monthNum: number;
  isUnlocked: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  isPast: boolean;
  unlockNotice?: string;
  totalItems?: number;
  paidItems?: number;
  totalExpected?: number;
  totalPaid?: number;
  isCompleted?: boolean;
}

export interface MonthSettings {
  month: string;
  budgetLimit?: string | null;
  notes?: string | null;
  isUnlockedManual?: string;
  updatedAt?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
}

export interface MonthlyStats {
  totalItems: number;
  paidCount: number;
  pendingCount: number;
  totalExpected: number;
  totalPaid: number;
  totalPending: number;
  progressPercentage: number;
}
