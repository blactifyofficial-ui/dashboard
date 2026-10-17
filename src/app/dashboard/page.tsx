import { db } from '@/db';
import { orders, orderItems, expenses, monthlyExpenseEntries } from '@/db/schema';
import { count, sql, and, gte, lt, desc, eq, isNull, asc } from 'drizzle-orm';
import { Inbox, ArrowUpRight, BarChart3, Boxes } from 'lucide-react';
import Link from 'next/link';
import DynamicOrdersChart from '@/components/DynamicOrdersChart';
import DashboardKpis from '@/components/dashboard/DashboardKpis';
import PaymentAndFulfillmentCard from '@/components/dashboard/PaymentAndFulfillmentCard';
import RecentOrdersWidget from '@/components/dashboard/RecentOrdersWidget';
import TopProductsWidget from '@/components/dashboard/TopProductsWidget';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { requireAuth, type AuthResult } from '@/lib/auth-utils';
import { hasPermission, canAccessRoute, getDefaultRouteForUser } from '@/lib/rbac';
import {
  getStoreMonthRange,
  getStoreNow,
  getStoreDay,
  getStoreTodayRange,
  getStoreYesterdayRange,
} from '@/lib/date-utils';
import { isCodOrder } from '@/lib/order-utils';
import { redirect } from 'next/navigation';

export const dynamic = "force-dynamic";

export default async function Dashboard() {
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
  const customPerms = authRes.permissions;

  if (!canAccessRoute(role, '/dashboard', customPerms)) {
    const defaultRoute = getDefaultRouteForUser(role, customPerms);
    if (defaultRoute && defaultRoute !== '/dashboard') {
      redirect(defaultRoute);
    }
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
        <p className="text-base font-medium text-foreground mb-1">Access Restricted</p>
        <p className="text-sm">You do not have permission to view the Overview dashboard.</p>
      </div>
    );
  }

  const canViewRevenueReports = hasPermission(role, 'revenue:view', customPerms) && hasPermission(role, 'overview:view_revenue', customPerms);
  const canViewInventory = hasPermission(role, 'inventory:view', customPerms);
  const canViewTopProducts = hasPermission(role, 'overview:view_top_products', customPerms);
  const showInventoryShortcut = canViewInventory && canViewTopProducts;

  return (
    <div className="space-y-6 relative z-10 pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Sales Command Center</h1>
            <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Overview
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Real-time operational metrics &amp; Shopify synchronization</span>
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        {(canViewRevenueReports || showInventoryShortcut) && (
          <div className="flex items-center gap-2">
            {canViewRevenueReports && (
              <Link
                href="/revenue"
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-card border border-border hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <BarChart3 size={14} className="text-muted-foreground" />
                <span>Revenue Reports</span>
              </Link>
            )}
            {showInventoryShortcut && (
              <Link
                href="/inventory"
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-card border border-border hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Boxes size={14} className="text-muted-foreground" />
                <span>Inventory Stock</span>
              </Link>
            )}
          </div>
        )}
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <DashboardContent authRes={authRes} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({ authRes: initialAuthRes }: { authRes?: AuthResult } = {}) {
  const authRes = initialAuthRes || await requireAuth();

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
  const customPerms = authRes.permissions;
  const canViewRevenue = hasPermission(role, 'overview:view_revenue', customPerms);
  const canViewRevenueReports = hasPermission(role, 'revenue:view', customPerms) && canViewRevenue;
  const canViewOrders = hasPermission(role, 'overview:view_orders', customPerms);
  const canViewStatus = hasPermission(role, 'overview:view_status', customPerms);
  const canViewChart = hasPermission(role, 'overview:view_chart', customPerms);
  const canViewRecentOrders = hasPermission(role, 'overview:view_recent_orders', customPerms);
  const canViewOrderDetails = hasPermission(role, 'orders:view', customPerms);
  const canViewTopProducts = hasPermission(role, 'overview:view_top_products', customPerms);
  const canViewExpenses = hasPermission(role, 'expenses:view', customPerms);
  const canViewMonthlyExpenses = hasPermission(role, 'monthly_expenses:view', customPerms);
  const canViewInventory = hasPermission(role, 'inventory:view', customPerms);
  const canSeeExpenseData = canViewRevenue && (canViewExpenses || canViewMonthlyExpenses);

  // Dates in Store Timezone (IST Asia/Kolkata)
  const storeNow = getStoreNow();
  const todayRange = getStoreTodayRange();
  const yesterdayRange = getStoreYesterdayRange();
  const monthRange = getStoreMonthRange(storeNow.year, storeNow.month);

  let totalAllTimeOrders = 0;
  let totalAllTimeSales = 0;

  let todayOrders = 0;
  let todaySales = 0;

  let yesterdayOrders = 0;
  let yesterdaySales = 0;

  let ordersPerDayResult: { date: string; day?: string; count: number; revenue?: number }[] = [];

  let prepaidCount = 0;
  let prepaidRevenue = 0;
  let codCount = 0;
  let codRevenue = 0;
  let fulfilledCount = 0;
  let unfulfilledCount = 0;
  let partiallyFulfilledCount = 0;
  let mtdSales = 0;
  let mtdOrders = 0;

  let totalMtdExpenses = 0;
  let mtdExpensesCount = 0;
  let monthlyBillsPaidAmount = 0;
  let monthlyBillsPendingAmount = 0;
  let monthlyBillsPaidCount = 0;
  let monthlyBillsTotalCount = 0;
  let recentMonthlyBills: Array<{
    id: string;
    name: string;
    category: string;
    expectedAmount: string;
    actualAmount: string | null;
    status: string;
    dueDay: string | null;
  }> = [];

  let recentOrders: Array<{
    id: string;
    orderNumber: string | null;
    customerName: string | null;
    customerEmail: string | null;
    totalPrice: string | null;
    createdAt: Date | string | null;
    financialStatus: string | null;
    fulfillmentStatus: string | null;
    paymentGateway: string | null;
  }> = [];

  let topProducts: Array<{
    title: string | null;
    imageUrl: string | null;
    revenue: number;
    unitsSold: number;
  }> = [];

  try {
    // 1. All-time totals query
    const totalResult = await db.select({
      totalOrders: count(),
      totalSales: canViewRevenueReports ? sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)` : sql<number>`0`
    }).from(orders);

    if (totalResult && totalResult[0]) {
      totalAllTimeOrders = totalResult[0].totalOrders ?? 0;
      totalAllTimeSales = Number(totalResult[0].totalSales ?? 0);
    }

    // 2. Today's orders & revenue
    const [todayResult] = await db.select({
      count: count(),
      revenue: canViewRevenue ? sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)` : sql<number>`0`
    })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, todayRange.startDate),
          lt(orders.createdAt, todayRange.endDate)
        )
      );

    if (todayResult) {
      todayOrders = todayResult.count ?? 0;
      todaySales = Number(todayResult.revenue ?? 0);
    }

    // 3. Yesterday's orders & revenue
    const [yesterdayResult] = await db.select({
      count: count(),
      revenue: canViewRevenue ? sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)` : sql<number>`0`
    })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, yesterdayRange.startDate),
          lt(orders.createdAt, yesterdayRange.endDate)
        )
      );

    if (yesterdayResult) {
      yesterdayOrders = yesterdayResult.count ?? 0;
      yesterdaySales = Number(yesterdayResult.revenue ?? 0);
    }

    // 4. Month orders with full breakdown (MTD, Chart, Payment Split, Fulfillment)
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
    })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, monthRange.startDate),
          lt(orders.createdAt, monthRange.endDate)
        )
      )
      .orderBy(orders.createdAt);

    mtdOrders = monthOrders.length;

    const daysInMonth = new Date(storeNow.year, storeNow.month, 0).getDate();
    let latestOrderDay = 0;

    monthOrders.forEach((o) => {
      const price = parseFloat(o.totalPrice || '0') || 0;
      mtdSales += price;

      // Payment gateway split
      const isCod = isCodOrder(o);
      if (isCod) {
        codCount++;
        codRevenue += price;
      } else {
        prepaidCount++;
        prepaidRevenue += price;
      }

      // Fulfillment status split
      const fulfillment = (o.fulfillmentStatus || '').toLowerCase();
      if (fulfillment === 'fulfilled') {
        fulfilledCount++;
      } else if (fulfillment === 'partial' || fulfillment === 'partially_fulfilled') {
        partiallyFulfilledCount++;
      } else {
        unfulfilledCount++;
      }

      // Latest order day tracking
      if (o.createdAt) {
        const d = getStoreDay(o.createdAt);
        if (d > latestOrderDay) latestOrderDay = d;
      }
    });

    const todayDate = storeNow.day;
    const daysToShow = Math.min(daysInMonth, Math.max(todayDate, latestOrderDay));

    const dailyMap = new Map<number, { count: number; revenue: number }>();
    for (let day = 1; day <= daysToShow; day++) {
      dailyMap.set(day, { count: 0, revenue: 0 });
    }

    monthOrders.forEach((o) => {
      if (o.createdAt) {
        const d = getStoreDay(o.createdAt);
        const existing = dailyMap.get(d) || { count: 0, revenue: 0 };
        const price = parseFloat(o.totalPrice || '0') || 0;
        dailyMap.set(d, {
          count: existing.count + 1,
          revenue: existing.revenue + price,
        });
      }
    });

    const monthShort = new Date(storeNow.year, storeNow.month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    ordersPerDayResult = Array.from(dailyMap.entries()).map(([day, val]) => {
      const paddedDay = day < 10 ? `0${day}` : `${day}`;
      const paddedMonth = storeNow.month < 10 ? `0${storeNow.month}` : `${storeNow.month}`;
      return {
        date: `${storeNow.year}-${paddedMonth}-${paddedDay}`,
        day: `${day} ${monthShort}`,
        count: val.count,
        revenue: canViewRevenue ? Math.round(val.revenue * 100) / 100 : undefined,
      };
    });

    // 5. Recent orders query (Last 6 orders)
    recentOrders = await db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      totalPrice: orders.totalPrice,
      createdAt: orders.createdAt,
      financialStatus: orders.financialStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      paymentGateway: orders.paymentGateway,
    })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(6);

    // 6. Top Products Query for current month (falling back to all-time if month has no product lines yet)
    const monthProductsResult = await db.select({
      title: orderItems.title,
      imageUrl: sql<string>`MAX(${orderItems.imageUrl})`,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.price} AS NUMERIC) * CAST(${orderItems.quantity} AS NUMERIC)), 0)`,
      unitsSold: sql<number>`COALESCE(SUM(CAST(${orderItems.quantity} AS NUMERIC)), 0)`
    })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          gte(orders.createdAt, monthRange.startDate),
          lt(orders.createdAt, monthRange.endDate)
        )
      )
      .groupBy(orderItems.title)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${orderItems.quantity} AS NUMERIC)), 0)`))
      .limit(5);

    if (monthProductsResult && monthProductsResult.length > 0) {
      topProducts = monthProductsResult.map(p => ({
        title: p.title,
        imageUrl: p.imageUrl,
        revenue: Number(p.revenue) || 0,
        unitsSold: Number(p.unitsSold) || 0,
      }));
    } else {
      // Fallback to all-time best sellers
      const allTimeProducts = await db.select({
        title: orderItems.title,
        imageUrl: sql<string>`MAX(${orderItems.imageUrl})`,
        revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.price} AS NUMERIC) * CAST(${orderItems.quantity} AS NUMERIC)), 0)`,
        unitsSold: sql<number>`COALESCE(SUM(CAST(${orderItems.quantity} AS NUMERIC)), 0)`
      })
        .from(orderItems)
        .groupBy(orderItems.title)
        .orderBy(desc(sql`COALESCE(SUM(CAST(${orderItems.quantity} AS NUMERIC)), 0)`))
        .limit(5);

      topProducts = allTimeProducts.map(p => ({
        title: p.title,
        imageUrl: p.imageUrl,
        revenue: Number(p.revenue) || 0,
        unitsSold: Number(p.unitsSold) || 0,
      }));
    }

    // 7. Monthly Expenses and Recurring Bills Query for current month
    if (canSeeExpenseData) {
      const [expensesResult] = await db
        .select({
          total: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS NUMERIC)), 0)`,
          count: count(),
        })
        .from(expenses)
        .where(
          and(
            isNull(expenses.deletedAt),
            gte(expenses.expenseDate, monthRange.startDate),
            lt(expenses.expenseDate, monthRange.endDate)
          )
        );

      if (expensesResult) {
        totalMtdExpenses = Number(expensesResult.total ?? 0);
        mtdExpensesCount = Number(expensesResult.count ?? 0);
      }

      const currentMonthKey = `${storeNow.year}-${String(storeNow.month).padStart(2, '0')}`;
      const bills = await db
        .select({
          id: monthlyExpenseEntries.id,
          name: monthlyExpenseEntries.name,
          category: monthlyExpenseEntries.category,
          expectedAmount: monthlyExpenseEntries.expectedAmount,
          actualAmount: monthlyExpenseEntries.actualAmount,
          status: monthlyExpenseEntries.status,
          dueDay: monthlyExpenseEntries.dueDay,
        })
        .from(monthlyExpenseEntries)
        .where(eq(monthlyExpenseEntries.month, currentMonthKey))
        .orderBy(asc(monthlyExpenseEntries.dueDay), asc(monthlyExpenseEntries.createdAt));

      monthlyBillsTotalCount = bills.length;
      for (const b of bills) {
        const exp = parseFloat(b.expectedAmount || '0') || 0;
        const act = parseFloat(b.actualAmount || '0') || 0;
        if (b.status === 'PAID') {
          monthlyBillsPaidCount++;
          monthlyBillsPaidAmount += (act > 0 ? act : exp);
        } else if (b.status === 'PENDING') {
          monthlyBillsPendingAmount += (act > 0 ? act : exp);
        }
      }
      recentMonthlyBills = bills.slice(0, 4);
    }

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

  // Calculate Average Order Values (AOV) and Net Revenue
  const aov = mtdOrders > 0 ? mtdSales / mtdOrders : 0;
  const prepaidAov = prepaidCount > 0 ? prepaidRevenue / prepaidCount : 0;
  const codAov = codCount > 0 ? codRevenue / codCount : 0;
  const netRevenue = mtdSales - totalMtdExpenses;

  return (
    <div className="space-y-6">
      {/* 1. Primary Operational KPIs */}
      <DashboardKpis
        canViewRevenue={canViewRevenue}
        canViewRevenueReports={canViewRevenueReports}
        canViewOrders={canViewOrders}
        canViewStatus={canViewStatus}
        canViewExpenses={canSeeExpenseData}
        todaySales={todaySales}
        todayOrders={todayOrders}
        yesterdaySales={yesterdaySales}
        yesterdayOrders={yesterdayOrders}
        mtdSales={mtdSales}
        mtdOrders={mtdOrders}
        totalMtdExpenses={totalMtdExpenses}
        netRevenue={netRevenue}
        monthlyBillsPaidCount={monthlyBillsPaidCount}
        monthlyBillsTotalCount={monthlyBillsTotalCount}
        aov={aov}
        prepaidAov={prepaidAov}
        codAov={codAov}
        unfulfilledOrders={unfulfilledCount}
        totalAllTimeSales={totalAllTimeSales}
        totalAllTimeOrders={totalAllTimeOrders}
      />

      {/* 2. Payment Channel, Fulfillment Health & Monthly Expenses */}
      {canViewStatus && (
        <PaymentAndFulfillmentCard
          canViewRevenue={canViewRevenue}
          canViewExpenses={canSeeExpenseData}
          prepaidCount={prepaidCount}
          prepaidRevenue={prepaidRevenue}
          codCount={codCount}
          codRevenue={codRevenue}
          fulfilledCount={fulfilledCount}
          unfulfilledCount={unfulfilledCount}
          partiallyFulfilledCount={partiallyFulfilledCount}
          totalMtdExpenses={totalMtdExpenses}
          mtdExpensesCount={mtdExpensesCount}
          monthlyBillsPaidAmount={monthlyBillsPaidAmount}
          monthlyBillsPendingAmount={monthlyBillsPendingAmount}
          monthlyBillsPaidCount={monthlyBillsPaidCount}
          monthlyBillsTotalCount={monthlyBillsTotalCount}
          recentMonthlyBills={recentMonthlyBills}
        />
      )}

      {/* 3. Daily Sales Chart */}
      {canViewChart && (
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">Daily Performance Trend</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Order volume and daily distribution for current month</p>
            </div>
            {canViewRevenueReports && (
              <Link
                href="/revenue"
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1 w-fit"
              >
                <span>Full Analytics</span>
                <ArrowUpRight size={13} />
              </Link>
            )}
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
      )}

      {/* 4. Two-Column Operational Detail Grids: Recent Orders & Top Products */}
      {(canViewRecentOrders || canViewTopProducts) && (
        <div className={`grid grid-cols-1 ${canViewRecentOrders && canViewTopProducts ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* Recent Orders Live Feed */}
          {canViewRecentOrders && (
            <RecentOrdersWidget
              orders={recentOrders}
              canViewRevenue={canViewRevenue}
              canViewOrderDetails={canViewOrderDetails}
            />
          )}

          {/* Top Selling Products */}
          {canViewTopProducts && (
            <TopProductsWidget
              products={topProducts}
              canViewRevenue={canViewRevenue}
              canViewInventory={canViewInventory}
            />
          )}
        </div>
      )}
    </div>
  );
}
