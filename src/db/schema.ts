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
});

export const allowedUsers = pgTable('allowed_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
});
