import { db } from '@/db';
import { orders, orderItems, expenses } from '@/db/schema';
import { sql, desc, ilike, isNull } from 'drizzle-orm';
import { CalendarDays, ShoppingBag, ArrowUpRight } from 'lucide-react';
import SearchInput from '@/components/SearchInput';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

import { requireAuth } from '@/lib/auth-utils';
import { hasPermission, canAccessRoute } from '@/lib/rbac';
import AccessDenied from '@/components/AccessDenied';
import { redirect } from 'next/navigation';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = "force-dynamic";

export default async function RevenuePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const authRes = await requireAuth();
  if (authRes.error) {
    if (authRes.status === 401) {
      redirect('/login');
    }
    return <AccessDenied message={authRes.error} />;
  }

  if (!canAccessRoute(authRes.role, '/revenue', authRes.permissions)) {
    return <AccessDenied message="You do not have permission to view revenue and sales performance." />;
  }

  const canViewRevenueLedger = hasPermission(authRes.role, 'revenue:view', authRes.permissions);
  const canViewProducts = hasPermission(authRes.role, 'revenue:view_products', authRes.permissions);
  const canViewExpenses = hasPermission(authRes.role, 'expenses:view', authRes.permissions);

  const searchParams = await props.searchParams;
  let tab = (searchParams.tab as string) || (canViewRevenueLedger ? 'monthly' : 'products');
  if (tab === 'monthly' && !canViewRevenueLedger) {
    tab = 'products';
  }
  if (tab === 'products' && !canViewProducts) {
    tab = 'monthly';
  }
  const q = (searchParams.q as string) || '';

  return (
    <div className="flex flex-col h-full space-y-4 sm:space-y-6 relative z-10 text-foreground">
      <header className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Revenue</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Breakdown of sales, orders, and product performance</p>
        </div>
      </header>

      {(canViewRevenueLedger || canViewProducts) && (
        <div className="flex-none flex flex-wrap sm:flex-nowrap gap-1 bg-muted border border-border p-1 rounded-lg w-full sm:w-fit">
          {canViewRevenueLedger && (
            <Link 
              href="/revenue?tab=monthly" 
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 min-h-[36px] rounded-md text-xs sm:text-sm font-medium transition-colors ${
                tab === 'monthly' ? 'bg-card text-foreground font-semibold shadow-xs border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays size={15} className="shrink-0" />
              <span>Monthly Breakdown</span>
            </Link>
          )}
          {canViewProducts && (
            <Link 
              href="/revenue?tab=products" 
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 min-h-[36px] rounded-md text-xs sm:text-sm font-medium transition-colors ${
                tab === 'products' ? 'bg-card text-foreground font-semibold shadow-xs border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingBag size={15} className="shrink-0" />
              <span>Product Performance</span>
            </Link>
          )}
        </div>
      )}

      <Suspense fallback={<LoadingSpinner />} key={`${tab}-${q}-${searchParams.page}`}>
        <RevenueContent
          searchParams={searchParams}
          tab={tab}
          q={q}
          canViewExpenses={canViewExpenses}
          canViewRevenueLedger={canViewRevenueLedger}
          canViewProducts={canViewProducts}
        />
      </Suspense>
    </div>
  );
}

async function RevenueContent({ 
  searchParams, 
  tab, 
  q, 
  canViewExpenses,
  canViewRevenueLedger,
  canViewProducts,
}: { 
  searchParams: { [key: string]: string | string[] | undefined }, 
  tab: string, 
  q: string, 
  canViewExpenses: boolean,
  canViewRevenueLedger: boolean,
  canViewProducts: boolean,
}) {
  const page = parseInt((searchParams.page as string) || '1', 10);
  const pageSize = 15;
  const offset = (page - 1) * pageSize;

  if (tab === 'monthly') {
    if (!canViewRevenueLedger) {
      return <AccessDenied message="You do not have permission to view monthly revenue reports." />;
    }
    const whereClause = q ? ilike(sql<string>`to_char(${orders.createdAt} AT TIME ZONE 'Asia/Kolkata', 'FMMonth YYYY')`, `%${q}%`) : undefined;

    const monthlyData = await db.select({
      month: sql<string>`to_char(date_trunc('month', ${orders.createdAt} AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM')`,
      revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)`,
      orderCount: sql<number>`COUNT(*)`
    })
    .from(orders)
    .where(whereClause)
    .groupBy(sql`date_trunc('month', ${orders.createdAt} AT TIME ZONE 'Asia/Kolkata')`)
    .orderBy(desc(sql`date_trunc('month', ${orders.createdAt} AT TIME ZONE 'Asia/Kolkata')`));

    // Fetch monthly expenses if the user has permission to view expenses
    const monthlyExpensesMap = new Map<string, number>();
    if (canViewExpenses) {
      const expensesList = await db.select({
        month: sql<string>`to_char(date_trunc('month', ${expenses.expenseDate} AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM')`,
        totalExpense: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS NUMERIC)), 0)`
      })
      .from(expenses)
      .where(isNull(expenses.deletedAt))
      .groupBy(sql`date_trunc('month', ${expenses.expenseDate} AT TIME ZONE 'Asia/Kolkata')`);

      for (const exp of expensesList) {
        if (exp.month) {
          monthlyExpensesMap.set(exp.month, Number(exp.totalExpense || 0));
        }
      }
    }

    const maxRevenue = Math.max(...monthlyData.map(d => Number(d.revenue)), 0);

    return (
      <div className="flex-1 min-h-0 flex flex-col bg-card border border-border rounded-xl relative overflow-hidden shadow-xs">
        <div className="flex-none p-4 sm:px-6 sm:py-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-muted/40">
          <div>
            <h2 className="text-base font-semibold text-foreground">Monthly Breakdown</h2>
            <p className="text-xs text-muted-foreground">Monthly sales, operational expenses, and net profit margins</p>
          </div>
          <div className="w-full md:w-auto">
            <SearchInput initialQuery={q} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {monthlyData.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                <CalendarDays size={24} />
              </div>
              <p className="text-sm font-medium text-foreground">No revenue data available yet.</p>
            </div>
          ) : (
            monthlyData.map((data, idx) => {
              const [year, month] = (data.month || '').split('-');
              const dateObj = year && month ? new Date(parseInt(year), parseInt(month) - 1) : null;
              const monthDisplay = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';
              const monthShort = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short' }) : '-';
              
              const revenueNum = Number(data.revenue);
              const expenseNum = monthlyExpensesMap.get(data.month) || 0;
              const netProfitNum = revenueNum - expenseNum;
              const profitMargin = revenueNum > 0 ? Math.round((netProfitNum / revenueNum) * 100) : 0;
              const percent = maxRevenue > 0 ? (revenueNum / maxRevenue) * 100 : 0;

              return (
                <Link 
                  href={`/revenue/${data.month}`} 
                  key={idx} 
                  className="block group relative bg-muted/30 border border-border rounded-lg hover:bg-muted/60 hover:border-border transition-colors overflow-hidden"
                >
                  {/* Subtle Progress Bar */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary/[0.04] group-hover:bg-primary/[0.08] transition-colors z-0"
                    style={{ width: `${percent}%` }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 p-3.5 sm:px-5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs text-foreground font-semibold uppercase">{monthShort}</span>
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-foreground">{monthDisplay}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {Number(data.orderCount)} {Number(data.orderCount) === 1 ? 'order' : 'orders'} completed
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 self-start md:self-auto">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
                        <p className="text-base sm:text-lg font-semibold font-mono text-foreground tracking-tight">
                          ₹{revenueNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>

                      {canViewExpenses && (
                        <>
                          <div className="text-left md:text-right">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Expenses</p>
                            <p className="text-base sm:text-lg font-semibold font-mono text-muted-foreground tracking-tight">
                              ₹{expenseNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>

                          <div className="text-left md:text-right min-w-[120px]">
                            <div className="flex items-center gap-1.5 justify-start md:justify-end">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Net Profit</p>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                netProfitNum >= 0 
                                  ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400' 
                                  : 'text-rose-700 bg-rose-500/10 dark:text-rose-400'
                              }`}>
                                {profitMargin >= 0 ? `+${profitMargin}%` : `${profitMargin}%`}
                              </span>
                            </div>
                            <p className={`text-base sm:text-lg font-bold font-mono tracking-tight ${
                              netProfitNum >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              ₹{netProfitNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </>
                      )}

                      <div className="hidden sm:flex items-center text-muted-foreground group-hover:text-foreground transition-colors pl-1">
                        <ArrowUpRight size={16} />
                      </div>
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
    if (!canViewProducts) {
      return <AccessDenied message="You do not have permission to view product performance." />;
    }
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
      <div className="flex-1 min-h-0 flex flex-col bg-card border border-border rounded-xl relative overflow-hidden shadow-xs">
        <div className="flex-none p-4 sm:px-6 sm:py-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-muted/40">
          <h2 className="text-base font-semibold text-foreground">Product Performance</h2>
          <div className="w-full md:w-auto">
            <SearchInput initialQuery={q} />
          </div>
        </div>
        <div className="flex-1 min-h-0 relative z-10 w-full overflow-x-auto overflow-y-auto">
          <Table className="min-w-[500px]">
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-none z-20">
              <TableRow>
                <TableHead className="font-semibold text-xs">Product</TableHead>
                <TableHead className="font-semibold text-xs text-center w-28">Units Sold</TableHead>
                <TableHead className="font-semibold text-xs text-right w-36">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                        <ShoppingBag size={20} />
                      </div>
                      <p className="text-sm font-medium text-foreground">No product sales recorded yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                productData.map((data, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        {data.imageUrl ? (
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                            <Image 
                              src={data.imageUrl} 
                              alt={data.title || 'Product'} 
                              fill
                              sizes="36px"
                              className="object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground shrink-0 text-xs font-semibold">
                            {data.title ? data.title.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <Link href={`https://fvprhj-0y.myshopify.com/products/${data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary transition-colors text-foreground flex items-center gap-1 group/link max-w-[200px] sm:max-w-xs md:max-w-md">
                          <span className="truncate text-xs sm:text-sm font-medium">{data.title || 'Unknown Product'}</span>
                          <ArrowUpRight size={13} className="text-muted-foreground group-hover/link:text-primary transition-colors shrink-0" />
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="neutral" size="sm" className="font-mono">
                        {Number(data.unitsSold)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground text-xs sm:text-sm whitespace-nowrap font-mono">
                      ₹{Number(data.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex-none p-3.5 sm:px-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 bg-muted/20 relative z-10">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium font-mono text-foreground">{totalProducts === 0 ? 0 : offset + 1}</span> to <span className="font-medium font-mono text-foreground">{Math.min(offset + pageSize, totalProducts)}</span> of <span className="font-medium font-mono text-foreground">{totalProducts}</span> products
            </div>
            <div className="flex space-x-2 w-full sm:w-auto justify-end">
              {page > 1 ? (
                <Button
                  variant="outline"
                  size="xs"
                  asChild
                >
                  <Link href={`/revenue?tab=products&page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="xs" disabled>
                  Previous
                </Button>
              )}
              
              {page < totalPages ? (
                <Button
                  variant="outline"
                  size="xs"
                  asChild
                >
                  <Link href={`/revenue?tab=products&page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
                    Next
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="xs" disabled>
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
