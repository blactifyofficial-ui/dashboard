'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';
import { 
  TrendingUp, 
  BarChart2, 
  Calendar, 
  IndianRupee, 
  ArrowUpRight, 
  PieChart as PieIcon,
  CreditCard,
  Zap
} from 'lucide-react';
import { Expense } from './types';

const emptySubscribe = () => () => {};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      key: string;
      label: string;
      amount: number;
      count: number;
      avg: number;
    };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const amount = Number(item.amount || 0);
    const count = Number(item.count || 0);
    const avg = Number(item.avg || 0);

    return (
      <div className="p-3.5 rounded-xl border border-border shadow-xl bg-card/95 backdrop-blur-md text-card-foreground min-w-[200px] space-y-2.5">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/60">
          <span className="text-xs font-semibold text-foreground">{item.label || label}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
            {count} {count === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0" />
              Total Expense:
            </span>
            <span className="font-bold font-mono text-foreground">
              ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {count > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
              <span>Avg per entry:</span>
              <span className="font-mono text-foreground font-medium">
                ₹{avg.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export default function ExpenseAnalytics({ expenses }: { expenses: Expense[] }) {
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [timeRange, setTimeRange] = useState<string>('30d');

  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const primaryStroke = isDark ? '#818cf8' : '#4f46e5';

  // Helper date parsing
  const parseExpenseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    return new Date(dateStr);
  };

  // Filter expenses based on selected timeRange
  const filteredExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    if (timeRange === 'all') return expenses;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let startDate: Date;

    if (timeRange === '7d') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '30d') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '90d') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (timeRange === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return expenses.filter((e) => {
        const d = parseExpenseDate(e.expenseDate);
        return d >= startDate && d <= endDate;
      });
    } else if (timeRange === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else {
      return expenses;
    }

    return expenses.filter((e) => {
      const d = parseExpenseDate(e.expenseDate);
      return d >= startDate && d <= today;
    });
  }, [expenses, timeRange]);

  // Aggregate Chart Data
  const chartData = useMemo(() => {
    if (!filteredExpenses || filteredExpenses.length === 0) return [];

    if (granularity === 'daily') {
      const dayMap: Record<string, { amount: number; count: number; dateObj: Date }> = {};

      filteredExpenses.forEach((exp) => {
        const d = parseExpenseDate(exp.expenseDate);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const val = parseFloat(exp.amount || '0') || 0;

        if (!dayMap[key]) {
          dayMap[key] = { amount: 0, count: 0, dateObj: d };
        }
        dayMap[key].amount += val;
        dayMap[key].count += 1;
      });

      const sortedKeys = Object.keys(dayMap).sort((a, b) => a.localeCompare(b));
      return sortedKeys.map((key) => {
        const item = dayMap[key];
        const label = item.dateObj.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        });
        return {
          key,
          label,
          amount: parseFloat(item.amount.toFixed(2)),
          count: item.count,
          avg: item.count > 0 ? parseFloat((item.amount / item.count).toFixed(2)) : 0,
        };
      });
    } else {
      // Monthly
      const monthMap: Record<string, { amount: number; count: number; dateObj: Date }> = {};

      filteredExpenses.forEach((exp) => {
        const d = parseExpenseDate(exp.expenseDate);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const val = parseFloat(exp.amount || '0') || 0;

        if (!monthMap[key]) {
          monthMap[key] = { amount: 0, count: 0, dateObj: new Date(d.getFullYear(), d.getMonth(), 1) };
        }
        monthMap[key].amount += val;
        monthMap[key].count += 1;
      });

      const sortedKeys = Object.keys(monthMap).sort((a, b) => a.localeCompare(b));
      return sortedKeys.map((key) => {
        const item = monthMap[key];
        const label = item.dateObj.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        });
        return {
          key,
          label,
          amount: parseFloat(item.amount.toFixed(2)),
          count: item.count,
          avg: item.count > 0 ? parseFloat((item.amount / item.count).toFixed(2)) : 0,
        };
      });
    }
  }, [filteredExpenses, granularity]);

  // Overall Statistics for selected range
  const stats = useMemo(() => {
    let total = 0;
    let peakDay = { label: '—', amount: 0 };
    let largestItem = { title: '—', amount: 0 };

    filteredExpenses.forEach((e) => {
      const amt = parseFloat(e.amount || '0') || 0;
      total += amt;
      if (amt > largestItem.amount) {
        largestItem = { title: e.title || 'Expense', amount: amt };
      }
    });

    if (chartData.length > 0) {
      const highestPoint = chartData.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), chartData[0]);
      if (highestPoint && highestPoint.amount > 0) {
        peakDay = { label: highestPoint.label, amount: highestPoint.amount };
      }
    }

    const uniqueDays = new Set(
      filteredExpenses.map((e) => {
        const d = parseExpenseDate(e.expenseDate);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    ).size;

    const dailyAvg = uniqueDays > 0 ? total / uniqueDays : 0;
    const avgPerEntry = filteredExpenses.length > 0 ? total / filteredExpenses.length : 0;

    return {
      total,
      count: filteredExpenses.length,
      dailyAvg,
      avgPerEntry,
      peakDay,
      largestItem,
    };
  }, [filteredExpenses, chartData]);

  // Category Breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category?.trim() || 'Uncategorized';
      const val = parseFloat(e.amount || '0') || 0;
      if (!map[cat]) {
        map[cat] = { amount: 0, count: 0 };
      }
      map[cat].amount += val;
      map[cat].count += 1;
    });

    const list = Object.entries(map).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      pct: stats.total > 0 ? (data.amount / stats.total) * 100 : 0,
    }));

    return list.sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, stats.total]);

  // Payment Method Breakdown
  const paymentStats = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    filteredExpenses.forEach((e) => {
      const method = e.paymentMethod?.trim() || 'Not Specified';
      const val = parseFloat(e.amount || '0') || 0;
      if (!map[method]) {
        map[method] = { amount: 0, count: 0 };
      }
      map[method].amount += val;
      map[method].count += 1;
    });

    const list = Object.entries(map).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      pct: stats.total > 0 ? (data.amount / stats.total) * 100 : 0,
    }));

    return list.sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, stats.total]);

  const timeRangeOptions = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter and Display Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/20 border border-border p-3.5 rounded-xl">
        {/* Time range pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {timeRangeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTimeRange(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                timeRange === opt.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Granularity & Chart Style Toggles */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Daily vs Monthly */}
          <div className="flex items-center p-0.5 rounded-lg bg-muted border border-border text-xs">
            <button
              type="button"
              onClick={() => setGranularity('daily')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                granularity === 'daily'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setGranularity('monthly')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                granularity === 'monthly'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Area vs Bar */}
          <div className="flex items-center p-0.5 rounded-lg bg-muted border border-border text-xs">
            <button
              type="button"
              onClick={() => setChartType('area')}
              title="Trend Line / Area"
              className={`px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp size={13} />
              <span className="hidden sm:inline">Trend</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title="Bar Chart"
              className={`px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart2 size={13} />
              <span className="hidden sm:inline">Bars</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards for the selected period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs uppercase font-medium tracking-wider">Total Period Spend</span>
            <IndianRupee size={15} className="text-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            ₹{stats.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Across {stats.count} {stats.count === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs uppercase font-medium tracking-wider">Daily Average Spend</span>
            <Zap size={15} className="text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            ₹{stats.dailyAvg.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Avg per active spending day
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs uppercase font-medium tracking-wider">Peak Expense Day</span>
            <TrendingUp size={15} className="text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            ₹{stats.peakDay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {stats.peakDay.label !== '—' ? `On ${stats.peakDay.label}` : 'No data recorded'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs uppercase font-medium tracking-wider">Single Largest Spend</span>
            <ArrowUpRight size={15} className="text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            ₹{stats.largestItem.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 truncate" title={stats.largestItem.title}>
            {stats.largestItem.title}
          </p>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-3 border-b border-border/70">
          <div>
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Expense {granularity === 'daily' ? 'Daily' : 'Monthly'} Trend
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Spending trajectory over time with interactive point inspection
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Total Points: <span className="font-mono font-semibold text-foreground">{chartData.length}</span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Calendar size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No expenses recorded for this timeframe.</p>
            <p className="text-xs text-muted-foreground/80 mt-1">Try selecting a wider date range or &apos;All Time&apos;.</p>
          </div>
        ) : (
          <div className="h-[280px] sm:h-[340px] md:h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="expenseTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={primaryStroke} stopOpacity={isDark ? 0.35 : 0.25} />
                      <stop offset="95%" stopColor={primaryStroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

                  <XAxis
                    dataKey="label"
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={{ stroke: gridStroke }}
                    axisLine={{ stroke: gridStroke }}
                  />

                  <YAxis
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={{ stroke: gridStroke }}
                    axisLine={{ stroke: gridStroke }}
                    tickFormatter={(val) => {
                      if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                      if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                      return `₹${val}`;
                    }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={primaryStroke}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expenseTrendGradient)"
                    activeDot={{ r: 5, fill: primaryStroke, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

                  <XAxis
                    dataKey="label"
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={{ stroke: gridStroke }}
                    axisLine={{ stroke: gridStroke }}
                  />

                  <YAxis
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={{ stroke: gridStroke }}
                    axisLine={{ stroke: gridStroke }}
                    tickFormatter={(val) => {
                      if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                      if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                      return `₹${val}`;
                    }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="amount"
                    fill={primaryStroke}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Secondary Breakdowns: Category & Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/70">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <PieIcon size={15} className="text-amber-500" />
              Category Breakdown
            </h4>
            <span className="text-xs text-muted-foreground">{categoryStats.length} categories</span>
          </div>

          {categoryStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No category data available</div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
              {categoryStats.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate max-w-[60%]">{cat.name}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-muted-foreground text-[11px]">({cat.count})</span>
                      <span className="font-semibold text-foreground">
                        ₹{cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-muted-foreground w-11 text-right">
                        {cat.pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(cat.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/70">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CreditCard size={15} className="text-blue-500" />
              Payment Methods
            </h4>
            <span className="text-xs text-muted-foreground">{paymentStats.length} methods</span>
          </div>

          {paymentStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No payment data available</div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
              {paymentStats.map((pm) => (
                <div key={pm.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate max-w-[60%]">{pm.name}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-muted-foreground text-[11px]">({pm.count})</span>
                      <span className="font-semibold text-foreground">
                        ₹{pm.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-muted-foreground w-11 text-right">
                        {pm.pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(pm.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
