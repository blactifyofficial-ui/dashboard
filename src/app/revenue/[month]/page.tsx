import { db } from '@/db';
import { orders } from '@/db/schema';
import { and, gte, lt } from 'drizzle-orm';
import { CalendarDays, Inbox, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RevenueChart from '@/components/RevenueChart';
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
    <div className="space-y-8 relative z-10">
      <header className="flex items-center gap-4">
        <Link href="/revenue" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
          <ArrowLeft size={20} className="text-white" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">{monthDisplay} Revenue</h1>
          <p className="text-neutral-400 text-sm">Overview and revenue breakdown for this month</p>
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
  // Get orders for this month
  const monthOrders = await db.select({
    createdAt: orders.createdAt,
    totalPrice: orders.totalPrice
  })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lt(orders.createdAt, endDate)
      )
    );

  // Calculate daily data for the chart
  const dailyDataMap = new Map<number, number>();
  
  // Initialize all days of the month to 0
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    dailyDataMap.set(i, 0);
  }
  
  let totalRevenue = 0;
  
  monthOrders.forEach((order) => {
    if (order.createdAt && order.totalPrice) {
      const day = new Date(order.createdAt).getDate();
      const revenue = parseFloat(order.totalPrice);
      dailyDataMap.set(day, (dailyDataMap.get(day) || 0) + revenue);
      totalRevenue += revenue;
    }
  });
  
  const chartData = Array.from(dailyDataMap.entries()).map(([day, revenue]) => ({
    day: `${day} ${startDate.toLocaleDateString('en-US', { month: 'short' })}`,
    revenue
  }));

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CalendarDays size={100} />
          </div>
          <div className="relative z-10 space-y-2">
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-4xl font-bold text-white tracking-tight">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Inbox size={100} />
          </div>
          <div className="relative z-10 space-y-2">
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-4xl font-bold text-white tracking-tight">
              {monthOrders.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-2xl relative">
        <h2 className="text-xl font-semibold text-white tracking-tight mb-6">Daily Revenue</h2>
        <RevenueChart data={chartData} />
      </div>
    </>
  );
}
