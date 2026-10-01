export interface Partner {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  equityPercentage: string;
  status: string; // 'ACTIVE' | 'INACTIVE'
  joinedDate?: string | null;
  notes?: string | null;
  totalInvested: number;
  totalWithdrawn: number;
  totalPayout: number;
  totalProfitShare: number;
  netCapital: number;
  transactionCount: number;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
}

export type TransactionType = 'INVESTMENT' | 'WITHDRAWAL' | 'PROFIT_SHARE' | 'PAYOUT';

export interface PartnerTransaction {
  id: string;
  partnerId: string;
  partnerName?: string;
  partnerEmail?: string | null;
  type: TransactionType;
  amount: string;
  transactionDate: string;
  paymentMethodId?: string | null;
  paymentMethodName?: string | null;
  status: string;
  referenceNumber?: string | null;
  notes?: string | null;
  createdById?: string;
  creatorName?: string | null;
  createdAt: string;
}

export interface SummaryData {
  totalInvested: number;
  totalWithdrawn: number;
  totalPayouts: number;
  totalProfitShare: number;
  netActiveCapitalPool: number;
  totalAllocatedEquity: number;
  partnerCount: number;
  activePartnerCount: number;
  transactionCount: number;
}
