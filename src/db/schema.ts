import { pgTable, text, timestamp, numeric } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  shopifyOrderId: text('shopify_order_id').notNull().unique(),
  orderNumber: text('order_number'),
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  totalPrice: numeric('total_price'),
  totalOutstanding: numeric('total_outstanding'),
  currency: text('currency'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  financialStatus: text('financial_status'),
  fulfillmentStatus: text('fulfillment_status'),
  paymentGateway: text('payment_gateway'),
  trackingId: text('tracking_id'),
  trackingCompany: text('tracking_company'),
  trackingUrl: text('tracking_url'),
  courier: text('courier'),
  codStatus: text('cod_status').default('PENDING'),
  codCollectedAmount: numeric('cod_collected_amount'),
  codCollectedAt: timestamp('cod_collected_at', { withTimezone: true }),
  codPaymentMethodId: text('cod_payment_method_id').references(() => paymentMethods.id),
  codRemittanceRef: text('cod_remittance_ref'),
  codNotes: text('cod_notes'),
  codCollectedById: text('cod_collected_by_id').references(() => users.id),
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  shopifyProductId: text('shopify_product_id'),
  title: text('title'),
  quantity: numeric('quantity'),
  price: numeric('price'),
  imageUrl: text('image_url'),
});

export const userRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'PARTNER', 'VIEWER'] as const;
export type SystemUserRole = typeof userRoles[number];
export type UserRole = SystemUserRole | (string & {});

export const allowedUsers = pgTable('allowed_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').$type<UserRole>().default('VIEWER').notNull(),
  partnerId: text('partner_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customRoles = pgTable('custom_roles', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  permissions: text('permissions').notNull(), // JSON array string e.g. ["overview:view_orders"]
  color: text('color').default('blue').notNull(),
  isSystem: text('is_system').default('false').notNull(),
  createdById: text('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
});

export const expenseCategories = pgTable('expense_categories', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull().unique(),
  description: text('description'),
  isActive: text('is_active').default('true'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentMethods = pgTable('payment_methods', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull().unique(),
  isActive: text('is_active').default('true'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').references(() => expenseCategories.id).notNull(),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  amount: numeric('amount').notNull(),
  expenseDate: timestamp('expense_date').notNull(),
  referenceNumber: text('reference_number'),
  createdById: text('created_by_id').references(() => users.id).notNull(),
  updatedById: text('updated_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  deletedById: text('deleted_by_id').references(() => users.id),
});

export const expenseAttachments = pgTable('expense_attachments', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').references(() => expenses.id).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: numeric('file_size').notNull(),
  uploadedById: text('uploaded_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expenseActivities = pgTable('expense_activities', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').references(() => expenses.id).notNull(),
  actorId: text('actor_id').references(() => users.id).notNull(),
  activityType: text('activity_type').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const expenseDateNotes = pgTable('expense_date_notes', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(),
  note: text('note').notNull(),
  createdById: text('created_by_id').references(() => users.id),
  updatedById: text('updated_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const metaAdsSettings = pgTable('meta_ads_settings', {
  id: text('id').primaryKey(),
  dailyBudget: numeric('daily_budget').notNull().default('0'),
  days: numeric('days').default('7').notNull(),
  weeklyBudget: numeric('weekly_budget').notNull().default('0'),
  currency: text('currency').default('INR').notNull(),
  notes: text('notes'),
  updatedById: text('updated_by_id').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const metaAdsTransactions = pgTable('meta_ads_transactions', {
  id: text('id').primaryKey(),
  weekStartDate: timestamp('week_start_date').notNull(),
  weekEndDate: timestamp('week_end_date').notNull(),
  dailyBudget: numeric('daily_budget').notNull(),
  calculatedWeeklyBudget: numeric('calculated_weekly_budget').notNull(),
  amountPaid: numeric('amount_paid').notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id).notNull(),
  status: text('status').notNull().default('PAID'),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  expenseId: text('expense_id').references(() => expenses.id),
  createdById: text('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const metaAdsDailyPlans = pgTable('meta_ads_daily_plans', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(), // 'YYYY-MM-DD'
  totalBudget: numeric('total_budget').notNull().default('0'),
  campaignCount: numeric('campaign_count').notNull().default('1'),
  distributionMode: text('distribution_mode').notNull().default('ALL_SAME'), // 'ALL_SAME' | 'DIFFERENT'
  campaigns: text('campaigns').notNull().default('[]'), // JSON Array string: Array<{ id: string, name: string, budget: number, status?: string }>
  status: text('status').notNull().default('IN_PROGRESS'), // 'IN_PROGRESS' | 'DONE' | 'NOT_DONE'
  notes: text('notes'),
  createdById: text('created_by_id').references(() => users.id),
  updatedById: text('updated_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const partners = pgTable('partners', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  equityPercentage: numeric('equity_percentage').default('0').notNull(),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE', 'INACTIVE'
  joinedDate: timestamp('joined_date').defaultNow(),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const partnerTransactions = pgTable('partner_transactions', {
  id: text('id').primaryKey(),
  partnerId: text('partner_id').references(() => partners.id).notNull(),
  type: text('type').notNull(), // 'INVESTMENT', 'WITHDRAWAL', 'PROFIT_SHARE', 'PAYOUT'
  amount: numeric('amount').notNull(),
  transactionDate: timestamp('transaction_date').notNull(),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
  status: text('status').default('COMPLETED').notNull(), // 'COMPLETED', 'PENDING', 'CANCELLED'
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const monthlyExpenseTemplates = pgTable('monthly_expense_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  defaultAmount: numeric('default_amount').default('0').notNull(),
  dueDay: numeric('due_day').default('5').notNull(),
  category: text('category').default('OPERATIONAL').notNull(),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
  notes: text('notes'),
  isActive: text('is_active').default('true').notNull(),
  displayOrder: numeric('display_order').default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const monthlyExpenseEntries = pgTable('monthly_expense_entries', {
  id: text('id').primaryKey(),
  month: text('month').notNull(), // 'YYYY-MM', e.g. '2026-03'
  templateId: text('template_id').references(() => monthlyExpenseTemplates.id),
  name: text('name').notNull(),
  category: text('category').default('OPERATIONAL').notNull(),
  expectedAmount: numeric('expected_amount').default('0').notNull(),
  actualAmount: numeric('actual_amount').default('0'),
  dueDay: numeric('due_day'),
  status: text('status').default('PENDING').notNull(), // 'PENDING', 'PAID', 'SKIPPED'
  paidDate: timestamp('paid_date'),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  expenseId: text('expense_id').references(() => expenses.id),
  paidById: text('paid_by_id').references(() => users.id),
  createdById: text('created_by_id').references(() => users.id),
  displayOrder: numeric('display_order').default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const monthlyExpenseMonthSettings = pgTable('monthly_expense_month_settings', {
  month: text('month').primaryKey(), // 'YYYY-MM', e.g. '2026-03'
  budgetLimit: numeric('budget_limit'),
  notes: text('notes'),
  isUnlockedManual: text('is_unlocked_manual').default('false'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const googleSheetsSyncQueue = pgTable('google_sheets_sync_queue', {
  id: text('id').primaryKey(),
  entity: text('entity').notNull(),
  databaseId: text('database_id').notNull(),
  operation: text('operation').notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'FULL_SYNC'
  payload: text('payload'),
  status: text('status').notNull().default('PENDING'), // 'PENDING', 'SYNCING', 'SUCCESS', 'FAILED'
  attempts: numeric('attempts').notNull().default('0'),
  maxAttempts: numeric('max_attempts').notNull().default('5'),
  lastAttemptAt: timestamp('last_attempt_at'),
  nextRetryAt: timestamp('next_retry_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const codCollectionActivities = pgTable('cod_collection_activities', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  actorId: text('actor_id').references(() => users.id),
  action: text('action').notNull(), // 'MARKED_COLLECTED' | 'REVERTED_PENDING' | 'UPDATED_DETAILS' | 'MARKED_RTO'
  amount: numeric('amount'),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
  remittanceRef: text('remittance_ref'),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const codRemittances = pgTable('cod_remittances', {
  id: text('id').primaryKey(),
  amount: numeric('amount').notNull(),
  receivedDate: timestamp('received_date', { withTimezone: true }).notNull(),
  courier: text('courier'),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
  referenceNumber: text('reference_number'),
  ordersCount: numeric('orders_count'),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const monthlyFinancialReports = pgTable('monthly_financial_reports', {
  id: text('id').primaryKey(), // 'rep_YYYY_MM'
  month: text('month').notNull().unique(), // 'YYYY-MM'
  year: numeric('year').notNull(),
  monthNumber: numeric('month_number').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  status: text('status').default('COMPLETED').notNull(), // 'COMPLETED', 'DRAFT'
  totalRevenue: numeric('total_revenue').default('0').notNull(),
  totalExpenses: numeric('total_expenses').default('0').notNull(),
  netProfit: numeric('net_profit').default('0').notNull(),
  profitMargin: numeric('profit_margin').default('0').notNull(),
  totalOrders: numeric('total_orders').default('0').notNull(),
  aov: numeric('aov').default('0').notNull(),
  prepaidRevenue: numeric('prepaid_revenue').default('0').notNull(),
  prepaidOrdersCount: numeric('prepaid_orders_count').default('0').notNull(),
  codRevenue: numeric('cod_revenue').default('0').notNull(),
  codOrdersCount: numeric('cod_orders_count').default('0').notNull(),
  codCollectedAmount: numeric('cod_collected_amount').default('0').notNull(),
  codPendingAmount: numeric('cod_pending_amount').default('0').notNull(),
  operationalExpenses: numeric('operational_expenses').default('0').notNull(),
  monthlyBillsAmount: numeric('monthly_bills_amount').default('0').notNull(),
  adSpendAmount: numeric('ad_spend_amount').default('0').notNull(),
  summaryData: text('summary_data').notNull(), // JSON detailed breakdowns
  emailSentAt: timestamp('email_sent_at', { withTimezone: true }),
  emailRecipients: text('email_recipients'),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => users.id),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const debtContacts = pgTable('debt_contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  category: text('category').default('GENERAL').notNull(), // 'BUSINESS', 'PERSONAL', 'VENDOR', 'PARTNER', 'EMERGENCY', etc.
  notes: text('notes'),
  createdById: text('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const debts = pgTable('debts', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'BORROWED' | 'LENT'
  contactId: text('contact_id').references(() => debtContacts.id, { onDelete: 'set null' }),
  contactName: text('contact_name').notNull(),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  category: text('category').default('GENERAL').notNull(), // 'BUSINESS', 'PERSONAL', 'VENDOR', 'PARTNER', 'EMERGENCY', etc.
  amount: numeric('amount').notNull(), // Original principal
  remainingAmount: numeric('remaining_amount').notNull(), // Outstanding balance
  transactionDate: timestamp('transaction_date', { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE', 'PARTIALLY_SETTLED', 'SETTLED', 'CANCELLED'
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => users.id),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const debtSettlements = pgTable('debt_settlements', {
  id: text('id').primaryKey(),
  debtId: text('debt_id').references(() => debts.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount').notNull(),
  settlementDate: timestamp('settlement_date', { withTimezone: true }).defaultNow().notNull(),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  expenseId: text('expense_id').references(() => expenses.id),
  createdById: text('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dailySavings = pgTable('daily_savings', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(), // 'YYYY-MM-DD'
  amount: numeric('amount').notNull(),
  targetAmount: numeric('target_amount').default('0'),
  destination: text('destination').default('BANK_ACCOUNT').notNull(), // 'BANK_ACCOUNT', 'CASH', 'EMERGENCY_FUND', 'INVESTMENT'
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
  note: text('note'),
  expenseId: text('expense_id').references(() => expenses.id),
  createdById: text('created_by_id').references(() => users.id),
  updatedById: text('updated_by_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dailySavingsSettings = pgTable('daily_savings_settings', {
  id: text('id').primaryKey().default('default'),
  dailyTarget: numeric('daily_target').default('500').notNull(),
  monthlyTarget: numeric('monthly_target').default('15000').notNull(),
  mirrorToExpenses: text('mirror_to_expenses').default('false').notNull(),
  expenseCategoryId: text('expense_category_id').references(() => expenseCategories.id),
  currency: text('currency').default('INR').notNull(),
  updatedById: text('updated_by_id').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});





