import { SyncEntity, BackupLogEntry } from './types';

/**
 * Tab definitions and headers for all synchronized business entities
 */
export const SHEET_TABS = {
  ORDERS: 'Orders',
  ORDER_ITEMS: 'Order Items',
  EXPENSES: 'Expenses',
  EXPENSE_ATTACHMENTS: 'Expense Attachments',
  MONTHLY_EXPENSES: 'Monthly Expenses',
  MONTHLY_EXPENSE_TEMPLATES: 'Monthly Expense Templates',
  META_ADS: 'Meta Ads',
  PARTNERS: 'Partners',
  PARTNER_TRANSACTIONS: 'Partner Transactions',
  PAYOUTS: 'Payouts',
  ORDER_ISSUES: 'Order Issues',
  BACKUP_LOG: 'Backup Log',
} as const;

export const SHEET_HEADERS: Record<string, string[]> = {
  [SHEET_TABS.ORDERS]: [
    'ID',
    'Shopify Order ID',
    'Order Number',
    'Customer Name',
    'Customer Email',
    'Total Price',
    'Currency',
    'Financial Status',
    'Fulfillment Status',
    'Tracking ID',
    'Created At',
    'Sync Status',
  ],
  [SHEET_TABS.ORDER_ITEMS]: [
    'ID',
    'Order ID',
    'Shopify Product ID',
    'Title',
    'Quantity',
    'Price',
    'Image URL',
    'Sync Status',
  ],
  [SHEET_TABS.EXPENSES]: [
    'ID',
    'Expense Date',
    'Title',
    'Description',
    'Category',
    'Payment Method',
    'Amount',
    'Reference Number',
    'Created By',
    'Created At',
    'Updated At',
    'Deleted At',
    'Sync Status',
  ],
  [SHEET_TABS.EXPENSE_ATTACHMENTS]: [
    'ID',
    'Expense ID',
    'File Name',
    'File URL',
    'File Type',
    'File Size (Bytes)',
    'Uploaded By',
    'Created At',
    'Sync Status',
  ],
  [SHEET_TABS.MONTHLY_EXPENSES]: [
    'ID',
    'Month',
    'Template Name',
    'Name',
    'Category',
    'Expected Amount',
    'Actual Amount',
    'Due Day',
    'Status',
    'Paid Date',
    'Payment Method',
    'Reference Number',
    'Notes',
    'Linked Expense ID',
    'Paid By',
    'Created At',
    'Updated At',
    'Sync Status',
  ],
  [SHEET_TABS.MONTHLY_EXPENSE_TEMPLATES]: [
    'ID',
    'Name',
    'Default Amount',
    'Due Day',
    'Category',
    'Payment Method',
    'Active',
    'Display Order',
    'Notes',
    'Created At',
    'Updated At',
    'Sync Status',
  ],
  [SHEET_TABS.META_ADS]: [
    'ID',
    'Week Start Date',
    'Week End Date',
    'Daily Budget',
    'Calculated Weekly Budget',
    'Amount Paid',
    'Payment Date',
    'Payment Method',
    'Status',
    'Reference Number',
    'Notes',
    'Linked Expense ID',
    'Created By',
    'Created At',
    'Updated At',
    'Sync Status',
  ],
  [SHEET_TABS.PARTNERS]: [
    'ID',
    'Name',
    'Email',
    'Phone',
    'Equity Percentage',
    'Status',
    'Joined Date',
    'Notes',
    'Created At',
    'Updated At',
    'Sync Status',
  ],
  [SHEET_TABS.PARTNER_TRANSACTIONS]: [
    'ID',
    'Partner ID',
    'Partner Name',
    'Type',
    'Amount',
    'Transaction Date',
    'Payment Method',
    'Status',
    'Reference Number',
    'Notes',
    'Created By',
    'Created At',
    'Updated At',
    'Sync Status',
  ],
  [SHEET_TABS.PAYOUTS]: [
    'ID',
    'Partner ID',
    'Partner Name',
    'Type',
    'Amount',
    'Transaction Date',
    'Payment Method',
    'Status',
    'Reference Number',
    'Notes',
    'Created By',
    'Created At',
    'Updated At',
    'Sync Status',
  ],
  [SHEET_TABS.ORDER_ISSUES]: [
    'ID',
    'Order ID',
    'Order Number',
    'Customer Name',
    'Category',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Assigned To',
    'Created By',
    'Resolved By',
    'Created At',
    'Updated At',
    'Resolved At',
    'Closed At',
    'Sync Status',
  ],
  [SHEET_TABS.BACKUP_LOG]: [
    'Timestamp',
    'Entity',
    'Database ID',
    'Operation',
    'Status',
    'Attempt',
    'Error',
  ],
};

/**
 * Format a Date or ISO date string for Google Sheets readable output
 */
export function formatDate(val?: Date | string | null, dateOnly: boolean = false): string {
  if (!val) return '';
  const d = typeof val === 'string' ? new Date(val) : val;
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());

  if (dateOnly) {
    return `${year}-${month}-${day}`;
  }

  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formats numeric fields as numbers so Google Sheets can perform mathematical calculations
 */
export function formatNumeric(val?: number | string | null): number | '' {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(num) ? '' : num;
}

export function formatString(val?: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Map individual entity records to Google Sheets row arrays
 */
export const RowMapper = {
  order(row: Record<string, unknown>, isDeleted: boolean = false): (string | number)[] {
    return [
      formatString(row.id),
      formatString(row.shopifyOrderId),
      formatString(row.orderNumber),
      formatString(row.customerName),
      formatString(row.customerEmail),
      formatNumeric(row.totalPrice as number | string),
      formatString(row.currency || 'INR'),
      formatString(row.financialStatus),
      formatString(row.fulfillmentStatus),
      formatString(row.trackingId),
      formatDate(row.createdAt as Date | string),
      isDeleted ? 'DELETED' : 'ACTIVE',
    ];
  },

  orderItem(row: Record<string, unknown>, isDeleted: boolean = false): (string | number)[] {
    return [
      formatString(row.id),
      formatString(row.orderId),
      formatString(row.shopifyProductId),
      formatString(row.title),
      formatNumeric(row.quantity as number | string),
      formatNumeric(row.price as number | string),
      formatString(row.imageUrl),
      isDeleted ? 'DELETED' : 'ACTIVE',
    ];
  },

  expense(row: Record<string, unknown>, isDeleted: boolean = false): (string | number)[] {
    const deleted = isDeleted || Boolean(row.deletedAt);
    return [
      formatString(row.id),
      formatDate(row.expenseDate as Date | string, true),
      formatString(row.title),
      formatString(row.description),
      formatString(row.categoryName || row.category || row.categoryId),
      formatString(row.paymentMethodName || row.paymentMethod || row.paymentMethodId),
      formatNumeric(row.amount as number | string),
      formatString(row.referenceNumber),
      formatString(row.creatorName || row.createdById),
      formatDate(row.createdAt as Date | string),
      formatDate(row.updatedAt as Date | string),
      formatDate(row.deletedAt as Date | string),
      deleted ? 'DELETED' : 'ACTIVE',
    ];
  },

  expenseAttachment(row: Record<string, unknown>, isDeleted: boolean = false): (string | number)[] {
    return [
      formatString(row.id),
      formatString(row.expenseId),
      formatString(row.fileName),
      formatString(row.fileUrl),
      formatString(row.fileType),
      formatNumeric(row.fileSize as number | string),
      formatString(row.uploaderName || row.uploadedById),
      formatDate(row.createdAt as Date | string),
      isDeleted ? 'DELETED' : 'ACTIVE',
    ];
  },

  monthlyExpenseEntry(row: Record<string, unknown>, isDeleted: boolean = false): (string | number)[] {
    const rawMonth = formatString(row.month);
    // Prefix with single quote so Google Sheets treats YYYY-MM strictly as plain text instead of date serial
    const monthStr = rawMonth ? `'${rawMonth.replace(/^'+/, '')}` : '';
    return [
      formatString(row.id),
      monthStr,
      formatString(row.templateName || row.templateId),
      formatString(row.name),
      formatString(row.category),
      formatNumeric(row.expectedAmount as number | string),
      formatNumeric(row.actualAmount as number | string),
      formatNumeric(row.dueDay as number | string),
      formatString(row.status),
      formatDate(row.paidDate as Date | string, true),
      formatString(row.paymentMethodName || row.paymentMethodId),
      formatString(row.referenceNumber),
      formatString(row.notes),
      formatString(row.expenseId),
      formatString(row.paidByName || row.paidById),
      formatDate(row.createdAt as Date | string),
      formatDate(row.updatedAt as Date | string),
      isDeleted ? 'DELETED' : 'ACTIVE',
    ];
  },

  monthlyExpenseTemplate(row: Record<string, unknown>, isDeleted: boolean = false): (string | number)[] {
    return [
      formatString(row.id),
      formatString(row.name),
      formatNumeric(row.defaultAmount as number | string),
      formatNumeric(row.dueDay as number | string),
      formatString(row.category),
      formatString(row.paymentMethodName || row.paymentMethodId),
      formatString(row.isActive),
      formatNumeric(row.displayOrder as number | string),
      formatString(row.notes),
      formatDate(row.createdAt as Date | string),
      formatDate(row.updatedAt as Date | string),
      isDeleted ? 'DELETED' : 'ACTIVE',
    ];
  },

  metaAdsTransaction(row: Record<string, unknown>, isDeleted: boolean = false): (string | number)[] {
    return [
      formatString(row.id),
      formatDate(row.weekStartDate as Date | string, true),
      formatDate(row.weekEndDate as Date | string, true),
      formatNumeric(row.dailyBudget as number | string),
      formatNumeric(row.calculatedWeeklyBudget as number | string),
      formatNumeric(row.amountPaid as number | string),
      formatDate(row.paymentDate as Date | string, true),
      formatString(row.paymentMethodName || row.paymentMethodId),
      formatString(row.status),
      formatString(row.referenceNumber),
      formatString(row.notes),
      formatString(row.expenseId),
      formatString(row.creatorName || row.createdById),
      formatDate(row.createdAt as Date | string),
      formatDate(row.updatedAt as Date | string),
      isDeleted ? 'DELETED' : 'ACTIVE',
    ];
  },

  partner(row: Record<string, unknown>, isDeleted: boolean = false): (string | number)[] {
    return [
      formatString(row.id),
      formatString(row.name),
      formatString(row.email),
      formatString(row.phone),
      formatNumeric(row.equityPercentage as number | string),
      formatString(row.status),
      formatDate(row.joinedDate as Date | string, true),
      formatString(row.notes),
      formatDate(row.createdAt as Date | string),
      formatDate(row.updatedAt as Date | string),
      isDeleted ? 'DELETED' : 'ACTIVE',
    ];
  },

  partnerTransaction(row: Record<string, unknown>, isDeleted: boolean = false): (string | number)[] {
    return [
      formatString(row.id),
      formatString(row.partnerId),
      formatString(row.partnerName),
      formatString(row.type),
      formatNumeric(row.amount as number | string),
      formatDate(row.transactionDate as Date | string, true),
      formatString(row.paymentMethodName || row.paymentMethodId),
      formatString(row.status),
      formatString(row.referenceNumber),
      formatString(row.notes),
      formatString(row.creatorName || row.createdById),
      formatDate(row.createdAt as Date | string),
      formatDate(row.updatedAt as Date | string),
      isDeleted ? 'DELETED' : 'ACTIVE',
    ];
  },

  orderIssue(row: Record<string, unknown>, isDeleted: boolean = false): (string | number)[] {
    return [
      formatString(row.id),
      formatString(row.orderId),
      formatString(row.orderNumber),
      formatString(row.customerName),
      formatString(row.categoryName || row.categoryId),
      formatString(row.title),
      formatString(row.description),
      formatString(row.status),
      formatString(row.priority),
      formatString(row.assignedToName || row.assignedToId),
      formatString(row.creatorName || row.createdById),
      formatString(row.resolverName || row.resolvedById),
      formatDate(row.createdAt as Date | string),
      formatDate(row.updatedAt as Date | string),
      formatDate(row.resolvedAt as Date | string),
      formatDate(row.closedAt as Date | string),
      isDeleted ? 'DELETED' : 'ACTIVE',
    ];
  },

  backupLog(entry: BackupLogEntry): (string | number)[] {
    return [
      formatDate(entry.timestamp),
      formatString(entry.entity),
      formatString(entry.databaseId),
      formatString(entry.operation),
      formatString(entry.status),
      formatNumeric(entry.attempt),
      formatString(entry.error),
    ];
  },
};

/**
 * Returns corresponding tab name for a given sync entity
 */
export function getTabNameForEntity(entity: SyncEntity): string {
  switch (entity) {
    case 'orders':
      return SHEET_TABS.ORDERS;
    case 'order_items':
      return SHEET_TABS.ORDER_ITEMS;
    case 'expenses':
      return SHEET_TABS.EXPENSES;
    case 'expense_attachments':
      return SHEET_TABS.EXPENSE_ATTACHMENTS;
    case 'monthly_expenses':
      return SHEET_TABS.MONTHLY_EXPENSES;
    case 'monthly_expense_templates':
      return SHEET_TABS.MONTHLY_EXPENSE_TEMPLATES;
    case 'meta_ads':
      return SHEET_TABS.META_ADS;
    case 'partners':
      return SHEET_TABS.PARTNERS;
    case 'partner_transactions':
      return SHEET_TABS.PARTNER_TRANSACTIONS;
    case 'payouts':
      return SHEET_TABS.PAYOUTS;
    case 'order_issues':
      return SHEET_TABS.ORDER_ISSUES;
    default:
      return entity;
  }
}
