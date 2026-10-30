import React from 'react';
import type { FinancialReportData } from '@/lib/financial-report-service';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  DollarSign,
  Receipt,
  ShoppingCart,
  Percent,
} from 'lucide-react';

interface ReportKpiGridProps {
  data: FinancialReportData;
}

export function ReportKpiGrid({ data }: ReportKpiGridProps) {
  const { kpis, sales, expenses } = data;

  const fmtINR = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const isProfitable = kpis.netProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Gross Revenue */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Gross Sales
          </span>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <DollarSign size={16} />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {fmtINR(kpis.totalRevenue)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {kpis.totalOrders} {kpis.totalOrders === 1 ? 'order' : 'orders'} completed
            </span>
            {kpis.mom.revenueGrowthPct !== null && (
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  kpis.mom.revenueGrowthPct >= 0
                    ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-rose-700 bg-rose-500/10 dark:text-rose-400'
                }`}
              >
                {kpis.mom.revenueGrowthPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {kpis.mom.revenueGrowthPct >= 0 ? '+' : ''}
                {kpis.mom.revenueGrowthPct}% MoM
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Total Operating Expenses */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Operating Expenses
          </span>
          <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Receipt size={16} />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {fmtINR(kpis.totalExpenses)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {expenses.categories.length} spend categories
            </span>
            {expenses.adSpendAmount > 0 && (
              <span className="text-[11px] font-medium text-muted-foreground">
                Ads: {fmtINR(expenses.adSpendAmount)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Net Operating Profit */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Net Operating Profit
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isProfitable
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            <Percent size={16} />
          </div>
        </div>

        <div className="mt-3">
          <div
            className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
              isProfitable
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {kpis.netProfit < 0 ? '-' : ''}
            {fmtINR(Math.abs(kpis.netProfit))}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                isProfitable
                  ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                  : 'text-rose-700 bg-rose-500/10 dark:text-rose-400'
              }`}
            >
              Margin: {kpis.profitMargin >= 0 ? `+${kpis.profitMargin}%` : `${kpis.profitMargin}%`}
            </span>
            <span className="text-xs text-muted-foreground">
              {isProfitable ? 'Healthy' : 'Deficit'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Average Order Value (AOV) & Split */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Average Order (AOV)
          </span>
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShoppingCart size={16} />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
            {fmtINR(kpis.aov)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CreditCard size={11} className="text-primary" />
              Prepaid: {sales.prepaid.percentage}%
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1">
              <Banknote size={11} className="text-amber-500" />
              COD: {sales.cod.percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

