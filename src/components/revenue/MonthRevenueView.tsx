'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Inbox,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import RevenueChart from '@/components/RevenueChart';
import MonthOrdersTable, { MonthOrderDetail } from '@/components/MonthOrdersTable';
import MonthRevenueWeeklyToolbar from '@/components/revenue/MonthRevenueWeeklyToolbar';
import { isCodOrder, getCodAmountToCollect, getPrepaidAmount } from '@/lib/order-utils';
import { getStoreNow, getStoreDay, getMonthWeekPresets, MonthWeekPreset } from '@/lib/date-utils';

export interface MonthExpenseItem {
  amount: number;
  expenseDate: Date | string | null;
}

export interface MonthRevenueViewProps {
  year: number;
  month: number;
  monthDisplay: string;
  monthOrders: MonthOrderDetail[];
  expenses: MonthExpenseItem[];
  yesterdayExtraOrders?: Array<{ createdAt: string; revenue: number }>;
  canViewExpenses: boolean;
  initialWeekId?: string;
}

export default function MonthRevenueView({
  year,
  month,
  monthDisplay,
  monthOrders,
  expenses,
  yesterdayExtraOrders = [],
  canViewExpenses,
  initialWeekId = 'all',
}: MonthRevenueViewProps) {
  const storeNow = useMemo(() => getStoreNow(), []);
  const isCurrentMonth = year === storeNow.year && month === storeNow.month;
  const isFutureMonth = year > storeNow.year || (year === storeNow.year && month > storeNow.month);
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const monthShort = useMemo(
    () => new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' }),
    [year, month]
  );

  const presets = useMemo(() => getMonthWeekPresets(year, month), [year, month]);

  const [selectedWeekId, setSelectedWeekId] = useState<string>(() => {
    if (initialWeekId && presets.some((p) => p.id === initialWeekId)) {
      return initialWeekId;
    }
    return 'all';
  });

  const activePreset = useMemo(
    () => presets.find((p) => p.id === selectedWeekId) || presets[0],
    [presets, selectedWeekId]
  );

  const handleSelectWeek = (preset: MonthWeekPreset) => {
    setSelectedWeekId(preset.id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (preset.id === 'all') {
        url.searchParams.delete('week');
      } else {
        url.searchParams.set('week', preset.id);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Pre-calculate preset statistics for toolbar badges
  const statsByPresetId = useMemo(() => {
    const stats: Record<string, { orderCount: number; revenue: number }> = {};
    for (const p of presets) {
      let count = 0;
      let rev = 0;
      for (const order of monthOrders) {
        if (!order.createdAt) continue;
        const day = getStoreDay(order.createdAt);
        if (p.id === 'all' || (day >= p.startDay && day <= p.endDay)) {
          count++;
          rev += parseFloat(order.totalPrice || '0') || 0;
        }
      }
      stats[p.id] = { orderCount: count, revenue: rev };
    }
    return stats;
  }, [presets, monthOrders]);

  // Filter orders and expenses based on active preset
  const activeOrders = useMemo(() => {
    if (activePreset.id === 'all') return monthOrders;
    return monthOrders.filter((order) => {
      if (!order.createdAt) return false;
      const day = getStoreDay(order.createdAt);
      return day >= activePreset.startDay && day <= activePreset.endDay;
    });
  }, [monthOrders, activePreset]);

  const activeExpenses = useMemo(() => {
    if (!canViewExpenses) return [];
    if (activePreset.id === 'all') return expenses;
    return expenses.filter((exp) => {
      if (!exp.expenseDate) return false;
      const day = getStoreDay(exp.expenseDate);
      return day >= activePreset.startDay && day <= activePreset.endDay;
    });
  }, [expenses, activePreset, canViewExpenses]);

  // Aggregate metrics for active selection
  const {
    totalRevenue,
    normalOrdersCount,
    normalRevenue,
    codOrdersCount,
    codRevenue,
    dailyDataMap,
  } = useMemo(() => {
    let rev = 0;
    let nOrders = 0;
    let nRev = 0;
    let cOrders = 0;
    let cRev = 0;
    const dMap = new Map<number, { revenue: number; ordersCount: number }>();

    // Initialize daily points for the active range
    let startDay = 1;
    let endDay = daysInMonth;

    if (activePreset.id === 'all') {
      let latestDay = 0;
      monthOrders.forEach((o) => {
        if (o.createdAt) {
          const d = getStoreDay(o.createdAt);
          if (d > latestDay) latestDay = d;
        }
      });
      if (isCurrentMonth) {
        endDay = Math.min(daysInMonth, Math.max(storeNow.day, latestDay));
      } else if (isFutureMonth) {
        endDay = latestDay;
      }
    } else {
      startDay = activePreset.startDay;
      endDay = activePreset.endDay;
    }

    for (let i = startDay; i <= endDay; i++) {
      dMap.set(i, { revenue: 0, ordersCount: 0 });
    }

    activeOrders.forEach((order) => {
      const orderRevenue = parseFloat(order.totalPrice || '0') || 0;
      rev += orderRevenue;

      if (order.createdAt) {
        const day = getStoreDay(order.createdAt);
        if (dMap.has(day)) {
          const current = dMap.get(day)!;
          dMap.set(day, {
            revenue: current.revenue + orderRevenue,
            ordersCount: current.ordersCount + 1,
          });
        }
      }

      if (isCodOrder(order)) {
        cOrders++;
        if (order.financialStatus === 'partially_paid') {
          const codPortion = getCodAmountToCollect(order);
          const prepaidPortion = getPrepaidAmount(order);
          cRev += codPortion;
          nRev += prepaidPortion;
        } else {
          cRev += orderRevenue;
        }
      } else {
        nOrders++;
        nRev += orderRevenue;
      }
    });

    return {
      totalRevenue: rev,
      normalOrdersCount: nOrders,
      normalRevenue: nRev,
      codOrdersCount: cOrders,
      codRevenue: cRev,
      dailyDataMap: dMap,
    };
  }, [
    activeOrders,
    activePreset,
    daysInMonth,
    isCurrentMonth,
    isFutureMonth,
    monthOrders,
    storeNow.day,
  ]);

  const monthExpensesTotal = useMemo(() => {
    return activeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [activeExpenses]);

  const netProfit = totalRevenue - monthExpensesTotal;
  const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const chartData = useMemo(() => {
    return Array.from(dailyDataMap.entries()).map(([day, val]) => ({
      day: `${day} ${monthShort}`,
      dayNum: day,
      revenue: Math.round(val.revenue * 100) / 100,
      ordersCount: val.ordersCount,
    }));
  }, [dailyDataMap, monthShort]);

  const orderPoints = useMemo(() => {
    return [
      ...yesterdayExtraOrders,
      ...monthOrders.map((o) => ({
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : '',
        revenue: parseFloat(o.totalPrice || '0') || 0,
      })),
    ];
  }, [yesterdayExtraOrders, monthOrders]);

  const activePeriodLabel =
    activePreset.id === 'all'
      ? isCurrentMonth
        ? 'Month-to-date'
        : 'Full Month'
      : `${activePreset.label} (${activePreset.rangeLabel})`;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Weekly Filter Toolbar */}
      <MonthRevenueWeeklyToolbar
        presets={presets}
        selectedWeekId={selectedWeekId}
        onSelectWeek={handleSelectWeek}
        statsByPresetId={statsByPresetId}
      />

      {/* Summary Cards Grid */}
      <div
        className={`grid grid-cols-2 ${
          canViewExpenses ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-4'
        } gap-2.5 sm:gap-3.5`}
      >
        {/* Total Revenue */}
        <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Revenue
            </p>
            <CalendarDays size={16} className="text-muted-foreground shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight font-mono">
              ₹
              {totalRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground pt-1.5 border-t border-border truncate">
            Across {activeOrders.length} {activeOrders.length === 1 ? 'order' : 'orders'}
            {activePreset.id !== 'all' ? ` in ${activePreset.shortLabel}` : ''}
          </p>
        </div>

        {/* Monthly Net Profit */}
        {canViewExpenses && (
          <div
            className={`bg-card border ${
              netProfit >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'
            } rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between gap-2">
              <p
                className={`text-[10px] sm:text-[11px] font-semibold ${
                  netProfit >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                } uppercase tracking-wider`}
              >
                Net Profit
              </p>
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  netProfit >= 0
                    ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-rose-700 bg-rose-500/10 dark:text-rose-400'
                }`}
              >
                {netProfit >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {netMargin >= 0 ? `+${netMargin}%` : `${netMargin}%`}
              </span>
            </div>
            <div className="my-1.5">
              <p
                className={`text-base sm:text-lg md:text-xl font-bold tracking-tight font-mono ${
                  netProfit >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                ₹
                {netProfit.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground pt-1.5 border-t border-border truncate">
              Margin:{' '}
              <strong
                className={
                  netProfit >= 0
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-rose-600 dark:text-rose-400 font-semibold'
                }
              >
                {netMargin}%
              </strong>{' '}
              of sales
            </p>
          </div>
        )}

        {/* Total Expenses */}
        {canViewExpenses && (
          <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Expenses
              </p>
              <Wallet size={16} className="text-rose-500 shrink-0" />
            </div>
            <div className="my-1.5">
              <p className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight font-mono">
                ₹
                {monthExpensesTotal.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="pt-1.5 border-t border-border flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
              <span>
                {activeExpenses.length}{' '}
                {activeExpenses.length === 1 ? 'entry' : 'entries'}
              </span>
              <Link href="/expenses" className="text-primary hover:underline font-medium">
                View →
              </Link>
            </div>
          </div>
        )}

        {/* Total Orders */}
        <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Orders
            </p>
            <Inbox size={16} className="text-muted-foreground shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-foreground tracking-tight font-mono">
              {activeOrders.length}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground pt-1.5 border-t border-border truncate">
            Avg: ₹
            {(activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0).toLocaleString(
              'en-IN',
              { maximumFractionDigits: 0 }
            )}{' '}
            / order
          </p>
        </div>

        {/* Normal / Prepaid Orders */}
        <div className="bg-card border border-emerald-500/30 rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
                Normal (Prepaid)
              </p>
            </div>
            <CreditCard size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
              ₹
              {normalRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground pt-1.5 border-t border-border truncate">
            <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">
              {normalOrdersCount}
            </strong>{' '}
            {normalOrdersCount === 1 ? 'order' : 'orders'} (
            {activeOrders.length > 0
              ? Math.round((normalOrdersCount / activeOrders.length) * 100)
              : 0}
            %)
          </p>
        </div>

        {/* COD Orders */}
        <div className="bg-card border border-amber-500/30 rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
              <p className="text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">
                COD Orders
              </p>
            </div>
            <Banknote size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="my-1.5">
            <p className="text-base sm:text-lg md:text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight font-mono">
              ₹
              {codRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground pt-1.5 border-t border-border truncate">
            <strong className="text-amber-700 dark:text-amber-300 font-semibold">
              {codOrdersCount}
            </strong>{' '}
            {codOrdersCount === 1 ? 'order' : 'orders'} (
            {activeOrders.length > 0
              ? Math.round((codOrdersCount / activeOrders.length) * 100)
              : 0}
            %)
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-card border border-border rounded-xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden">
        <RevenueChart
          data={chartData}
          orderPoints={orderPoints}
          isCurrentMonth={isCurrentMonth}
          year={year}
          month={month}
          monthDisplay={monthDisplay}
          activePeriodLabel={activePeriodLabel}
        />
      </div>

      {/* Detailed Orders Breakdown Table */}
      <MonthOrdersTable
        orders={activeOrders}
        selectedWeekId={selectedWeekId}
        onSelectWeekId={(weekId) => {
          const match = presets.find((p) => p.id === weekId);
          if (match) handleSelectWeek(match);
        }}
        availableWeeks={presets}
        activeWeekLabel={activePreset.id !== 'all' ? `${activePreset.label} (${activePreset.rangeLabel})` : undefined}
      />
    </div>
  );
}
