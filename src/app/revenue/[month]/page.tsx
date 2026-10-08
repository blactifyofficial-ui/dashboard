import { db } from '@/db';
import { orders } from '@/db/schema';
import { and, gte, lt, desc } from 'drizzle-orm';
import { CalendarDays, Inbox, ArrowLeft, CreditCard, Banknote } from 'lucide-react';
import Link from 'next/link';
import RevenueChart from '@/components/RevenueChart';
import MonthOrdersTable from '@/components/MonthOrdersTable';
import { isCodOrder } from '@/lib/order-utils';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export const dynamic = "force-dynamic";

export default async function MonthRevenuePage(props: {
  params: Promise<{ month: string }>;
}) {
  const params = await props.params;
  const monthParam = params.month; // e.g. "2026-09"
  
  const [yearStr, monthStr] = monthParam.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  
  if (isNaN(year) || isNaN(month)) {
    return <div>Invalid month</div>;
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  
  const monthDisplay = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10">
      <header className="flex items-center gap-2.5 sm:gap-3">
        <Link 
          href="/revenue" 
          aria-label="Back to Revenue"
          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors border border-neutral-700 shrink-0"
        >
          <ArrowLeft size={16} className="text-white" />
        </Link>
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{monthDisplay} Revenue</h1>
          <p className="text-neutral-400 text-xs">Overview and order breakdown for this month</p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />}>
        <MonthRevenueContent year={year} month={month} startDate={startDate} endDate={endDate} />
      </Suspense>
    </div>
  );
}

async function MonthRevenueContent({ year, month, startDate, endDate }: {
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
}) {
  // Get orders for this month with all details
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
  })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lt(orders.createdAt, endDate)
      )
    )
    .orderBy(desc(orders.createdAt));

  // Calculate daily data for the chart
  const dailyDataMap = new Map<number, { revenue: number; ordersCount: number }>();
  
  // Initialize all days of the month to 0
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
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
      const day = new Date(order.createdAt).getDate();
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
  
  const chartData = Array.from(dailyDataMap.entries()).map(([day, val]) => ({
    day: `${day} ${startDate.toLocaleDateString('en-US', { month: 'short' })}`,
    revenue: val.revenue,
    ordersCount: val.ordersCount,
  }));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Revenue */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Total Revenue</p>
            <CalendarDays size={16} className="text-neutral-500 shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight font-mono">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800 truncate">
            Across {monthOrders.length} orders
          </p>
        </div>
        
        {/* Total Orders */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Total Orders</p>
            <Inbox size={16} className="text-neutral-500 shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight font-mono">
              {monthOrders.length}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800 truncate">
            Avg: ₹{(monthOrders.length > 0 ? totalRevenue / monthOrders.length : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} / order
          </p>
        </div>

        {/* Normal / Prepaid Orders */}
        <div className="bg-neutral-900/60 border border-emerald-500/30 rounded-xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 uppercase tracking-wider truncate">Normal (Prepaid)</p>
            </div>
            <CreditCard size={16} className="text-emerald-400 shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-emerald-400 tracking-tight font-mono">
              ₹{normalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800 truncate">
            <strong className="text-emerald-300 font-semibold">{normalOrdersCount}</strong> {normalOrdersCount === 1 ? 'order' : 'orders'} ({monthOrders.length > 0 ? Math.round((normalOrdersCount / monthOrders.length) * 100) : 0}%)
          </p>
        </div>

        {/* COD Orders */}
        <div className="bg-neutral-900/60 border border-amber-500/30 rounded-xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
              <p className="text-[10px] sm:text-[11px] font-semibold text-amber-400 uppercase tracking-wider truncate">COD Orders</p>
            </div>
            <Banknote size={16} className="text-amber-400 shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-amber-400 tracking-tight font-mono">
              ₹{codRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800 truncate">
            <strong className="text-amber-300 font-semibold">{codOrdersCount}</strong> {codOrdersCount === 1 ? 'order' : 'orders'} ({monthOrders.length > 0 ? Math.round((codOrdersCount / monthOrders.length) * 100) : 0}%)
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 sm:p-5 shadow-sm relative overflow-hidden">
        <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight mb-2 sm:mb-3">Daily Revenue</h2>
        <RevenueChart data={chartData} />
      </div>

      {/* Detailed Orders Breakdown Table */}
      <MonthOrdersTable orders={monthOrders} />
    </div>
  );
}

