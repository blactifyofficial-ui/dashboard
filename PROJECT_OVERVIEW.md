# 📦 Shopify Operations & Financial Intelligence Dashboard

A modern, full-stack **Operations, E-commerce, and Financial Management Platform** built for high-growth Shopify businesses. This platform unifies real-time Shopify sales synchronization, order issue tracking, operational expense auditing, recurring bill automation, Meta Ads expenditure tracking, and partner equity/profit distribution into a single, high-performance web and PWA application.

---

## 📑 Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Tech Stack & Architecture](#2-tech-stack--architecture)
- [3. Key Features & Modules](#3-key-features--modules)
  - [3.1 Sales Overview & Dashboard](#31-sales-overview--dashboard)
  - [3.2 Revenue Intelligence (PIN-Protected)](#32-revenue-intelligence-pin-protected)
  - [3.3 Orders Synchronization & Directory](#33-orders-synchronization--directory)
  - [3.4 Order Issues & Ticket Management](#34-order-issues--ticket-management)
  - [3.5 Operational Expense Tracking & Attachments](#35-operational-expense-tracking--attachments)
  - [3.6 Monthly Recurring Expenses & Budgeting](#36-monthly-recurring-expenses--budgeting)
  - [3.7 Meta Ads Spend & Budget Planner](#37-meta-ads-spend--budget-planner)
  - [3.8 Partners, Equity & Payout Distribution](#38-partners-equity--payout-distribution)
  - [3.9 System Settings & Access Control](#39-system-settings--access-control)
- [4. Database Architecture & Schema](#4-database-architecture--schema)
- [5. Integrations & API Architecture](#5-integrations--api-architecture)
- [6. Security & Authentication Model](#6-security--authentication-model)
- [7. Progressive Web App (PWA) Support](#7-progressive-web-app-pwa-support)
- [8. Directory & File Structure](#8-directory--file-structure)
- [9. Environment Variables Configuration](#9-environment-variables-configuration)
- [10. Getting Started & Development Guide](#10-getting-started--development-guide)
- [11. Deployment Guidelines](#11-deployment-guidelines)

---

## 1. Executive Summary

E-commerce stores often struggle with fragmented operational data — Shopify handles orders, spreadsheets track expenses, ads are logged in Meta Ads Manager, support complaints are lost in email threads, and partner profits require manual calculations.

This **Shopify Dashboard** consolidates all critical e-commerce operations:
1. **Real-time Order Ingestion**: Automated Shopify webhooks with HMAC SHA-256 verification and manual sync backup.
2. **Support Lifecycle**: End-to-end order issue management with severity levels, category tagging, audit trails, and assignee tracking.
3. **Expense Auditability**: Receipt uploads to Cloudinary, categorization, payment methods, and daily financial notes.
4. **Automated Bill Lifecycle**: Recurring monthly expense templates with automated monthly schedule generation and payment reconciliations.
5. **Marketing Budgeting**: Weekly/daily Meta Ads budget calculations and payment logging synced with expenses.
6. **Partner Capital Ledger**: Capital investment tracking, profit-sharing distribution based on equity percentages, and withdrawal records.

---

## 2. Tech Stack & Architecture

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | Server Components, Server Actions, API Routes, Turbopack support |
| **Frontend Library** | [React 19](https://react.dev/) | Client & Server Components, Hooks, Suspense boundaries |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern CSS design with custom dark glassmorphism aesthetic |
| **Database** | [Neon PostgreSQL](https://neon.tech/) | Serverless Postgres with Connection Pooling and Instant Branching |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | Type-safe TypeScript ORM, schema migrations, and queries |
| **Authentication** | [Neon Auth](https://neon.tech/docs/guides/neon-auth) / [Better Auth](https://www.better-auth.com/) | Secure session management + Whitelist authorization |
| **Charts & Data Viz** | [Recharts](https://recharts.org/) & [Chart.js](https://www.chartjs.org/) | Interactive sales, revenue, and daily orders visualization |
| **Asset Storage** | [Cloudinary](https://cloudinary.com/) | Secure cloud storage for expense receipts, invoices, and attachments |
| **PWA Engine** | [@ducanh2912/next-pwa](https://github.com/ducanh2912/next-pwa) | Service Worker, offline caching, and native install experience |
| **Icons & Notifications** | [Lucide React](https://lucide.dev/) & [react-hot-toast](https://react-hot-toast.com/) | Crisp iconography and responsive feedback alerts |

---

## 3. Key Features & Modules

### 3.1 Sales Overview & Dashboard
- **Route**: `/dashboard`
- **Features**:
  - Real-time order and sales metrics aggregated directly from PostgreSQL.
  - Total all-time orders and monthly gross sales counter.
  - Interactive "Orders Per Day" chart for tracking order velocity throughout the current month.
  - Live system webhook status indicator.

### 3.2 Revenue Intelligence (PIN-Protected)
- **Route**: `/revenue`
- **Features**:
  - Secure second-layer authentication via a configurable PIN (`verifyRevenuePin` Server Action).
  - High-level net and gross revenue analytics.
  - Dynamic time-range filtering and revenue charts.
  - Prevents unauthorized staff or viewers from peeking at confidential revenue data.

### 3.3 Orders Synchronization & Directory
- **Route**: `/orders`
- **Features**:
  - Complete searchable and filterable database of synced Shopify orders.
  - Displays customer name, email, item quantities, total price, currency, financial status (`PAID`, `PENDING`), fulfillment status (`FULFILLED`, `UNFULFILLED`), and tracking IDs.
  - One-click manual Shopify sync trigger (`/api/sync-orders`) with rate-limited API batch fetching.

### 3.4 Order Issues & Ticket Management
- **Route**: `/order-issues`
- **Features**:
  - Complete issue tracking for defective items, shipping delays, lost packages, customer escalations, and returns.
  - Status lifecycle: `OPEN` ➔ `IN_PROGRESS` ➔ `WAITING` ➔ `RESOLVED` ➔ `CLOSED` ➔ `CANCELLED`.
  - Priority flags: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - Activity log history (`order_issue_activities`) capturing every status shift, assignment change, and internal remark.
  - Configurable category tagging (managed in Settings).

### 3.5 Operational Expense Tracking & Attachments
- **Route**: `/expenses`
- **Features**:
  - Daily expense logging with title, description, category, payment method, amount, and reference numbers.
  - Receipt and invoice uploads with direct Cloudinary integration (`expense_attachments`).
  - Daily expense notes (`expense_date_notes`) for financial journal entries.
  - Full audit trail (`expense_activities`) for tracking changes and soft deletions.

### 3.6 Monthly Recurring Expenses & Budgeting
- **Route**: `/monthly-expenses`
- **Features**:
  - **Template Management**: Create recurring bill templates (e.g., Software Subscriptions, Rent, Utilities, Shopify App fees, Retainers) with default amounts and due dates.
  - **Automated Month Generation**: Automatically provisions monthly expense entries for upcoming months (`YYYY-MM`).
  - **Payment Workflow**: Mark recurring items as `PAID`, `PENDING`, or `SKIPPED`, auto-linking payments to the main expense register.
  - **Monthly Budgets & Locks**: Set monthly budget thresholds and unlock past/future months on demand.

### 3.7 Meta Ads Spend & Budget Planner
- **Route**: `/meta-ads`
- **Features**:
  - Set and manage daily and weekly ad spend targets (`meta_ads_settings`).
  - Weekly transaction logging with automatic budget variance calculations.
  - Direct integration into the master expense ledger to ensure marketing costs are reflected in net cash flow.

### 3.8 Partners, Equity & Payout Distribution
- **Routes**: `/partners`, `/payouts`
- **Features**:
  - Partner registry with equity share percentages (`equity_percentage`), contact info, and status (`ACTIVE` / `INACTIVE`).
  - Transaction ledger: Capital Investments (`INVESTMENT`), Withdrawals (`WITHDRAWAL`), Profit Distributions (`PROFIT_SHARE`), and Payouts (`PAYOUT`).
  - Automated calculation of payout balances based on business profitability and partner equity stakes.

### 3.9 System Settings & Access Control
- **Route**: `/settings`
- **Features**:
  - **Allowed Users**: Whitelist management for granting system access to authorized email addresses.
  - **Issue Categories**: Add, edit, or toggle order issue categories.
  - **Expense Categories**: Manage operational cost categories.
  - **Payment Methods**: Add and organize payment channels (e.g., HDFC Bank, ICICI UPI, Corporate Credit Card, Cash).
  - **Security PIN**: Update the revenue dashboard protection PIN stored in `app_settings`.

---

## 4. Database Architecture & Schema

The database is built on **Neon Serverless PostgreSQL** using **Drizzle ORM** (`src/db/schema.ts`).

```
                    ┌─────────────────────────┐
                    │          users          │
                    └────────────┬────────────┘
                                 │ 1:N
       ┌─────────────────────────┼─────────────────────────┐
       ▼                         ▼                         ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│    orders    │◄──1:N───┤ order_issues │          │   expenses   │
└──────┬───────┘          └──────┬───────┘          └──────┬───────┘
       │ 1:N                     │ 1:N                     │ 1:N
┌──────▼───────┐          ┌──────▼───────────────┐  ┌──────▼───────────────┐
│  order_items │          │order_issue_activities│  │ expense_attachments  │
└──────────────┘          └──────────────────────┘  └──────────────────────┘
                                                           ▲
                                                           │
                                   ┌───────────────────────┴───────────────────┐
                                   │                                           │
                        ┌──────────┴───────────────┐               ┌───────────┴───────────────┐
                        │  meta_ads_transactions   │               │  monthly_expense_entries  │
                        └──────────────────────────┘               └───────────┬───────────────┘
                                                                               │ N:1
                                                                   ┌───────────▼───────────────┐
                                                                   │ monthly_expense_templates │
                                                                   └───────────────────────────┘
```

### Key Tables Summary:

| Table | Purpose |
| :--- | :--- |
| `orders` | Synced Shopify orders, customer details, financial/fulfillment status, tracking ID. |
| `order_items` | Individual line items in each order with title, price, quantity, and product ID. |
| `allowed_users` | Whitelisted email addresses authorized to access the system. |
| `users` | User credentials and profile accounts linked to Neon Auth / Better Auth. |
| `issue_categories` | Ticket categories for order issues (e.g., Damaged, Shipping Delay, Missing Item). |
| `order_issues` | Customer tickets and issue resolution lifecycle. |
| `order_issue_activities` | Audit trail of ticket updates, reassignments, priority changes, and comments. |
| `expense_categories` | Categories for company expenditures (e.g., Logistics, Software, Packaging, Salaries). |
| `payment_methods` | Payment instruments (e.g., Bank Transfer, UPI, Credit Card, Cash). |
| `expenses` | Recorded operational expenses with date, amount, reference number, and audit info. |
| `expense_attachments` | Receipts and invoice files uploaded to Cloudinary. |
| `expense_activities` | Historical log of modifications to expense records. |
| `expense_date_notes` | Daily notes and memos attached to expense calendar dates. |
| `meta_ads_settings` | Configuration for daily/weekly Meta Ads budgets and notes. |
| `meta_ads_transactions` | Recorded Meta Ads payments, linked optionally to `expenses`. |
| `partners` | Business stakeholders, contact information, and equity percentages. |
| `partner_transactions` | Capital investments, profit shares, drawings, and payouts. |
| `monthly_expense_templates` | Blueprint for recurring monthly payments (rent, recurring subscriptions). |
| `monthly_expense_entries` | Monthly instantiated bills with payment status (`PENDING`, `PAID`, `SKIPPED`). |
| `monthly_expense_month_settings` | Monthly budget ceilings, lock/unlock statuses, and notes. |
| `app_settings` | Key-value store for global settings (e.g., `revenue_pin`). |

---

## 5. Integrations & API Architecture

### 5.1 Shopify Webhook Ingestion (`/api/webhooks/shopify`)
- Listens to Shopify events: `orders/create` and `orders/updated`.
- **HMAC Verification**: Computes `crypto.createHmac('sha256', secret)` against raw request bodies and verifies `X-Shopify-Hmac-Sha256`.
- **Upsert Logic**: Inserts new orders or updates existing records on conflict (`orders.shopifyOrderId`).

### 5.2 Manual Historical Sync (`/api/sync-orders`)
- Communicates with Shopify Admin REST API using `SHOPIFY_ADMIN_ACCESS_TOKEN`.
- Paginates through historical store orders and synchronizes missing orders with order items.

### 5.3 REST API Endpoints Overview

| Endpoint | Methods | Description |
| :--- | :--- | :--- |
| `/api/orders` | `GET` | Fetches filtered, paginated order lists |
| `/api/sync-orders` | `POST` | Triggers manual batch synchronization with Shopify |
| `/api/webhooks/shopify` | `POST` | Webhook receiver for real-time Shopify order updates |
| `/api/expenses` | `GET`, `POST`, `PUT`, `DELETE` | Full CRUD operations for operational expenses |
| `/api/expense-categories` | `GET`, `POST`, `PUT` | Manage expense category definitions |
| `/api/monthly-expenses` | `GET`, `POST`, `PATCH` | Monthly recurring bill tracking, status updates, generation |
| `/api/order-issues` | `GET`, `POST`, `PATCH` | Order issue ticketing, activity logging, resolutions |
| `/api/issue-categories` | `GET`, `POST`, `PUT` | Manage ticket categories |
| `/api/meta-ads` | `GET`, `POST`, `PUT` | Meta ads budget settings and transaction payments |
| `/api/partners` | `GET`, `POST`, `PUT` | Partner profiles and capital ledger transactions |
| `/api/payment-methods` | `GET`, `POST`, `PUT` | Manage active payment methods |
| `/api/auth/[...neonauth]` | `GET`, `POST` | Neon Auth authentication callback handler |

---

## 6. Security & Authentication Model

1. **Authentication (Neon Auth / Better Auth)**:
   - User identity authenticated via Google OAuth or email sessions through Neon Auth.
2. **Access Control (Allowlist Protection - `requireAuth`)**:
   - `src/lib/auth-utils.ts` intercepts requests. Even if a user logs in via Neon Auth, their email **must** exist in the `allowed_users` database table. Unauthorized users receive `403 Forbidden`.
3. **Sensitive Data Protection (PIN Barrier)**:
   - Financial revenue screens require entering a secret PIN verified via a secure Server Action (`verifyRevenuePin`) stored in `app_settings`.
4. **Webhook Security**:
   - All Shopify webhooks are signed using HMAC-SHA256 and rejected if signatures do not match.

---

## 7. Progressive Web App (PWA) Support

- Configured using `@ducanh2912/next-pwa` in `next.config.ts`.
- Service worker generated in `public/sw.js` with background caching for fast loading on mobile and desktop.
- `public/manifest.json` provides an installable native app experience with custom standalone icons (`apple-icon.png`, `icon.png`).
- Interactive `<InstallPWA />` prompt for simple 1-click home screen installation.

---

## 8. Directory & File Structure

```
├── .agents/                 # AI & Assistant configuration skills
├── drizzle/                 # Drizzle database migration outputs
├── public/                  # Static assets, icons, manifest.json
│   ├── manifest.json        # PWA Web App Manifest
│   ├── icon.png             # Dashboard app icon
│   └── apple-icon.png       # Apple Touch icon
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (legal)          # /about, /privacy-policy, /terms
│   │   ├── actions/         # Server Actions (e.g. revenuePin.ts)
│   │   ├── api/             # API Route handlers (webhooks, sync, CRUD)
│   │   ├── dashboard/       # Sales overview & charts
│   │   ├── expenses/        # Expense logs & receipts
│   │   ├── login/           # User authentication screen
│   │   ├── meta-ads/        # Meta ads budget & tracking
│   │   ├── monthly-expenses/# Recurring bill manager & templates
│   │   ├── order-issues/    # Customer support issue ticketing
│   │   ├── orders/          # Shopify order listing
│   │   ├── partners/        # Equity partner ledger
│   │   ├── payouts/         # Partner payout distributions
│   │   ├── revenue/         # PIN-protected revenue analytics
│   │   ├── settings/        # System configuration & whitelist
│   │   ├── globals.css      # Global Tailwind CSS styles
│   │   ├── layout.tsx       # Root layout with sidebar & providers
│   │   └── page.tsx         # Root redirector (Auth check -> /dashboard)
│   ├── components/          # Reusable UI components
│   │   ├── monthly-expenses/# Monthly expense modals, tables & cards
│   │   ├── partners/        # Partner modals & transaction lists
│   │   ├── CategoryManager  # Category management modal
│   │   ├── ConfirmModal     # Reusable confirmation dialogs
│   │   ├── DynamicOrdersChart # Async order chart wrapper
│   │   ├── InstallPWA       # Native PWA install trigger
│   │   ├── LoadingSpinner   # Loading indicators
│   │   ├── LogoutButton     # Session termination component
│   │   ├── OrdersChart      # Chart.js / Recharts renderer
│   │   ├── PinModal         # Revenue access PIN prompt
│   │   ├── ResponsiveSidebar# Adaptive mobile/desktop navigation
│   │   ├── RevenueCard      # KPI stats card
│   │   └── SearchInput      # Debounced search bar
│   ├── db/                  # Database Layer
│   │   ├── index.ts         # Neon serverless database client connection
│   │   └── schema.ts        # Complete Drizzle ORM schema definitions
│   ├── lib/                 # Core Utilities & Libraries
│   │   ├── auth/            # Client and server Neon Auth initializers
│   │   ├── auth-utils.ts    # Access control & whitelist enforcement
│   │   ├── monthly-expenses-sync.ts # Recurring bill generator & scheduler
│   │   └── monthly-expenses-utils.ts# Date, math & status helper functions
│   └── proxy.ts             # Proxy helpers
├── drizzle.config.ts        # Drizzle Kit CLI configuration
├── next.config.ts           # Next.js & PWA configuration
├── package.json             # Dependencies and scripts
├── postcss.config.mjs       # Tailwind CSS PostCSS plugin config
└── tsconfig.json            # TypeScript compiler configuration
```

---

## 9. Environment Variables Configuration

Create a `.env.local` file in the root directory with the following configuration keys:

```env
# ==============================================================================
# DATABASE CONFIGURATION (Neon PostgreSQL)
# ==============================================================================
DATABASE_URL="postgresql://<user>:<password>@<host>-pooler.<region>.aws.neon.tech/<dbname>?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://<user>:<password>@<host>.<region>.aws.neon.tech/<dbname>?sslmode=require"
NEON_BRANCH="production"

# ==============================================================================
# NEON AUTH / BETTER AUTH
# ==============================================================================
NEON_AUTH_BASE_URL="https://<host>.neonauth.<region>.aws.neon.tech/<dbname>/auth"
NEON_AUTH_JWKS_URL="https://<host>.neonauth.<region>.aws.neon.tech/<dbname>/auth/.well-known/jwks.json"
NEON_AUTH_COOKIE_SECRET="your_secure_random_cookie_secret_here"

# ==============================================================================
# SHOPIFY STORE INTEGRATION
# ==============================================================================
SHOPIFY_SHOP_NAME="your-store-name.myshopify.com"
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SHOPIFY_CLIENT_ID="your_shopify_app_client_id"
SHOPIFY_CLIENT_SECRET="shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SHOPIFY_WEBHOOK_SECRET="your_shopify_webhook_hmac_secret"

# ==============================================================================
# CLOUDINARY (Media & Receipt Storage)
# ==============================================================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

---

## 10. Getting Started & Development Guide

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** / **pnpm** / **yarn** / **bun**
- **Neon Database Account**: Running PostgreSQL instance

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local` with your database, Shopify, Cloudinary, and Neon Auth credentials as detailed in [Section 9](#9-environment-variables-configuration).

### 3. Database Schema Migration
Push the Drizzle schema directly to your Neon PostgreSQL instance:
```bash
npx drizzle-kit push
```
*(Or generate migrations using `npx drizzle-kit generate`)*

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 11. Deployment Guidelines

### Deploying to Vercel
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Configure all environment variables in the Vercel Project Settings.
3. Set the build command to `npm run build` and output directory to default Next.js output.
4. Deploy!

### Configuring Shopify Webhooks
1. In your **Shopify Admin** ➔ **Settings** ➔ **Notifications** ➔ **Webhooks** (or via Shopify App Setup):
2. Create Webhook for `orders/create` with URL `https://your-domain.com/api/webhooks/shopify` (Format: JSON).
3. Create Webhook for `orders/updated` with URL `https://your-domain.com/api/webhooks/shopify` (Format: JSON).
4. Add the Webhook Verification Secret into `SHOPIFY_WEBHOOK_SECRET` in your environment variables.

---

## 📄 License & Ownership

Private and proprietary dashboard software built for business operations management. All rights reserved.
