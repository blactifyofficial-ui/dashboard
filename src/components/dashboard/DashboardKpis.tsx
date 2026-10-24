'use client';

import { TrendingUp, TrendingDown, Package, Clock, ShoppingBag, Receipt, CheckCircle2, AlertCircle, Wallet, Layers, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Badge } from '@/components/ui/badge';

export interface DashboardKpiProps {
  canViewRevenue: boolean;
  canViewRevenueReports?: boolean;
  canViewOrders: boolean;
  canViewStatus: boolean;
  canViewExpenses?: boolean;
  todaySales: number;
  todayOrders: number;
  yesterdaySales: number;
  yesterdayOrders: number;
  mtdSales: number;
  mtdOrders: number;
  totalMtdExpenses?: number;
  netRevenue?: number;
  monthlyBillsPaidCount?: number;
  monthlyBillsTotalCount?: number;
  aov: number;
  prepaidAov: number;
  codAov: number;
  unfulfilledOrders: number;
  totalAllTimeSales: number;
  totalAllTimeOrders: number;
  totalAllTimeExpenses?: number;
}

export default function DashboardKpis({
  canViewRevenue,
  canViewRevenueReports,
  canViewOrders,
  canViewStatus,
  canViewExpenses = false,
  todaySales,
  todayOrders,
  yesterdaySales,
  yesterdayOrders,
  mtdSales,
  mtdOrders,
  totalMtdExpenses = 0,
  netRevenue = 0,
  monthlyBillsPaidCount = 0,
  monthlyBillsTotalCount = 0,
  aov,
  prepaidAov,
  codAov,
  unfulfilledOrders,
  totalAllTimeSales,
  totalAllTimeOrders,
  totalAllTimeExpenses = 0,
}: DashboardKpiProps) {
  // Percentage change today vs yesterday
  const calcChange = (current: number, previous: number) => {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  };

  const revenueChange = calcChange(todaySales, yesterdaySales);
  const ordersChange = calcChange(todayOrders, yesterdayOrders);

  const fulfilledCount = Math.max(0, mtdOrders - unfulfilledOrders);
  const fulfillmentRate = mtdOrders > 0 ? Math.round((fulfilledCount / mtdOrders) * 100) : 100;

  const { hasPermission } = useAuth();
  const canSeeRevenueBreakdown = canViewRevenueReports !== undefined
    ? (canViewRevenueReports && canViewRevenue)
    : (canViewRevenue && hasPermission('revenue:view') && hasPermission('overview:view_revenue'));
  const canManageBills = hasPermission('monthly_expenses:view');

  const showExpensesCard = canViewExpenses && canViewRevenue;
  const netMargin = mtdSales > 0 ? Math.round((netRevenue / mtdSales) * 100) : 0;

  const canShowTodayCard = canViewRevenue || canViewOrders;
  const canShowMtdCard = canViewRevenue || canViewOrders;
  const canShowAovCard = canViewRevenue;
  const canShowFulfillmentCard = canViewStatus;

  const hasAnyPrimaryKpi = canShowTodayCard || canShowMtdCard || showExpensesCard || canShowAovCard || canShowFulfillmentCard;
  const hasRibbonItems = canSeeRevenueBreakdown || canViewOrders || showExpensesCard || canViewStatus;

  if (!hasAnyPrimaryKpi && !hasRibbonItems) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Primary KPI Cards */}
      {hasAnyPrimaryKpi && (
        <div className={`grid grid-cols-1 min-[480px]:grid-cols-2 ${showExpensesCard ? 'lg:grid-cols-3 min-[1600px]:grid-cols-6' : 'lg:grid-cols-4'} gap-3 sm:gap-4`}>
          {/* Card 1: Today's Performance */}
          {canShowTodayCard && (
            <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 2xl:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <Clock size={13} className="text-emerald-500 shrink-0" />
                  Today&apos;s Sales
                </span>
                {canViewRevenue ? (
                  yesterdaySales > 0 ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        revenueChange >= 0
                          ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                          : 'text-rose-700 bg-rose-500/10 dark:text-rose-400'
                      }`}
                    >
                      {revenueChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {revenueChange >= 0 ? `+${revenueChange}%` : `${revenueChange}%`}
                    </span>
                  ) : null
                ) : yesterdayOrders > 0 ? (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      ordersChange >= 0
                        ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                        : 'text-rose-700 bg-rose-500/10 dark:text-rose-400'
                    }`}
                  >
                    {ordersChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {ordersChange >= 0 ? `+${ordersChange}%` : `${ordersChange}%`}
                  </span>
                ) : null}
              </div>

              <div className="my-2 min-w-0">
                {canViewRevenue ? (
                  <p className="text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl min-[1800px]:text-3xl font-bold font-mono text-foreground tracking-tight truncate" title={`₹${todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                    ₹<NumberTicker value={Math.floor(todaySales)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                    <span className="text-[0.68em] opacity-70 font-semibold font-mono tracking-normal">
                      {(todaySales % 1).toFixed(2).slice(1)}
                    </span>
                  </p>
                ) : (
                  <p className="text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl min-[1800px]:text-3xl font-bold font-mono text-foreground tracking-tight truncate">
                    <NumberTicker value={todayOrders} locale="en-IN" className="text-inherit dark:text-inherit font-mono" /> <span className="text-sm font-normal text-muted-foreground">orders</span>
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground min-w-0 gap-1.5">
                {canViewOrders ? (
                  <span className="truncate">
                    <strong className="text-foreground font-semibold font-mono"><NumberTicker value={todayOrders} locale="en-IN" className="text-inherit dark:text-inherit font-mono" /></strong> {todayOrders === 1 ? 'order' : 'orders'} today
                  </span>
                ) : (
                  <span className="text-[11px] uppercase tracking-wider font-mono">Today</span>
                )}
                <span className="text-[11px] shrink-0">
                  Y&apos;day: {canViewRevenue ? `₹${Math.round(yesterdaySales).toLocaleString('en-IN')}` : `${yesterdayOrders} orders`}
                </span>
              </div>
            </div>
          )}

          {/* Card 2: Total Revenue (MTD) */}
          {canShowMtdCard && (
            <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 2xl:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <ShoppingBag size={13} className="text-blue-500 shrink-0" />
                  Total Revenue
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                  Month to Date
                </span>
              </div>

              <div className="my-2 min-w-0">
                {canViewRevenue ? (
                  <p className="text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl min-[1800px]:text-3xl font-bold font-mono text-foreground tracking-tight truncate" title={`₹${mtdSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                    ₹<NumberTicker value={Math.floor(mtdSales)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                    <span className="text-[0.68em] opacity-70 font-semibold font-mono tracking-normal">
                      {(mtdSales % 1).toFixed(2).slice(1)}
                    </span>
                  </p>
                ) : (
                  <p className="text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl min-[1800px]:text-3xl font-bold font-mono text-foreground tracking-tight truncate">
                    <NumberTicker value={mtdOrders} locale="en-IN" className="text-inherit dark:text-inherit font-mono" /> <span className="text-sm font-normal text-muted-foreground">orders</span>
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground min-w-0 gap-1.5">
                {canViewOrders ? (
                  <span className="truncate">
                    <strong className="text-foreground font-semibold font-mono"><NumberTicker value={mtdOrders} locale="en-IN" className="text-inherit dark:text-inherit font-mono" /></strong> total orders
                  </span>
                ) : (
                  <span className="text-[11px] uppercase tracking-wider font-mono">Monthly Total</span>
                )}
                {canSeeRevenueBreakdown && (
                  <span className="text-[11px] font-mono text-muted-foreground truncate shrink-0 ml-auto">
                    All-Time: <strong className="text-foreground font-mono">₹<NumberTicker value={Math.round(totalAllTimeSales)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" /></strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Card 3: Monthly Net Profit (MTD) */}
          {showExpensesCard && (
            <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 2xl:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <TrendingUp size={13} className={netRevenue >= 0 ? 'text-emerald-500 shrink-0' : 'text-rose-500 shrink-0'} />
                  Monthly Net Profit
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    netRevenue >= 0
                      ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                      : 'text-rose-700 bg-rose-500/10 dark:text-rose-400'
                  }`}
                >
                  {netRevenue >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {netMargin >= 0 ? `+${netMargin}% margin` : `${netMargin}% margin`}
                </span>
              </div>

              <div className="my-2 min-w-0">
                <p className={`text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl min-[1800px]:text-3xl font-bold font-mono tracking-tight truncate ${
                  netRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`} title={`₹${netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                  {netRevenue < 0 ? '-₹' : '₹'}
                  <NumberTicker value={Math.floor(Math.abs(netRevenue))} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                  <span className="text-[0.68em] opacity-70 font-semibold font-mono tracking-normal">
                    {(Math.abs(netRevenue) % 1).toFixed(2).slice(1)}
                  </span>
                </p>
              </div>

              <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground min-w-0 gap-1.5">
                <span className="truncate min-w-0">
                  Rev: <strong className="text-foreground font-mono">₹{Math.round(mtdSales).toLocaleString('en-IN')}</strong> • Exp: <strong className="text-foreground font-mono">₹{Math.round(totalMtdExpenses).toLocaleString('en-IN')}</strong>
                </span>
                {canSeeRevenueBreakdown && (
                  <Link href="/revenue" className="text-xs text-primary hover:underline font-medium shrink-0 ml-auto">
                    Details →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Card 4: Total Expenses (MTD) */}
          {showExpensesCard && (
            <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 2xl:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <Wallet size={13} className="text-rose-500 shrink-0" />
                  Total Expenses
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                  MTD
                </span>
              </div>

              <div className="my-2 min-w-0">
                <p className="text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl min-[1800px]:text-3xl font-bold font-mono text-foreground tracking-tight truncate" title={`₹${totalMtdExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                  ₹<NumberTicker value={Math.floor(totalMtdExpenses)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                  <span className="text-[0.68em] opacity-70 font-semibold font-mono tracking-normal">
                    {(totalMtdExpenses % 1).toFixed(2).slice(1)}
                  </span>
                </p>
              </div>

              <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground min-w-0 gap-1.5">
                <span className="truncate">
                  Bills: <strong className="text-foreground font-mono">{monthlyBillsPaidCount}/{monthlyBillsTotalCount}</strong> paid
                </span>
                {totalAllTimeExpenses > 0 ? (
                  <span className="text-[11px] font-mono text-muted-foreground truncate shrink-0 ml-auto">
                    All-Time: <strong className="text-foreground font-mono">₹<NumberTicker value={Math.round(totalAllTimeExpenses)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" /></strong>
                  </span>
                ) : (
                  canManageBills && (
                    <Link href="/monthly-expenses" className="text-xs text-primary hover:underline font-medium shrink-0 ml-auto">
                      Manage Bills →
                    </Link>
                  )
                )}
              </div>
            </div>
          )}

          {/* Card 5: Average Order Value (AOV) */}
          {canShowAovCard && (
            <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 2xl:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <Receipt size={13} className="text-amber-500 shrink-0" />
                  Avg Order Value (AOV)
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                  MTD
                </span>
              </div>

              <div className="my-2 min-w-0">
                <p className="text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl min-[1800px]:text-3xl font-bold font-mono text-foreground tracking-tight truncate">
                  ₹<NumberTicker value={Math.round(aov)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                </p>
              </div>

              <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground min-w-0 gap-1">
                <span className="truncate">Prepaid: <strong className="text-foreground font-mono">₹<NumberTicker value={Math.round(prepaidAov)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" /></strong></span>
                <span className="truncate">COD: <strong className="text-foreground font-mono">₹<NumberTicker value={Math.round(codAov)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" /></strong></span>
              </div>
            </div>
          )}

          {/* Card 6: Fulfillment Backlog */}
          {canShowFulfillmentCard && (
            <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 2xl:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                  <Package size={13} className="text-violet-500 shrink-0" />
                  Fulfillment Backlog
                </span>
                {unfulfilledOrders > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-amber-700 bg-amber-500/10 dark:text-amber-400 shrink-0">
                    <AlertCircle size={11} /> Needs Dispatch
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-500/10 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 size={11} /> All Fulfilled
                  </span>
                )}
              </div>

              <div className="my-2 flex items-baseline gap-2 min-w-0">
                <p className="text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl min-[1800px]:text-3xl font-bold font-mono text-foreground tracking-tight truncate">
                  <NumberTicker value={unfulfilledOrders} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                </p>
                <span className="text-xs font-medium text-muted-foreground truncate">unfulfilled orders</span>
              </div>

              <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground min-w-0 gap-1.5">
                <span className="truncate">
                  <strong className="text-foreground font-semibold font-mono"><NumberTicker value={fulfillmentRate} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />%</strong> fulfilled ({fulfilledCount}/{mtdOrders})
                </span>
                <div className="w-12 sm:w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${fulfillmentRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Secondary Ribbon: Clean Enterprise Summary Strip */}
      {hasRibbonItems && (
        <div className="bg-card border border-border rounded-lg px-4 py-2.5 flex flex-col min-[960px]:flex-row items-start min-[960px]:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2">
            {/* All-Time Performance Group */}
            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-3.5 gap-y-1.5">
              <Badge variant="subtle" size="sm" className="font-semibold uppercase tracking-wider text-[10px]">
                <Layers size={11} className="mr-1 shrink-0" />
                All-Time
              </Badge>

              {canSeeRevenueBreakdown && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-[11px]">Revenue:</span>
                  <strong className="text-foreground font-mono font-semibold" title={`₹${totalAllTimeSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                    ₹<NumberTicker value={Math.floor(totalAllTimeSales)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                    <span className="text-[0.8em] opacity-75 font-mono">{(totalAllTimeSales % 1).toFixed(2).slice(1)}</span>
                  </strong>
                </div>
              )}

              {showExpensesCard && totalAllTimeExpenses > 0 && (
                <>
                  <span className="text-muted-foreground/30 hidden sm:inline select-none">•</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-[11px]">Expenses:</span>
                    <strong className="text-foreground font-mono font-semibold" title={`₹${totalAllTimeExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                      ₹<NumberTicker value={Math.floor(totalAllTimeExpenses)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                      <span className="text-[0.8em] opacity-75 font-mono">{(totalAllTimeExpenses % 1).toFixed(2).slice(1)}</span>
                    </strong>
                  </div>
                </>
              )}

              {showExpensesCard && totalAllTimeExpenses > 0 && (
                <>
                  <span className="text-muted-foreground/30 hidden sm:inline select-none">•</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-[11px]">Profit:</span>
                    <strong
                      className={`font-mono font-semibold px-2 py-0.5 rounded-md text-[11px] inline-flex items-center gap-0.5 tracking-tight ${
                        (totalAllTimeSales - totalAllTimeExpenses) >= 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                      title={`₹${(totalAllTimeSales - totalAllTimeExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    >
                      {(totalAllTimeSales - totalAllTimeExpenses) < 0 ? '-₹' : '+₹'}
                      <NumberTicker value={Math.floor(Math.abs(totalAllTimeSales - totalAllTimeExpenses))} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                      <span className="text-[0.8em] opacity-75 font-mono">{((Math.abs(totalAllTimeSales - totalAllTimeExpenses)) % 1).toFixed(2).slice(1)}</span>
                    </strong>
                  </div>
                </>
              )}

              {canViewOrders && (
                <>
                  <span className="text-muted-foreground/30 hidden sm:inline select-none">•</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-[11px]">Orders:</span>
                    <strong className="text-foreground font-mono font-semibold">
                      <NumberTicker value={totalAllTimeOrders} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                    </strong>
                  </div>
                </>
              )}
            </div>

            {/* Divider between All-Time and MTD */}
            {showExpensesCard && (
              <div className="hidden min-[1150px]:block h-4 w-px bg-border/80 shrink-0 self-center" />
            )}

            {/* Current Month (MTD) Group */}
            {showExpensesCard && (
              <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-3.5 gap-y-1.5">
                <Badge variant="neutral" size="sm" className="font-semibold uppercase tracking-wider text-[10px]">
                  <Calendar size={11} className="mr-1 shrink-0" />
                  MTD
                </Badge>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-[11px]">Expenses:</span>
                  <strong className="text-foreground font-mono font-semibold" title={`₹${totalMtdExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                    ₹<NumberTicker value={Math.floor(totalMtdExpenses)} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                    <span className="text-[0.8em] opacity-75 font-mono">{(totalMtdExpenses % 1).toFixed(2).slice(1)}</span>
                  </strong>
                </div>

                <span className="text-muted-foreground/30 hidden sm:inline select-none">•</span>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-[11px]">Profit:</span>
                  <strong
                    className={`font-mono font-semibold px-2 py-0.5 rounded-md text-[11px] inline-flex items-center gap-0.5 tracking-tight ${
                      netRevenue >= 0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                    title={`₹${netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  >
                    {netRevenue < 0 ? '-₹' : '+₹'}
                    <NumberTicker value={Math.floor(Math.abs(netRevenue))} locale="en-IN" className="text-inherit dark:text-inherit font-mono" />
                    <span className="text-[0.8em] opacity-75 font-mono">{(Math.abs(netRevenue) % 1).toFixed(2).slice(1)}</span>
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Status Badge using 21st.dev Badge */}
          {canViewStatus && (
            <Badge variant="success" dot size="sm" className="shrink-0 self-start min-[960px]:self-center">
              Shopify Webhooks Active
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
