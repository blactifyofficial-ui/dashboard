import { db } from '@/db';
import { orders } from '@/db/schema';
import { count, sql, and, gte, lt } from 'drizzle-orm';
import { Inbox } from 'lucide-react';
import RevenueCard from '@/components/RevenueCard';
import DynamicOrdersChart from '@/components/DynamicOrdersChart';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

import { redirect } from 'next/navigation';

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

  if (authRes.error) {
    if (authRes.status === 401) {
      redirect('/login');
    }
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
        <p className="text-base font-medium text-foreground mb-1">Access Restricted</p>
        <p className="text-sm">{authRes.error}</p>
      </div>
    );
  }

  const role = authRes.role || 'VIEWER';
  const canViewRevenue = hasPermission(role, 'overview:view_revenue');
  const canViewStatus = hasPermission(role, 'overview:view_status');

  let totalOrders = 0;
  let totalSales = 0;
  let ordersPerDayResult: { date: string; day?: string; count: number; revenue?: number }[] = [];

  try {
    const totalResult = await db.select({
      totalOrders: count(),
      totalSales: canViewRevenue ? sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)` : sql<number>`0`
    }).from(orders);

    if (totalResult && totalResult[0]) {
      totalOrders = totalResult[0].totalOrders ?? 0;
      totalSales = Number(totalResult[0].totalSales ?? 0);
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (9 for Oct)
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 1);

    const monthOrders = await db.select({
      id: orders.id,
      createdAt: orders.createdAt,
      totalPrice: orders.totalPrice
    })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lt(orders.createdAt, endDate)
        )
      )
      .orderBy(orders.createdAt);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let latestOrderDay = 0;
    monthOrders.forEach((o) => {
      if (o.createdAt) {
        const d = new Date(o.createdAt).getDate();
        if (d > latestOrderDay) latestOrderDay = d;
      }
    });

    const todayDate = now.getDate();
    // For the ongoing current month, only plot days up to today (or latest order date)
    // so future days don't appear and all past elapsed days are continuous without gaps.
    const daysToShow = Math.min(daysInMonth, Math.max(todayDate, latestOrderDay));

    const dailyMap = new Map<number, { count: number; revenue: number }>();
    for (let day = 1; day <= daysToShow; day++) {
      dailyMap.set(day, { count: 0, revenue: 0 });
    }

    monthOrders.forEach((o) => {
      if (o.createdAt) {
        const d = new Date(o.createdAt).getDate();
        const existing = dailyMap.get(d) || { count: 0, revenue: 0 };
        const price = parseFloat(o.totalPrice || '0') || 0;
        dailyMap.set(d, {
          count: existing.count + 1,
          revenue: existing.revenue + price,
        });
      }
    });

    const monthShort = startDate.toLocaleDateString('en-US', { month: 'short' });
    ordersPerDayResult = Array.from(dailyMap.entries()).map(([day, val]) => {
      const paddedDay = day < 10 ? `0${day}` : `${day}`;
      const paddedMonth = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
      return {
        date: `${currentYear}-${paddedMonth}-${paddedDay}`,
        day: `${day} ${monthShort}`,
        count: val.count,
        revenue: canViewRevenue ? Math.round(val.revenue * 100) / 100 : undefined,
      };
    });
  } catch (error) {
    console.error("Dashboard database query error:", error);
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
        <p className="text-base font-medium text-foreground">Database is reconnecting</p>
        <p className="text-sm text-muted-foreground">
          The database is waking up or reconnecting. Please refresh the page in a few moments.
        </p>
      </div>
    );
  }

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
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground tracking-tight">Orders per Day (Current Month)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Daily order volume and distribution</p>
        </div>
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
