import { pgTable, text, timestamp, numeric } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  shopifyOrderId: text('shopify_order_id').notNull().unique(),
  orderNumber: text('order_number'),
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  totalPrice: numeric('total_price'),
  currency: text('currency'),
  createdAt: timestamp('created_at').defaultNow(),
  financialStatus: text('financial_status'),
  fulfillmentStatus: text('fulfillment_status'),
  trackingId: text('tracking_id')
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  shopifyProductId: text('shopify_product_id'),
  title: text('title'),
  quantity: numeric('quantity'),
  price: numeric('price'),
  imageUrl: text('image_url'),
});

export const allowedUsers = pgTable('allowed_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
});

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
});

export const issueCategories = pgTable('issue_categories', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull().unique(),
  description: text('description'),
  isActive: text('is_active').default('true'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderIssues = pgTable('order_issues', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  categoryId: text('category_id').references(() => issueCategories.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(), // OPEN, IN_PROGRESS, WAITING, RESOLVED, CLOSED, CANCELLED
  priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, URGENT
  assignedToId: text('assigned_to_id').references(() => users.id),
  createdById: text('created_by_id').references(() => users.id).notNull(),
  resolvedById: text('resolved_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  closedAt: timestamp('closed_at'),
});

export const orderIssueActivities = pgTable('order_issue_activities', {
  id: text('id').primaryKey(),
  issueId: text('issue_id').references(() => orderIssues.id).notNull(),
  actorId: text('actor_id').references(() => users.id).notNull(),
  activityType: text('activity_type').notNull(),
  oldStatus: text('old_status'),
  newStatus: text('new_status'),
  oldPriority: text('old_priority'),
  newPriority: text('new_priority'),
  oldAssignedToId: text('old_assigned_to_id').references(() => users.id),
  newAssignedToId: text('new_assigned_to_id').references(() => users.id),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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


export const inventory = pgTable('inventory', {
  id: text('id').primaryKey(),
  shopifyProductId: text('shopify_product_id').notNull().unique(),
  title: text('title').notNull(),
  sku: text('sku'),
  inventoryQuantity: numeric('inventory_quantity').notNull().default('0'),
  price: numeric('price'),
  imageUrl: text('image_url'),
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


