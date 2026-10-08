import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { sql, desc, ilike } from 'drizzle-orm';
import { CalendarDays, ShoppingBag, ArrowUpRight } from 'lucide-react';
import SearchInput from '@/components/SearchInput';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

import { requirePermission } from '@/lib/auth-utils';
import AccessDenied from '@/components/AccessDenied';

export const dynamic = "force-dynamic";

export default async function RevenuePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const authRes = await requirePermission('revenue:view');
  if ('error' in authRes) {
    return <AccessDenied message="You do not have permission to view revenue and sales performance." />;
  }

  const searchParams = await props.searchParams;
  const tab = (searchParams.tab as string) || 'monthly';
  const q = (searchParams.q as string) || '';

  return (
    <div className="flex flex-col h-full space-y-4 sm:space-y-6 relative z-10">
      <header className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Revenue</h1>
          <p className="text-neutral-400 text-xs sm:text-sm">Breakdown of sales, orders, and product performance</p>
        </div>
      </header>

      <div className="flex-none flex flex-wrap sm:flex-nowrap gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-lg w-full sm:w-fit">
        <Link 
          href="/revenue?tab=monthly" 
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 min-h-[36px] rounded-md text-xs sm:text-sm font-medium transition-colors ${
            tab === 'monthly' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <CalendarDays size={15} className="shrink-0" />
          <span>Monthly Breakdown</span>
        </Link>
        <Link 
          href="/revenue?tab=products" 
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 min-h-[36px] rounded-md text-xs sm:text-sm font-medium transition-colors ${
            tab === 'products' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShoppingBag size={15} className="shrink-0" />
          <span>Product Performance</span>
        </Link>
      </div>

      <Suspense fallback={<LoadingSpinner />} key={`${tab}-${q}-${searchParams.page}`}>
        <RevenueContent searchParams={searchParams} tab={tab} q={q} />
      </Suspense>
    </div>
  );
}

async function RevenueContent({ searchParams, tab, q }: { searchParams: { [key: string]: string | string[] | undefined }, tab: string, q: string }) {
  const page = parseInt((searchParams.page as string) || '1', 10);
  const pageSize = 15;
  const offset = (page - 1) * pageSize;

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

    return (
      <div className="flex-1 min-h-0 flex flex-col bg-neutral-900/60 border border-neutral-800 rounded-xl relative overflow-hidden">
        <div className="flex-none p-4 sm:px-6 sm:py-4 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-neutral-900/80">
          <h2 className="text-base font-semibold text-white">Monthly Breakdown</h2>
          <div className="w-full md:w-auto">
            <SearchInput initialQuery={q} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {monthlyData.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
                <CalendarDays size={24} />
              </div>
              <p className="text-sm font-medium text-neutral-300">No revenue data available yet.</p>
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
                <Link 
                  href={`/revenue/${data.month}`} 
                  key={idx} 
                  className="block group relative bg-neutral-900/40 border border-neutral-800/80 rounded-lg hover:bg-neutral-900 hover:border-neutral-700 transition-colors overflow-hidden"
                >
                  {/* Subtle Progress Bar */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-white/[0.03] group-hover:bg-white/[0.05] transition-colors z-0"
                    style={{ width: `${percent}%` }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 p-3.5 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700/60 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs text-white font-semibold uppercase">{monthShort}</span>
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-white">{monthDisplay}</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {Number(data.orderCount)} {Number(data.orderCount) === 1 ? 'order' : 'orders'} completed
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:items-end">
                      <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Revenue</p>
                      <p className="text-lg sm:text-xl font-semibold font-mono text-white tracking-tight">
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

    return (
      <div className="flex-1 min-h-0 flex flex-col bg-neutral-900/60 border border-neutral-800 rounded-xl relative overflow-hidden">
        <div className="flex-none p-4 sm:px-6 sm:py-4 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-neutral-900/80">
          <h2 className="text-base font-semibold text-white">Product Performance</h2>
          <div className="w-full md:w-auto">
            <SearchInput initialQuery={q} />
          </div>
        </div>
        <div className="flex-1 min-h-0 relative z-10 w-full overflow-x-auto overflow-y-auto">
          <table className="w-full text-sm text-left min-w-[500px]">
            <thead className="sticky top-0 text-xs text-neutral-400 uppercase tracking-wider bg-neutral-900 border-b border-neutral-800 z-20">
              <tr>
                <th className="px-4 sm:px-6 py-3 font-medium">Product</th>
                <th className="px-4 sm:px-6 py-3 font-medium text-center">Units Sold</th>
                <th className="px-4 sm:px-6 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {productData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 sm:px-6 py-16 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
                        <ShoppingBag size={24} />
                      </div>
                      <p className="text-sm font-medium text-neutral-300">No product data available yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                productData.map((data, idx) => (
                  <tr key={idx} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 font-medium text-white">
                      <div className="flex items-center gap-3">
                        {data.imageUrl ? (
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                            <Image 
                              src={data.imageUrl} 
                              alt={data.title || 'Product'} 
                              fill
                              sizes="32px"
                              className="object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-white shrink-0 text-xs font-semibold">
                            {data.title ? data.title.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <Link href={`https://fvprhj-0y.myshopify.com/products/${data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-white flex items-center gap-1 group/link max-w-[200px] sm:max-w-xs md:max-w-md">
                          <span className="truncate">{data.title || 'Unknown Product'}</span>
                          <ArrowUpRight size={13} className="text-neutral-500 group-hover/link:text-white transition-colors shrink-0" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-white text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700/60 text-xs font-mono text-neutral-200">
                        {Number(data.unitsSold)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-right font-medium text-white text-sm whitespace-nowrap font-mono">
                      ₹{Number(data.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex-none p-3.5 sm:px-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-3 bg-neutral-900/60 relative z-10">
            <div className="text-xs text-neutral-400">
              Showing <span className="font-medium text-white">{totalProducts === 0 ? 0 : offset + 1}</span> to <span className="font-medium text-white">{Math.min(offset + pageSize, totalProducts)}</span> of <span className="font-medium text-white">{totalProducts}</span> products
            </div>
            <div className="flex space-x-2 w-full sm:w-auto justify-end">
              {page > 1 ? (
                <Link
                  href={`/revenue?tab=products&page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className="flex-1 sm:flex-initial text-center px-3.5 py-1.5 min-h-[36px] flex items-center justify-center border border-neutral-800 bg-neutral-900 text-neutral-200 rounded-lg hover:bg-neutral-800 text-xs sm:text-sm font-medium transition-colors"
                >
                  Previous
                </Link>
              ) : (
                <button disabled className="flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[36px] flex items-center justify-center border border-neutral-900 bg-neutral-900/50 text-neutral-600 rounded-lg text-xs sm:text-sm font-medium cursor-not-allowed">
                  Previous
                </button>
              )}
              
              {page < totalPages ? (
                <Link
                  href={`/revenue?tab=products&page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className="flex-1 sm:flex-initial text-center px-3.5 py-1.5 min-h-[36px] flex items-center justify-center border border-neutral-800 bg-neutral-900 text-neutral-200 rounded-lg hover:bg-neutral-800 text-xs sm:text-sm font-medium transition-colors"
                >
                  Next
                </Link>
              ) : (
                <button disabled className="flex-1 sm:flex-initial px-3.5 py-1.5 min-h-[36px] flex items-center justify-center border border-neutral-900 bg-neutral-900/50 text-neutral-600 rounded-lg text-xs sm:text-sm font-medium cursor-not-allowed">
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

