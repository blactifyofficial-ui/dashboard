import { db } from '@/db';
import { orders } from '@/db/schema';
import { desc, and, gte, lt } from 'drizzle-orm';
import { CalendarDays, Inbox, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import RevenueChart from '@/components/RevenueChart';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export const dynamic = "force-dynamic";

export default async function MonthRevenuePage(props: {
  params: Promise<{ month: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page as string || '1', 10);
  const pageSize = 15;
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
          <p className="text-neutral-400 text-sm">Overview and orders for this month</p>
        </div>
      </header>

      <Suspense fallback={<LoadingSpinner />} key={`${monthParam}-${page}`}>
        <MonthRevenueContent year={year} month={month} monthParam={monthParam} page={page} pageSize={pageSize} monthDisplay={monthDisplay} startDate={startDate} endDate={endDate} />
      </Suspense>
    </div>
  );
}

async function MonthRevenueContent({ year, month, monthParam, page, pageSize, monthDisplay, startDate, endDate }: {
  year: number;
  month: number;
  monthParam: string;
  page: number;
  pageSize: number;
  monthDisplay: string;
  startDate: Date;
  endDate: Date;
}) {
  // Get orders for this month
  const monthOrders = await db.select()
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
  
  monthOrders.forEach((order: typeof monthOrders[0]) => {
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

      {/* Orders Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-semibold text-white tracking-tight">Orders in {monthDisplay}</h2>
        </div>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-neutral-400 uppercase tracking-wider bg-white/[0.01] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Order</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Payment</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {monthOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                    No orders found for this month.
                  </td>
                </tr>
              ) : (
                monthOrders.slice((page - 1) * pageSize, page * pageSize).map((order: typeof monthOrders[0]) => (
                  <tr key={order.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4 font-medium text-white group-hover:text-neutral-300">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        #{order.orderNumber || order.id.substring(0,6)}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{order.customerName || 'Guest'}</div>
                      <div className="text-xs text-neutral-400 mt-1">{order.customerEmail || 'No email provided'}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'}) : 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${
                        order.financialStatus === 'paid' ? 'bg-white/10 text-white border-white/20' : 
                        'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}>
                        {order.financialStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${
                        order.fulfillmentStatus === 'fulfilled' ? 'bg-white/10 text-white border-white/20' : 
                        'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}>
                        {order.fulfillmentStatus || 'unfulfilled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-white">
                      {order.totalPrice ? `₹${parseFloat(order.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {monthOrders.length > 0 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              {page > 1 ? (
                <Link
                  href={`/revenue/${monthParam}?page=${page - 1}`}
                  className="px-4 py-2 bg-white/5 text-white rounded hover:bg-white/10 transition-colors border border-white/10 text-sm"
                >
                  Previous
                </Link>
              ) : (
                <button disabled className="px-4 py-2 bg-white/5 text-neutral-500 rounded border border-white/5 text-sm cursor-not-allowed">
                  Previous
                </button>
              )}
              
              <span className="text-neutral-400 text-sm">
                Page {page} of {Math.ceil(monthOrders.length / pageSize)}
              </span>
              
              {page < Math.ceil(monthOrders.length / pageSize) ? (
                <Link
                  href={`/revenue/${monthParam}?page=${page + 1}`}
                  className="px-4 py-2 bg-white/5 text-white rounded hover:bg-white/10 transition-colors border border-white/10 text-sm"
                >
                  Next
                </Link>
              ) : (
                <button disabled className="px-4 py-2 bg-white/5 text-neutral-500 rounded border border-white/5 text-sm cursor-not-allowed">
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
