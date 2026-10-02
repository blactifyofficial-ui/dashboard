# 📦 Shopify Operations & Financial Intelligence Dashboard

A modern, full-stack **Operations, E-commerce, and Financial Management Platform** built for high-growth Shopify businesses.

> 📖 **Full System Documentation**: For a deep-dive breakdown of the database schema, API routes, security model, and component architecture, see [PROJECT_OVERVIEW.md](file:///Users/nithin/Developer/Dashboard/PROJECT_OVERVIEW.md).

---

## 🚀 Quick Highlights

- **⚡ Real-time Order Sync**: Automated HMAC-verified Shopify webhooks + manual batch sync.
- **🔒 PIN-Protected Revenue Intelligence**: Second-layer security for sensitive financial analytics.
- **🎫 Order Issues & Ticket Lifecycle**: Complete support ticketing, priority flags, and audit trail.
- **🧾 Operational Expense Management**: Categorized expenses with Cloudinary receipt/invoice uploads.
- **🔄 Recurring Monthly Bills & Budgets**: Automated template generation, payment tracking, and budget thresholds.
- **📣 Meta Ads Spend Tracking**: Weekly/daily budget planning and auto-linked expense entries.
- **🤝 Partners & Equity Ledger**: Capital investment records, equity profit distribution, and partner payout ledger.
- **📱 Installable Progressive Web App (PWA)**: Offline-capable service worker and installable mobile experience.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Database & ORM**: Neon PostgreSQL (Serverless), Drizzle ORM
- **Authentication**: Neon Auth / Better Auth + Whitelist Access Control
- **Visualizations**: Recharts & Chart.js
- **Media Storage**: Cloudinary CDN
- **PWA**: `@ducanh2912/next-pwa`

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy or create `.env.local` (refer to [PROJECT_OVERVIEW.md](file:///Users/nithin/Developer/Dashboard/PROJECT_OVERVIEW.md#9-environment-variables-configuration) for all required keys):

```env
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."
NEON_AUTH_BASE_URL="https://..."
SHOPIFY_SHOP_NAME="store.myshopify.com"
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_..."
SHOPIFY_WEBHOOK_SECRET="..."
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 3. Synchronize Database Schema
```bash
npx drizzle-kit push
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the dashboard.
