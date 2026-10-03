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
          className="min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors border border-white/10 shrink-0"
        >
          <ArrowLeft size={18} className="text-white" />
        </Link>
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{monthDisplay} Revenue</h1>
          <p className="text-neutral-400 text-[11px] sm:text-xs">Overview and order breakdown for this month</p>
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
  const dailyDataMap = new Map<number, number>();
  
  // Initialize all days of the month to 0
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    dailyDataMap.set(i, 0);
  }
  
  let totalRevenue = 0;
  let normalOrdersCount = 0;
  let normalRevenue = 0;
  let codOrdersCount = 0;
  let codRevenue = 0;
  
  monthOrders.forEach((order) => {
    if (order.totalPrice) {
      const revenue = parseFloat(order.totalPrice) || 0;
      totalRevenue += revenue;

      if (order.createdAt) {
        const day = new Date(order.createdAt).getDate();
        dailyDataMap.set(day, (dailyDataMap.get(day) || 0) + revenue);
      }

      if (isCodOrder(order)) {
        codOrdersCount++;
        codRevenue += revenue;
      } else {
        normalOrdersCount++;
        normalRevenue += revenue;
      }
    }
  });
  
  const chartData = Array.from(dailyDataMap.entries()).map(([day, revenue]) => ({
    day: `${day} ${startDate.toLocaleDateString('en-US', { month: 'short' })}`,
    revenue
  }));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Revenue */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-4 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Total Revenue</p>
            <CalendarDays size={16} className="text-neutral-500 shrink-0 opacity-70" />
          </div>
          <div className="my-1 sm:my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 pt-1.5 border-t border-white/5 truncate">
            Across {monthOrders.length} orders
          </p>
        </div>
        
        {/* Total Orders */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-4 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Total Orders</p>
            <Inbox size={16} className="text-neutral-500 shrink-0 opacity-70" />
          </div>
          <div className="my-1 sm:my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
              {monthOrders.length}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 pt-1.5 border-t border-white/5 truncate">
            Avg: ₹{(monthOrders.length > 0 ? totalRevenue / monthOrders.length : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} / order
          </p>
        </div>

        {/* Normal / Prepaid Orders */}
        <div className="bg-white/[0.02] border border-emerald-500/20 rounded-2xl p-3 sm:p-4 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 uppercase tracking-wider truncate">Normal (Prepaid)</p>
            </div>
            <CreditCard size={16} className="text-emerald-400 shrink-0 opacity-80" />
          </div>
          <div className="my-1 sm:my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
              ₹{normalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 pt-1.5 border-t border-white/5 truncate">
            <strong className="text-emerald-300 font-semibold">{normalOrdersCount}</strong> {normalOrdersCount === 1 ? 'order' : 'orders'} ({monthOrders.length > 0 ? Math.round((normalOrdersCount / monthOrders.length) * 100) : 0}%)
          </p>
        </div>

        {/* COD Orders */}
        <div className="bg-white/[0.02] border border-amber-500/20 rounded-2xl p-3 sm:p-4 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
              <p className="text-[10px] sm:text-[11px] font-semibold text-amber-400 uppercase tracking-wider truncate">COD Orders</p>
            </div>
            <Banknote size={16} className="text-amber-400 shrink-0 opacity-80" />
          </div>
          <div className="my-1 sm:my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
              ₹{codRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 pt-1.5 border-t border-white/5 truncate">
            <strong className="text-amber-300 font-semibold">{codOrdersCount}</strong> {codOrdersCount === 1 ? 'order' : 'orders'} ({monthOrders.length > 0 ? Math.round((codOrdersCount / monthOrders.length) * 100) : 0}%)
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 sm:p-5 shadow-xl relative overflow-hidden">
        <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight mb-2 sm:mb-3">Daily Revenue</h2>
        <RevenueChart data={chartData} />
      </div>

      {/* Detailed Orders Breakdown Table */}
      <MonthOrdersTable orders={monthOrders} />
    </div>
  );
}

