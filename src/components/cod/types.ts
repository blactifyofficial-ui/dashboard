import { CodRemittanceRecord, CodOrderBrief, CodStats } from '@/lib/cod-service';

export type { CodRemittanceRecord, CodOrderBrief, CodStats };

// Alias for convenience
export type CodOrderRecord = CodOrderBrief;

export interface PaymentMethodOption {
  id: string;
  name: string;
  code: string;
}
