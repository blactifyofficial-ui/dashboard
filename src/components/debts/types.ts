export type DebtType = 'BORROWED' | 'LENT';

export type DebtStatus = 'ACTIVE' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'OVERDUE' | 'CANCELLED';

export interface DebtContact {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  category: string;
  notes?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  activeLent?: number;
  activeBorrowed?: number;
  netBalance?: number;
  openDebtCount?: number;
}

export interface Debt {
  id: string;
  type: DebtType;
  contactId?: string | null;
  contactName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  category: string;
  amount: string;
  remainingAmount: string;
  transactionDate: string;
  dueDate?: string | null;
  paymentMethodId?: string | null;
  paymentMethodName?: string | null;
  status: DebtStatus;
  computedStatus: string;
  isOverdue: boolean;
  settlementCount: number;
  referenceNumber?: string | null;
  notes?: string | null;
  createdById?: string | null;
  creatorName?: string | null;
  settledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DebtSettlement {
  id: string;
  debtId: string;
  amount: string;
  settlementDate: string;
  paymentMethodId?: string | null;
  paymentMethodName?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  expenseId?: string | null;
  createdById?: string | null;
  creatorName?: string | null;
  createdAt: string;
}

export interface DebtsSummary {
  totalLentPrincipal: number;
  totalLentOutstanding: number;
  borrowerCount: number;
  totalBorrowedPrincipal: number;
  totalBorrowedOutstanding: number;
  lenderCount: number;
  netPosition: number;
  overdueCount: number;
  overdueAmount: number;
  activeCount: number;
  settledCount: number;
  totalCount: number;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
}

export interface DebtFormData {
  type: DebtType;
  contactId?: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  category: string;
  amount: string;
  transactionDate: string;
  dueDate: string;
  paymentMethodId: string;
  referenceNumber?: string;
  notes: string;
  recordAsExpense: boolean;
}

export interface SettlementFormData {
  amount: string;
  settlementDate: string;
  paymentMethodId: string;
  referenceNumber?: string;
  notes: string;
  recordAsExpense: boolean;
}

