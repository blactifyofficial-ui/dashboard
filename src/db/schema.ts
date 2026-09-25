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
