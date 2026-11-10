export type SavingsDestination =
  | 'BANK_ACCOUNT'
  | 'CASH'
  | 'EMERGENCY_FUND'
  | 'INVESTMENT';

export const SAVINGS_DESTINATIONS: { value: SavingsDestination; label: string; icon: string; color: string }[] = [
  { value: 'BANK_ACCOUNT', label: 'Bank Account', icon: '🏦', color: 'blue' },
  { value: 'CASH', label: 'Cash / Vault', icon: '💵', color: 'emerald' },
  { value: 'EMERGENCY_FUND', label: 'Emergency Fund', icon: '🛡️', color: 'amber' },
  { value: 'INVESTMENT', label: 'Investment / Gold', icon: '📈', color: 'purple' },
];

export interface DailySavingEntry {
  id: string;
  date: string; // 'YYYY-MM-DD'
  amount: string;
  targetAmount?: string | null;
  destination: SavingsDestination;
  paymentMethodId?: string | null;
  paymentMethodName?: string | null;
  note?: string | null;
  expenseId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsSummary {
  totalSaved: number;
  monthlyTarget: number;
  dailyTarget: number;
  daysSaved: number;
  daysInMonth: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  averageDaily: number;
  destinations: Record<string, number>;
}

export interface DailySavingsSettings {
  id: string;
  dailyTarget: string;
  monthlyTarget: string;
  mirrorToExpenses: string;
  expenseCategoryId?: string | null;
  currency: string;
  updatedAt?: string;
}

export interface PaymentMethodOption {
  id: string;
  name: string;
  code: string;
}

