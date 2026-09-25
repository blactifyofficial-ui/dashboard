import { db } from '@/db';
import { orders } from '@/db/schema';
import { desc, count, sql, ilike, or } from 'drizzle-orm';
import Link from 'next/link';
import { Inbox } from 'lucide-react';
import SearchInput from '@/components/SearchInput';
import OrdersChart from '@/components/OrdersChart';

export const dynamic = "force-dynamic"; // Disable static rendering for this page

export default async function Dashboard(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q as string || '';

  const whereClause = q ? or(
    ilike(orders.customerName, `%${q}%`),
    ilike(orders.customerEmail, `%${q}%`),
    ilike(orders.orderNumber, `%${q}%`)
  ) : undefined;

  const [totalResult] = await db.select({
    totalOrders: count(),
    totalSales: sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)`
  }).from(orders).where(whereClause);

  const totalOrders = totalResult.totalOrders;
  const totalSales = Number(totalResult.totalSales);

  const allOrders = await db.select().from(orders).where(whereClause).orderBy(desc(orders.createdAt)).limit(10);
  
  const ordersPerDayResult = await db.select({
    date: sql<string>`DATE(${orders.createdAt})`,
    count: sql<number>`CAST(COUNT(*) AS INTEGER)`
  })
  .from(orders)
  .where(whereClause)
  .groupBy(sql`DATE(${orders.createdAt})`)
  .orderBy(sql`DATE(${orders.createdAt})`);

  return (
    <div className="space-y-12 relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Sales Overview</h1>
          <p className="text-neutral-400 text-sm md:text-base flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/50 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white/80"></span>
            </span>
            Real-time sync with Shopify via Webhooks
          </p>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-xl hover:bg-white/[0.06] transition-all duration-500 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>
          <h2 className="text-sm font-medium text-neutral-400 mb-3 relative z-10">Total Revenue (All Time)</h2>
          <p className="text-5xl font-bold text-white tracking-tight relative z-10">₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-xl hover:bg-white/[0.06] transition-all duration-500 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>
          <h2 className="text-sm font-medium text-neutral-400 mb-3 relative z-10">Total Orders (All Time)</h2>
          <p className="text-5xl font-bold text-white tracking-tight relative z-10">{totalOrders.toLocaleString('en-IN')}</p>
        </div>
        <div className="group bg-neutral-900 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-black/50 flex flex-col justify-center relative overflow-hidden transform hover:-translate-y-1 transition-all duration-500">
          <div className="absolute inset-0 bg-black/10 opacity-20 mix-blend-overlay"></div>
          <h2 className="text-xs font-semibold text-white/80 mb-3 relative z-10 uppercase tracking-wider">System Status</h2>
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse"></div>
            </div>
            <p className="text-2xl font-semibold text-white">Listening for Webhooks</p>
          </div>
        </div>
      </div>
      
      {/* Chart Row */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-xl font-semibold text-white tracking-tight mb-6">Orders per Day</h2>
          {ordersPerDayResult.length > 0 ? (
            <OrdersChart data={ordersPerDayResult} />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
                 <Inbox size={32} className="text-white/50" />
              </div>
              <p className="text-lg font-medium text-white/80">No chart data available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <div className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white tracking-tight">Recent Orders</h2>
            <Link href="/orders" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              View All &rarr;
            </Link>
          </div>
          <SearchInput initialQuery={q} />
        </div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-400 uppercase tracking-wider bg-white/[0.01] border-b border-white/5">
              <tr>
                <th className="px-8 py-5 font-semibold">Order</th>
                <th className="px-8 py-5 font-semibold">Customer</th>
                <th className="px-8 py-5 font-semibold">Date</th>
                <th className="px-8 py-5 font-semibold">Payment</th>
                <th className="px-8 py-5 font-semibold">Status</th>
                <th className="px-8 py-5 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
                         <Inbox size={32} className="text-white/50" />
                      </div>
                      <p className="text-lg font-medium text-white/80">No orders found yet.</p>
                      <p className="text-sm text-neutral-500 max-w-sm">Once webhooks are received, they will appear here automatically in real-time.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                allOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.03] transition-colors duration-200 group">
                    <td className="px-8 py-5 font-medium text-white group-hover:text-neutral-300 transition-colors">#{order.orderNumber || order.id.substring(0,6)}</td>
                    <td className="px-8 py-5">
                      <div className="text-white font-medium">{order.customerName || 'Guest'}</div>
                      <div className="text-xs text-neutral-400 mt-1">{order.customerEmail || 'No email provided'}</div>
                    </td>
                    <td className="px-8 py-5 text-neutral-300">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
                        order.financialStatus === 'paid' ? 'bg-white/10 text-white border-white/20' : 
                        'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${order.financialStatus === 'paid' ? 'bg-white' : 'bg-neutral-400'}`}></span>
                        {order.financialStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
                        order.fulfillmentStatus === 'fulfilled' ? 'bg-white/10 text-white border-white/20' : 
                        'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${order.fulfillmentStatus === 'fulfilled' ? 'bg-white' : 'bg-neutral-400'}`}></span>
                        {order.fulfillmentStatus || 'unfulfilled'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-semibold text-white">
                      {order.totalPrice ? `₹${parseFloat(order.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        

      </div>
    </div>
  );
}

