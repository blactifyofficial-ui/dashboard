'use client';

import { TrendingUp, TrendingDown, Package, Clock, ShoppingBag, Receipt, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';
import Link from 'next/link';

export interface DashboardKpiProps {
  canViewRevenue: boolean;
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
}

export default function DashboardKpis({
  canViewRevenue,
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

  const showExpensesCard = canViewExpenses && canViewRevenue;
  const netMargin = mtdSales > 0 ? Math.round((netRevenue / mtdSales) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Primary KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${showExpensesCard ? 'lg:grid-cols-3 2xl:grid-cols-6' : 'lg:grid-cols-4'} gap-3.5 sm:gap-4`}>
        {/* Card 1: Today's Performance */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={13} className="text-emerald-500 shrink-0" />
              Today&apos;s Sales
            </span>
            {canViewRevenue ? (
              yesterdaySales > 0 ? (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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

          <div className="my-2">
            {canViewRevenue ? (
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                ₹{todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                {todayOrders.toLocaleString('en-IN')} <span className="text-base font-normal text-muted-foreground">orders</span>
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground font-semibold font-mono">{todayOrders}</strong> {todayOrders === 1 ? 'order' : 'orders'} today
            </span>
            <span className="text-[11px]">
              Y&apos;day: {canViewRevenue ? `₹${Math.round(yesterdaySales).toLocaleString('en-IN')}` : `${yesterdayOrders} orders`}
            </span>
          </div>
        </div>

        {/* Card 2: Current Month (MTD) */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag size={13} className="text-blue-500 shrink-0" />
              This Month (MTD)
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Month to Date
            </span>
          </div>

          <div className="my-2">
            {canViewRevenue ? (
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                ₹{mtdSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                {mtdOrders.toLocaleString('en-IN')} <span className="text-base font-normal text-muted-foreground">orders</span>
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground font-semibold font-mono">{mtdOrders.toLocaleString('en-IN')}</strong> total orders
            </span>
            <Link href="/revenue" className="text-xs text-primary hover:underline font-medium">
              View Breakdown →
            </Link>
          </div>
        </div>

        {/* Card 3: Monthly Net Profit (MTD) */}
        {showExpensesCard && (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={13} className={netRevenue >= 0 ? 'text-emerald-500 shrink-0' : 'text-rose-500 shrink-0'} />
                Monthly Net Profit
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  netRevenue >= 0
                    ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-rose-700 bg-rose-500/10 dark:text-rose-400'
                }`}
              >
                {netRevenue >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {netMargin >= 0 ? `+${netMargin}% margin` : `${netMargin}% margin`}
              </span>
            </div>

            <div className="my-2">
              <p className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
                netRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                ₹{netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">
                Rev: <strong className="text-foreground font-mono">₹{Math.round(mtdSales).toLocaleString('en-IN')}</strong> • Exp: <strong className="text-foreground font-mono">₹{Math.round(totalMtdExpenses).toLocaleString('en-IN')}</strong>
              </span>
              <Link href="/revenue" className="text-xs text-primary hover:underline font-medium shrink-0 ml-1">
                Details →
              </Link>
            </div>
          </div>
        )}

        {/* Card 4: Monthly Expenses (MTD) */}
        {showExpensesCard && (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Wallet size={13} className="text-rose-500 shrink-0" />
                Monthly Expenses
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                MTD
              </span>
            </div>

            <div className="my-2">
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                ₹{totalMtdExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Bills: <strong className="text-foreground font-mono">{monthlyBillsPaidCount}/{monthlyBillsTotalCount}</strong> paid
              </span>
              <Link href="/monthly-expenses" className="text-xs text-primary hover:underline font-medium">
                Manage Bills →
              </Link>
            </div>
          </div>
        )}

        {/* Card 4: Average Order Value (AOV) */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Receipt size={13} className="text-amber-500 shrink-0" />
              Avg Order Value (AOV)
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              MTD
            </span>
          </div>

          <div className="my-2">
            {canViewRevenue ? (
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                ₹{Math.round(aov).toLocaleString('en-IN')}
              </p>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                -
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Prepaid: <strong className="text-foreground font-mono">₹{Math.round(prepaidAov).toLocaleString('en-IN')}</strong></span>
            <span>COD: <strong className="text-foreground font-mono">₹{Math.round(codAov).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Card 4: Fulfillment Backlog */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-border/80 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Package size={13} className="text-violet-500 shrink-0" />
              Fulfillment Backlog
            </span>
            {unfulfilledOrders > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-amber-700 bg-amber-500/10 dark:text-amber-400">
                <AlertCircle size={11} /> Needs Dispatch
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 size={11} /> All Fulfilled
              </span>
            )}
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
              {unfulfilledOrders}
            </p>
            <span className="text-xs font-medium text-muted-foreground">unfulfilled orders</span>
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground font-semibold font-mono">{fulfillmentRate}%</strong> fulfilled ({fulfilledCount}/{mtdOrders})
            </span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${fulfillmentRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Ribbon: All-Time Summary & Real-time Webhook Pulse */}
      <div className="bg-card/50 border border-border/80 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {canViewRevenue && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">All-Time Revenue:</span>
              <strong className="text-foreground font-mono font-semibold">
                ₹{totalAllTimeSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          )}
          {canViewOrders && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">All-Time Orders:</span>
              <strong className="text-foreground font-mono font-semibold">
                {totalAllTimeOrders.toLocaleString('en-IN')}
              </strong>
            </div>
          )}
          {showExpensesCard && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">MTD Expenses:</span>
              <strong className="text-foreground font-mono font-semibold">
                ₹{totalMtdExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          )}
          {showExpensesCard && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">MTD Net Profit:</span>
              <strong className={`font-mono font-semibold ${netRevenue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                ₹{netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          )}
        </div>

        {canViewStatus && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-foreground text-[11px]">Shopify Webhooks Active</span>
          </div>
        )}
      </div>
    </div>
  );
}
