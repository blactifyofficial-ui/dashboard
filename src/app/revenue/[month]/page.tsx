import { db } from '@/db';
import { orders, expenses } from '@/db/schema';
import { and, gte, lt, desc, isNull, sql } from 'drizzle-orm';
import { CalendarDays, Inbox, ArrowLeft, CreditCard, Banknote, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import Link from 'next/link';
import RevenueChart from '@/components/RevenueChart';
import MonthOrdersTable from '@/components/MonthOrdersTable';
import { isCodOrder } from '@/lib/order-utils';
import { getStoreMonthRange, getStoreNow, getStoreDay } from '@/lib/date-utils';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { requirePermission } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = "force-dynamic";

export default async function MonthRevenuePage(props: {
  params: Promise<{ month: string }>;
}) {
  const authRes = await requirePermission('revenue:view');
  if ('error' in authRes) {
    return <AccessDenied message="You do not have permission to view revenue and sales performance." />;
  }

  const canViewExpenses = hasPermission(authRes.role, 'expenses:view', authRes.permissions);

  const params = await props.params;
  const monthParam = params.month; // e.g. "2026-10"
  
  const [yearStr, monthStr] = monthParam.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  
  if (isNaN(year) || isNaN(month)) {
    return <div className="text-foreground">Invalid month</div>;
  }

  // Calculate month boundaries in store timezone (Asia/Kolkata, UTC+05:30)
  const { startDate, endDate } = getStoreMonthRange(year, month);
  
  const monthDisplay = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10 text-foreground">
      <header className="flex items-center gap-2.5 sm:gap-3">
        <Link 
          href="/revenue" 
          aria-label="Back to Revenue"
          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-card hover:bg-muted text-foreground transition-colors border border-border shrink-0 shadow-xs"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{monthDisplay} Revenue</h1>
          <p className="text-muted-foreground text-xs">Overview, profit performance, and order breakdown for this month</p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <MonthRevenueContent year={year} month={month} startDate={startDate} endDate={endDate} canViewExpenses={canViewExpenses} />
      </Suspense>
    </div>
  );
}

async function MonthRevenueContent({ year, month, startDate, endDate, canViewExpenses }: {
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  canViewExpenses: boolean;
}) {
  // Get orders for this month with all details, filtered by store 24h timezone boundaries
  const monthOrders = await db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    customerName: orders.customerName,
    customerEmail: orders.customerEmail,
    totalPrice: orders.totalPrice,
    currency: orders.currency,
    createdAt: orders.createdAt,
    financialStatus: orders.financialStatus,
    fulfillmentStatus: orders.fulfillmentStatus,
    paymentGateway: orders.paymentGateway,
    trackingId: orders.trackingId,
    trackingCompany: orders.trackingCompany,
    trackingUrl: orders.trackingUrl,
    codStatus: orders.codStatus,
  })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lt(orders.createdAt, endDate)
      )
    )
    .orderBy(desc(orders.createdAt));

  // Calculate daily 24h data for the chart using store timezone (Asia/Kolkata)
  const dailyDataMap = new Map<number, { revenue: number; ordersCount: number }>();
  
  const now = getStoreNow();
  const isCurrentMonth = year === now.year && month === now.month;
  const isFutureMonth = year > now.year || (year === now.year && month > now.month);

  const daysInMonth = new Date(year, month, 0).getDate();

  // Find the highest day that has an order in this month in store timezone
  let latestOrderDay = 0;
  monthOrders.forEach((order) => {
    if (order.createdAt) {
      const d = getStoreDay(order.createdAt);
      if (d > latestOrderDay) latestOrderDay = d;
    }
  });

  // For the ongoing current month, only plot days up to today (or latest order date)
  let daysToShow = daysInMonth;
  if (isCurrentMonth) {
    const todayDate = now.day;
    daysToShow = Math.min(daysInMonth, Math.max(todayDate, latestOrderDay));
  } else if (isFutureMonth) {
    daysToShow = latestOrderDay;
  }

  for (let i = 1; i <= daysToShow; i++) {
    dailyDataMap.set(i, { revenue: 0, ordersCount: 0 });
  }
  
  let totalRevenue = 0;
  let normalOrdersCount = 0;
  let normalRevenue = 0;
  let codOrdersCount = 0;
  let codRevenue = 0;
  
  monthOrders.forEach((order) => {
    const revenue = parseFloat(order.totalPrice || '0') || 0;
    totalRevenue += revenue;

    if (order.createdAt) {
      const day = getStoreDay(order.createdAt);
      const current = dailyDataMap.get(day) || { revenue: 0, ordersCount: 0 };
      dailyDataMap.set(day, {
        revenue: current.revenue + revenue,
        ordersCount: current.ordersCount + 1,
      });
    }

    if (isCodOrder(order)) {
      codOrdersCount++;
      codRevenue += revenue;
    } else {
      normalOrdersCount++;
      normalRevenue += revenue;
    }
  });

  // Query expenses for the month if user has permission
  let monthExpenses = 0;
  let expenseCount = 0;
  if (canViewExpenses) {
    const [expensesResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS NUMERIC)), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(
        and(
          isNull(expenses.deletedAt),
          gte(expenses.expenseDate, startDate),
          lt(expenses.expenseDate, endDate)
        )
      );
    if (expensesResult) {
      monthExpenses = Number(expensesResult.total ?? 0);
      expenseCount = Number(expensesResult.count ?? 0);
    }
  }

  const netProfit = totalRevenue - monthExpenses;
  const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  
  const monthShort = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
  const chartData = Array.from(dailyDataMap.entries()).map(([day, val]) => ({
    day: `${day} ${monthShort}`,
    revenue: Math.round(val.revenue * 100) / 100,
    ordersCount: val.ordersCount,
  }));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Summary Cards Grid */}
      <div className={`grid grid-cols-2 ${canViewExpenses ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-4'} gap-2.5 sm:gap-3.5`}>
        {/* Total Revenue */}
        <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
            <CalendarDays size={16} className="text-muted-foreground shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight font-mono">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground pt-1.5 border-t border-border truncate">
            Across {monthOrders.length} orders
          </p>
        </div>

        {/* Monthly Net Profit */}
        {canViewExpenses && (
          <div className={`bg-card border ${netProfit >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'} rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between`}>
            <div className="flex items-center justify-between gap-2">
              <p className={`text-[10px] sm:text-[11px] font-semibold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} uppercase tracking-wider`}>
                Net Profit
              </p>
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  netProfit >= 0
                    ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-rose-700 bg-rose-500/10 dark:text-rose-400'
                }`}
              >
                {netProfit >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {netMargin >= 0 ? `+${netMargin}%` : `${netMargin}%`}
              </span>
            </div>
            <div className="my-1.5">
              <p className={`text-base sm:text-lg md:text-xl font-bold tracking-tight font-mono ${
                netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                ₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground pt-1.5 border-t border-border truncate">
              Margin: <strong className={netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>{netMargin}%</strong> of sales
            </p>
          </div>
        )}

        {/* Total Expenses */}
        {canViewExpenses && (
          <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Expenses</p>
              <Wallet size={16} className="text-rose-500 shrink-0" />
            </div>
            <div className="my-1.5">
              <p className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight font-mono">
                ₹{monthExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="pt-1.5 border-t border-border flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
              <span>{expenseCount} {expenseCount === 1 ? 'entry' : 'entries'}</span>
              <Link href="/expenses" className="text-primary hover:underline font-medium">
                View →
              </Link>
            </div>
          </div>
        )}
        
        {/* Total Orders */}
        <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</p>
            <Inbox size={16} className="text-muted-foreground shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight font-mono">
              {monthOrders.length}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground pt-1.5 border-t border-border truncate">
            Avg: ₹{(monthOrders.length > 0 ? totalRevenue / monthOrders.length : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} / order
          </p>
        </div>

        {/* Normal / Prepaid Orders */}
        <div className="bg-card border border-emerald-500/30 rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">Normal (Prepaid)</p>
            </div>
            <CreditCard size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              ₹{normalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground pt-1.5 border-t border-border truncate">
            <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">{normalOrdersCount}</strong> {normalOrdersCount === 1 ? 'order' : 'orders'} ({monthOrders.length > 0 ? Math.round((normalOrdersCount / monthOrders.length) * 100) : 0}%)
          </p>
        </div>

        {/* COD Orders */}
        <div className="bg-card border border-amber-500/30 rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
              <p className="text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">COD Orders</p>
            </div>
            <Banknote size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight font-mono">
              ₹{codRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground pt-1.5 border-t border-border truncate">
            <strong className="text-amber-700 dark:text-amber-300 font-semibold">{codOrdersCount}</strong> {codOrdersCount === 1 ? 'order' : 'orders'} ({monthOrders.length > 0 ? Math.round((codOrdersCount / monthOrders.length) * 100) : 0}%)
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-card border border-border rounded-xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden">
        <RevenueChart data={chartData} isCurrentMonth={isCurrentMonth} />
      </div>

      {/* Detailed Orders Breakdown Table */}
      <MonthOrdersTable orders={monthOrders} />
    </div>
  );
}
