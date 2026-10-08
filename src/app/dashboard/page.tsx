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

export const dynamic = "force-dynamic"; // Disable static rendering for this page

export default async function Dashboard() {
  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-12 relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Sales Overview</h1>
          <p className="text-neutral-400 text-xs sm:text-sm md:text-base flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/50 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white/80"></span>
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
    <div className="space-y-6 sm:space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {canViewRevenue && <RevenueCard totalSales={totalSales} />}

        <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-5 sm:p-6 md:p-8 hover:bg-white/[0.06] transition-all duration-500 relative shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500 pointer-events-none"></div>
          <h2 className="text-sm font-medium text-neutral-400 mb-2 md:mb-3 relative z-10">Total Orders (All Time)</h2>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight relative z-10 truncate">{totalOrders.toLocaleString('en-IN')}</p>
        </div>

        {canViewStatus && (
          <div className="group bg-neutral-900 border border-white/10 rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl shadow-black/50 flex flex-col justify-center relative transform hover:-translate-y-1 transition-all duration-500 sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-black/10 opacity-20 mix-blend-overlay"></div>
            <h2 className="text-xs font-semibold text-white/80 mb-2 md:mb-3 relative z-10 uppercase tracking-wider">System Status</h2>
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-white/20 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse"></div>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white">Listening for Webhooks</p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Row */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white tracking-tight mb-4 md:mb-6">Orders per Day</h2>
          {ordersPerDayResult.length > 0 ? (
            <DynamicOrdersChart data={ordersPerDayResult} />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
                <Inbox size={32} className="text-white/50"/>
              </div>
              <p className="text-base sm:text-lg font-medium text-white/80">No chart data available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

