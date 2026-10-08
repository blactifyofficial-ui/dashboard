import { db } from '@/db';
import { orders } from '@/db/schema';
import { count, sql } from 'drizzle-orm';
import { Inbox } from 'lucide-react';
import RevenueCard from '@/components/RevenueCard';
import DynamicOrdersChart from '@/components/DynamicOrdersChart';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  return (
    <div className="space-y-6 relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Sales Overview</h1>
          <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Real-time sync with Shopify via Webhooks</span>
          </p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const authRes = await requireAuth();
  const role = 'role' in authRes ? authRes.role : 'VIEWER';

  const canViewRevenue = hasPermission(role, 'overview:view_revenue');
  const canViewStatus = hasPermission(role, 'overview:view_status');

  const [totalResult] = await db.select({
    totalOrders: count(),
    totalSales: canViewRevenue ? sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)` : sql<number>`0`
  }).from(orders);

  const totalOrders = totalResult.totalOrders;
  const totalSales = Number(totalResult.totalSales);

  const ordersPerDayResult = await db.select({
    date: sql<string>`DATE(${orders.createdAt})`,
    count: sql<number>`CAST(COUNT(*) AS INTEGER)`
  })
    .from(orders)
    .where(sql`date_trunc('month', ${orders.createdAt}) = date_trunc('month', CURRENT_DATE)`)
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {canViewRevenue && <RevenueCard totalSales={totalSales} />}

        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Total Orders (All Time)</h2>
          <p className="text-2xl sm:text-3xl font-semibold font-mono text-foreground tracking-tight truncate mt-auto">
            {totalOrders.toLocaleString('en-IN')}
          </p>
        </div>

        {canViewStatus && (
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between sm:col-span-2 lg:col-span-1 shadow-xs">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">System Status</h2>
            <div className="flex items-center gap-2.5 mt-auto">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-base sm:text-lg font-medium text-foreground">Listening for Webhooks</p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Row */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs">
        <h2 className="text-sm font-medium text-foreground mb-4">Orders per Day (Current Month)</h2>
        {ordersPerDayResult.length > 0 ? (
          <DynamicOrdersChart data={ordersPerDayResult} />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 py-12">
            <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
              <Inbox size={24} />
            </div>
            <p className="text-sm text-muted-foreground">No chart data available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
