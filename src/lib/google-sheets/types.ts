export type SyncEntity =
  | 'orders'
  | 'order_items'
  | 'expenses'
  | 'expense_attachments'
  | 'monthly_expenses'
  | 'monthly_expense_templates'
  | 'meta_ads'
  | 'partners'
  | 'partner_transactions'
  | 'payouts'
  | 'order_issues';

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'FULL_SYNC';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED';

export interface GoogleSheetsCredentials {
  spreadsheetId: string;
  clientEmail?: string;
  privateKey?: string;
  isConfigured: boolean;
}

export interface BackupLogEntry {
  timestamp: Date | string;
  entity: string;
  databaseId: string;
  operation: SyncOperation | string;
  status: SyncStatus | 'SUCCESS' | 'FAILED';
  attempt: number | string;
  error?: string | null;
}

export interface SyncResult {
  success: boolean;
  entity?: string;
  databaseId?: string;
  operation?: SyncOperation;
  error?: string;
  rowsAffected?: number;
}

export interface FullSyncEntityStats {
  entity: string;
  tabName: string;
  count: number;
  success: boolean;
  error?: string;
}

export interface FullSyncStats {
  success: boolean;
  entities: FullSyncEntityStats[];
  totalRecords: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  error?: string;
}

export interface ConnectionStatusResult {
  connected: boolean;
  spreadsheetId: string;
  spreadsheetTitle?: string;
  sheetNames?: string[];
  lastSuccessfulSync?: string | null;
  pendingSyncsCount: number;
  failedSyncsCount: number;
  error?: string | null;
}
