import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { sql, desc, ilike } from 'drizzle-orm';
import { CalendarDays, ShoppingBag, ArrowUpRight } from 'lucide-react';
import SearchInput from '@/components/SearchInput';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function RevenuePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const tab = (searchParams.tab as string) || 'monthly';
  const q = (searchParams.q as string) || '';
  const page = parseInt((searchParams.page as string) || '1', 10);
  const pageSize = 15;
  const offset = (page - 1) * pageSize;

  let content;

  if (tab === 'monthly') {
    const whereClause = q ? ilike(sql<string>`to_char(${orders.createdAt}, 'FMMonth YYYY')`, `%${q}%`) : undefined;

    const monthlyData = await db.select({
      month: sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'YYYY-MM')`,
      revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)`,
      orderCount: sql<number>`COUNT(*)`
    })
    .from(orders)
    .where(whereClause)
    .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
    .orderBy(desc(sql`date_trunc('month', ${orders.createdAt})`));

    const maxRevenue = Math.max(...monthlyData.map(d => Number(d.revenue)), 0);

    content = (
      <div className="flex-1 min-h-0 flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <div className="flex-none p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 bg-black/50">
          <h2 className="text-xl font-semibold text-white tracking-tight">Monthly Breakdown</h2>
          <div className="w-full md:w-auto">
            <SearchInput initialQuery={q} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 relative z-10">
          {monthlyData.length === 0 ? (
            <div className="py-20 text-center text-neutral-400 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
                <CalendarDays size={32} className="text-white/50"/>
              </div>
              <p className="text-lg font-medium text-white/80">No data available yet.</p>
            </div>
          ) : (
            monthlyData.map((data, idx) => {
              const [year, month] = (data.month || '').split('-');
              const dateObj = year && month ? new Date(parseInt(year), parseInt(month) - 1) : null;
              const monthDisplay = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';
              const monthShort = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short' }) : '-';
              
              const revenueNum = Number(data.revenue);
              const percent = maxRevenue > 0 ? (revenueNum / maxRevenue) * 100 : 0;

              return (
                <Link href={`/revenue/${data.month}`} key={idx} className="block group relative bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 shadow-sm hover:shadow-xl">
                  {/* Progress Bar Background */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-white/[0.05] group-hover:bg-white/[0.08] transition-all duration-700 ease-out z-0 rounded-l-2xl"
                    style={{ width: `${percent}%` }}
                  ></div>
                  
                  {/* Content */}
                  <div className="relative z-10 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center shadow-lg group-hover:scale-105 group-hover:bg-white/10 transition-all duration-300">
                        <span className="text-xs text-white font-bold tracking-wider uppercase">{monthShort}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white tracking-tight">{monthDisplay}</h3>
                        <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white transition-colors duration-300"></span>
                          {Number(data.orderCount)} {Number(data.orderCount) === 1 ? 'order' : 'orders'} completed
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end">
                      <p className="text-[10px] font-medium text-neutral-500 mb-0.5 uppercase tracking-wider">Revenue</p>
                      <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
                        ₹{revenueNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    );
  } else if (tab === 'products') {
    const whereClause = q ? ilike(orderItems.title, `%${q}%`) : undefined;

    const [totalResult] = await db.select({
      totalProducts: sql<number>`count(distinct ${orderItems.title})`
    })
    .from(orderItems)
    .where(whereClause);

    const totalProducts = Number(totalResult.totalProducts) || 0;
    const totalPages = Math.ceil(totalProducts / pageSize);

    const productData = await db.select({
      title: orderItems.title,
      imageUrl: sql<string>`MAX(${orderItems.imageUrl})`,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.price} AS NUMERIC) * CAST(${orderItems.quantity} AS NUMERIC)), 0)`,
      unitsSold: sql<number>`COALESCE(SUM(CAST(${orderItems.quantity} AS NUMERIC)), 0)`
    })
    .from(orderItems)
    .where(whereClause)
    .groupBy(orderItems.title)
    .orderBy(desc(sql`COALESCE(SUM(CAST(${orderItems.price} AS NUMERIC) * CAST(${orderItems.quantity} AS NUMERIC)), 0)`))
    .limit(pageSize)
    .offset(offset);

    content = (
      <div className="flex-1 min-h-0 flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <div className="flex-none p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 bg-black/50">
          <h2 className="text-xl font-semibold text-white tracking-tight">Product Performance</h2>
          <div className="w-full md:w-auto">
            <SearchInput initialQuery={q} />
          </div>
        </div>
        <div className="flex-1 min-h-0 relative z-10 w-full overflow-auto no-scrollbar">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="sticky top-0 text-xs text-neutral-400 uppercase tracking-wider bg-neutral-950/80 backdrop-blur-md border-b border-white/5 z-20 shadow-sm">
              <tr>
                <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Product</th>
                <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-center">Units Sold</th>
                <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {productData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 md:px-8 py-10 md:py-20 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
                        <ShoppingBag size={32} className="text-white/50"/>
                      </div>
                      <p className="text-lg font-medium text-white/80">No product data available yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                productData.map((data, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.03] transition-colors duration-200 group">
                    <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-white group-hover:text-neutral-300 transition-colors">
                      <div className="flex items-center gap-3">
                        {data.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={data.imageUrl} alt={data.title || 'Product'} className="w-8 h-8 rounded-lg object-cover bg-white/5 border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                            {data.title ? data.title.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <Link href={`https://fvprhj-0y.myshopify.com/products/${data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-white flex items-center gap-1 group/link">
                          {data.title || 'Unknown Product'}
                          <ArrowUpRight size={14} className="opacity-50 group-hover/link:opacity-100 transition-opacity shrink-0" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5 text-white text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/5 border border-white/5">
                        {Number(data.unitsSold)}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5 text-right font-semibold text-white text-lg whitespace-nowrap">
                      ₹{Number(data.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex-none p-4 md:px-8 md:py-5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/[0.01] relative z-10">
            <div className="text-sm text-neutral-400">
              Showing <span className="font-medium text-white">{totalProducts === 0 ? 0 : offset + 1}</span> to <span className="font-medium text-white">{Math.min(offset + pageSize, totalProducts)}</span> of <span className="font-medium text-white">{totalProducts}</span> products
            </div>
            <div className="flex space-x-2">
              {page > 1 ? (
                <Link
                  href={`/revenue?tab=products&page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className="px-5 py-2 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all"
                >
                  Previous
                </Link>
              ) : (
                <button disabled className="px-5 py-2 border border-white/5 bg-transparent text-neutral-600 rounded-xl text-sm font-medium cursor-not-allowed opacity-50">
                  Previous
                </button>
              )}
              
              {page < totalPages ? (
                <Link
                  href={`/revenue?tab=products&page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className="px-5 py-2 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all"
                >
                  Next
                </Link>
              ) : (
                <button disabled className="px-5 py-2 border border-white/5 bg-transparent text-neutral-600 rounded-xl text-sm font-medium cursor-not-allowed opacity-50">
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 relative z-10">
      <header className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Revenue</h1>
          <p className="text-neutral-400 text-sm md:text-base">Breakdown of sales, orders, and product performance</p>
        </div>
      </header>

      <div className="flex-none flex gap-2 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 w-fit">
        <Link 
          href="/revenue?tab=monthly" 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${tab === 'monthly' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
        >
          <CalendarDays size={18} />
          Monthly Breakdown
        </Link>
        <Link 
          href="/revenue?tab=products" 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${tab === 'products' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
        >
          <ShoppingBag size={18} />
          Product Performance
        </Link>
      </div>

      {content}
    </div>
  );
}
