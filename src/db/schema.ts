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
  fulfillmentStatus: text('fulfillment_status')
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

export const stocks = pgTable('stocks', {
  id: text('id').primaryKey(),
  productImage: text('product_image'),
  buyingPrice: numeric('buying_price').notNull(),
  stockCount: numeric('stock_count').notNull(),
  sellingPrice: numeric('selling_price').notNull(),
  productId: text('product_id'),
  totalPurchaseAmount: numeric('total_purchase_amount').notNull(),
  expectedReturn: numeric('expected_return').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdById: text('created_by_id').references(() => users.id).notNull(),
  updatedById: text('updated_by_id').references(() => users.id),
});
