-- ==============================================================================
-- SHOPIFY OPERATIONS & FINANCIAL INTELLIGENCE DASHBOARD
-- PostgreSQL Database Schema (database.sql)
-- Target Database: Neon Serverless PostgreSQL / Standard PostgreSQL 14+
-- ==============================================================================

-- Enable UUID extension if needed in future
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. USERS & ACCESS CONTROL
-- ==============================================================================

-- System Users (Linked to Neon Auth / Better Auth)
CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "name" TEXT,
    "email" TEXT
);

-- Whitelisted / Allowed Users for Dashboard Access
CREATE TABLE IF NOT EXISTS "allowed_users" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "email" TEXT NOT NULL,
    CONSTRAINT "allowed_users_email_unique" UNIQUE ("email")
);

-- Global Key-Value Application Settings (e.g., revenue_pin, system configs)
CREATE TABLE IF NOT EXISTS "app_settings" (
    "key" TEXT PRIMARY KEY NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 2. ORDERS & ORDER ITEMS (Shopify Ingestion)
-- ==============================================================================

-- Master Orders Table
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "shopify_order_id" TEXT NOT NULL,
    "order_number" TEXT,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "total_price" NUMERIC,
    "currency" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "financial_status" TEXT,
    "fulfillment_status" TEXT,
    "payment_gateway" TEXT,
    "tracking_id" TEXT,
    "tracking_company" TEXT,
    "tracking_url" TEXT,
    CONSTRAINT "orders_shopify_order_id_unique" UNIQUE ("shopify_order_id")
);

-- Order Line Items
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "order_id" TEXT NOT NULL,
    "shopify_product_id" TEXT,
    "title" TEXT,
    "quantity" NUMERIC,
    "price" NUMERIC,
    "image_url" TEXT,
    CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ==============================================================================
-- 3. ORDER ISSUES & AUDIT TRAIL (Support System)
-- ==============================================================================

-- Issue / Ticket Categories
CREATE TABLE IF NOT EXISTS "issue_categories" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" TEXT DEFAULT 'true',
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT "issue_categories_code_unique" UNIQUE ("code"),
    CONSTRAINT "issue_categories_name_unique" UNIQUE ("name")
);

-- Order Issues (Tickets)
CREATE TABLE IF NOT EXISTS "order_issues" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "order_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL, -- 'OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'CANCELLED'
    "priority" TEXT DEFAULT 'MEDIUM' NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    "assigned_to_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "resolved_by_id" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "resolved_at" TIMESTAMP WITHOUT TIME ZONE,
    "closed_at" TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT "order_issues_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_issues_category_id_issue_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "issue_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "order_issues_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "order_issues_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "order_issues_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Order Issue Activities / Timeline Audit Trail
CREATE TABLE IF NOT EXISTS "order_issue_activities" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "issue_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "old_status" TEXT,
    "new_status" TEXT,
    "old_priority" TEXT,
    "new_priority" TEXT,
    "old_assigned_to_id" TEXT,
    "new_assigned_to_id" TEXT,
    "remark" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "order_issue_activities_issue_id_order_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "order_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_issue_activities_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "order_issue_activities_old_assigned_to_id_user_id_fk" FOREIGN KEY ("old_assigned_to_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "order_issue_activities_new_assigned_to_id_user_id_fk" FOREIGN KEY ("new_assigned_to_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ==============================================================================
-- 4. MASTER FINANCIAL CONFIGURATION
-- ==============================================================================

-- Expense Categories
CREATE TABLE IF NOT EXISTS "expense_categories" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" TEXT DEFAULT 'true',
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "expense_categories_code_unique" UNIQUE ("code"),
    CONSTRAINT "expense_categories_name_unique" UNIQUE ("name")
);

-- Payment Methods (Bank Accounts, UPI, Credit Cards, Cash)
CREATE TABLE IF NOT EXISTS "payment_methods" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" TEXT DEFAULT 'true',
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "payment_methods_code_unique" UNIQUE ("code"),
    CONSTRAINT "payment_methods_name_unique" UNIQUE ("name")
);

-- ==============================================================================
-- 5. EXPENSES & EXPENSE ATTACHMENTS
-- ==============================================================================

-- Operational Expenses Register
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "category_id" TEXT NOT NULL,
    "payment_method_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" NUMERIC NOT NULL,
    "expense_date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "reference_number" TEXT,
    "created_by_id" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "deleted_at" TIMESTAMP WITHOUT TIME ZONE,
    "deleted_by_id" TEXT,
    CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "expenses_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "expenses_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "expenses_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "expenses_deleted_by_id_user_id_fk" FOREIGN KEY ("deleted_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Expense File Attachments & Receipts (Cloudinary)
CREATE TABLE IF NOT EXISTS "expense_attachments" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "expense_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" NUMERIC NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "expense_attachments_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "expense_attachments_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- Expense Activities / Audit Trail
CREATE TABLE IF NOT EXISTS "expense_activities" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "expense_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "remark" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "expense_activities_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "expense_activities_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- Expense Date Notes (Daily Journal / Memos)
CREATE TABLE IF NOT EXISTS "expense_date_notes" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "date" TEXT NOT NULL, -- 'YYYY-MM-DD'
    "note" TEXT NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "expense_date_notes_date_unique" UNIQUE ("date"),
    CONSTRAINT "expense_date_notes_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "expense_date_notes_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ==============================================================================
-- 6. META ADS TRACKING & BUDGETING
-- ==============================================================================

-- Meta Ads Global Settings
CREATE TABLE IF NOT EXISTS "meta_ads_settings" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "daily_budget" NUMERIC DEFAULT '0' NOT NULL,
    "days" NUMERIC DEFAULT '7' NOT NULL,
    "weekly_budget" NUMERIC DEFAULT '0' NOT NULL,
    "currency" TEXT DEFAULT 'INR' NOT NULL,
    "notes" TEXT,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "meta_ads_settings_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Meta Ads Weekly Payment Transactions
CREATE TABLE IF NOT EXISTS "meta_ads_transactions" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "week_start_date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "week_end_date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "daily_budget" NUMERIC NOT NULL,
    "calculated_weekly_budget" NUMERIC NOT NULL,
    "amount_paid" NUMERIC NOT NULL,
    "payment_date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "payment_method_id" TEXT NOT NULL,
    "status" TEXT DEFAULT 'PAID' NOT NULL, -- 'PAID', 'PENDING'
    "reference_number" TEXT,
    "notes" TEXT,
    "expense_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "meta_ads_transactions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "meta_ads_transactions_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "meta_ads_transactions_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- ==============================================================================
-- 7. PARTNERS & EQUITY / PAYOUT TRANSACTIONS
-- ==============================================================================

-- Business Partners / Stakeholders
CREATE TABLE IF NOT EXISTS "partners" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "equity_percentage" NUMERIC DEFAULT '0' NOT NULL,
    "status" TEXT DEFAULT 'ACTIVE' NOT NULL, -- 'ACTIVE', 'INACTIVE'
    "joined_date" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "partners_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Partner Capital & Profit Ledger Transactions
CREATE TABLE IF NOT EXISTS "partner_transactions" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "partner_id" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'INVESTMENT', 'WITHDRAWAL', 'PROFIT_SHARE', 'PAYOUT'
    "amount" NUMERIC NOT NULL,
    "transaction_date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "payment_method_id" TEXT,
    "status" TEXT DEFAULT 'COMPLETED' NOT NULL, -- 'COMPLETED', 'PENDING', 'CANCELLED'
    "reference_number" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "partner_transactions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "partner_transactions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "partner_transactions_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- ==============================================================================
-- 8. MONTHLY RECURRING EXPENSES & BUDGETING
-- ==============================================================================

-- Monthly Expense Templates (Recurring Master Blueprint)
CREATE TABLE IF NOT EXISTS "monthly_expense_templates" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "default_amount" NUMERIC DEFAULT '0' NOT NULL,
    "due_day" NUMERIC DEFAULT '5' NOT NULL,
    "category" TEXT DEFAULT 'OPERATIONAL' NOT NULL,
    "payment_method_id" TEXT,
    "notes" TEXT,
    "is_active" TEXT DEFAULT 'true' NOT NULL,
    "display_order" NUMERIC DEFAULT '0' NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "monthly_expense_templates_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Monthly Expense Entries (Generated Monthly Bills)
CREATE TABLE IF NOT EXISTS "monthly_expense_entries" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "month" TEXT NOT NULL, -- 'YYYY-MM'
    "template_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT DEFAULT 'OPERATIONAL' NOT NULL,
    "expected_amount" NUMERIC DEFAULT '0' NOT NULL,
    "actual_amount" NUMERIC DEFAULT '0',
    "due_day" NUMERIC,
    "status" TEXT DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'PAID', 'SKIPPED'
    "paid_date" TIMESTAMP WITHOUT TIME ZONE,
    "payment_method_id" TEXT,
    "reference_number" TEXT,
    "notes" TEXT,
    "expense_id" TEXT,
    "paid_by_id" TEXT,
    "created_by_id" TEXT,
    "display_order" NUMERIC DEFAULT '0' NOT NULL,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT "monthly_expense_entries_template_id_monthly_expense_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "monthly_expense_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "monthly_expense_entries_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "monthly_expense_entries_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "monthly_expense_entries_paid_by_id_user_id_fk" FOREIGN KEY ("paid_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "monthly_expense_entries_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Month Settings (Budget Caps & Lock Overrides)
CREATE TABLE IF NOT EXISTS "monthly_expense_month_settings" (
    "month" TEXT PRIMARY KEY NOT NULL, -- 'YYYY-MM'
    "budget_limit" NUMERIC,
    "notes" TEXT,
    "is_unlocked_manual" TEXT DEFAULT 'false',
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 9. GOOGLE SHEETS ASYNC SYNC QUEUE
-- ==============================================================================

-- Synchronization Queue for External Sheets Integration
CREATE TABLE IF NOT EXISTS "google_sheets_sync_queue" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "entity" TEXT NOT NULL,
    "database_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'FULL_SYNC'
    "payload" TEXT,
    "status" TEXT DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'SYNCING', 'SUCCESS', 'FAILED'
    "attempts" NUMERIC DEFAULT '0' NOT NULL,
    "max_attempts" NUMERIC DEFAULT '5' NOT NULL,
    "last_attempt_at" TIMESTAMP WITHOUT TIME ZONE,
    "next_retry_at" TIMESTAMP WITHOUT TIME ZONE,
    "error_message" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 10. PERFORMANCE INDEXES
-- ==============================================================================

-- Orders Indexes
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "orders" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_orders_financial_status" ON "orders" ("financial_status");
CREATE INDEX IF NOT EXISTS "idx_orders_fulfillment_status" ON "orders" ("fulfillment_status");
CREATE INDEX IF NOT EXISTS "idx_orders_customer_email" ON "orders" ("customer_email");

-- Order Items Indexes
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_order_items_shopify_product_id" ON "order_items" ("shopify_product_id");

-- Order Issues Indexes
CREATE INDEX IF NOT EXISTS "idx_order_issues_order_id" ON "order_issues" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_order_issues_category_id" ON "order_issues" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_order_issues_status" ON "order_issues" ("status");
CREATE INDEX IF NOT EXISTS "idx_order_issues_priority" ON "order_issues" ("priority");
CREATE INDEX IF NOT EXISTS "idx_order_issues_assigned_to_id" ON "order_issues" ("assigned_to_id");
CREATE INDEX IF NOT EXISTS "idx_order_issues_created_at" ON "order_issues" ("created_at" DESC);

-- Order Issue Activities Indexes
CREATE INDEX IF NOT EXISTS "idx_order_issue_activities_issue_id" ON "order_issue_activities" ("issue_id");
CREATE INDEX IF NOT EXISTS "idx_order_issue_activities_actor_id" ON "order_issue_activities" ("actor_id");

-- Expenses Indexes
CREATE INDEX IF NOT EXISTS "idx_expenses_expense_date" ON "expenses" ("expense_date" DESC);
CREATE INDEX IF NOT EXISTS "idx_expenses_category_id" ON "expenses" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_expenses_payment_method_id" ON "expenses" ("payment_method_id");
CREATE INDEX IF NOT EXISTS "idx_expenses_created_by_id" ON "expenses" ("created_by_id");
CREATE INDEX IF NOT EXISTS "idx_expenses_deleted_at" ON "expenses" ("deleted_at");

-- Expense Attachments & Activities Indexes
CREATE INDEX IF NOT EXISTS "idx_expense_attachments_expense_id" ON "expense_attachments" ("expense_id");
CREATE INDEX IF NOT EXISTS "idx_expense_activities_expense_id" ON "expense_activities" ("expense_id");

-- Meta Ads Transactions Indexes
CREATE INDEX IF NOT EXISTS "idx_meta_ads_transactions_dates" ON "meta_ads_transactions" ("week_start_date", "week_end_date");
CREATE INDEX IF NOT EXISTS "idx_meta_ads_transactions_payment_date" ON "meta_ads_transactions" ("payment_date" DESC);

-- Partner Transactions Indexes
CREATE INDEX IF NOT EXISTS "idx_partner_transactions_partner_id" ON "partner_transactions" ("partner_id");
CREATE INDEX IF NOT EXISTS "idx_partner_transactions_date" ON "partner_transactions" ("transaction_date" DESC);
CREATE INDEX IF NOT EXISTS "idx_partner_transactions_type" ON "partner_transactions" ("type");

-- Monthly Expense Entries Indexes
CREATE INDEX IF NOT EXISTS "idx_monthly_expense_entries_month" ON "monthly_expense_entries" ("month");
CREATE INDEX IF NOT EXISTS "idx_monthly_expense_entries_status" ON "monthly_expense_entries" ("status");
CREATE INDEX IF NOT EXISTS "idx_monthly_expense_entries_template_id" ON "monthly_expense_entries" ("template_id");

-- Google Sheets Sync Queue Indexes
CREATE INDEX IF NOT EXISTS "idx_google_sheets_sync_queue_status_retry" ON "google_sheets_sync_queue" ("status", "next_retry_at");
CREATE INDEX IF NOT EXISTS "idx_google_sheets_sync_queue_created_at" ON "google_sheets_sync_queue" ("created_at" DESC);
