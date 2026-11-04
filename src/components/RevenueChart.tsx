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
import { IndianRupee, Inbox, TrendingUp, BarChart2, CalendarDays, Clock } from 'lucide-react';
import {
  computeDayHourlyBuckets,
  computeLast24HoursBuckets,
  getStoreNow,
  getStoreYesterdayRange,
  getStoreDateParts,
} from '@/lib/date-utils';

const emptySubscribe = () => () => { };

export interface RevenueData {
  day: string;
  revenue: number;
  ordersCount: number;
  dayNum?: number;
}

export interface OrderPoint {
  createdAt: string;
  revenue: number;
}

export interface ChartPoint {
  day: string;
  label?: string;
  timeRange?: string;
  revenue: number;
  ordersCount: number;
  dayNum?: number;
  hour?: number;
}

interface ChartClickPayload {
  dayNum?: number;
  payload?: {
    dayNum?: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  label?: string;
  activeMetric: 'revenue' | 'orders';
  viewMode: 'month' | '24h';
}

  function CustomTooltip({ active, payload, label, activeMetric, viewMode }: CustomTooltipProps) {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const rev = Number(data.revenue || 0);
      const orders = Number(data.ordersCount || 0);
      const headerTitle = viewMode === '24h' && data.timeRange ? data.timeRange : (label || data.day || data.label);
      const badgeText = viewMode === '24h' ? '24h Hourly' : '24h Day';

      return (
          <div className="p-3 rounded-[14px] border border-border bg-card/95 backdrop-blur-md text-card-foreground min-w-[190px] space-y-2 shadow-lg">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/60">
              <span className="text-xs font-semibold text-foreground tracking-[-0.12px]">{headerTitle}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{badgeText}</span>
            </div>
            <div className="space-y-1.5">
              <div className={`flex items-center justify-between text-xs px-2 py-0.5 rounded-full ${activeMetric === 'revenue' ? 'bg-[#0066cc]/10 text-[#0066cc] dark:text-[#2997ff] font-semibold' : ''}`}>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0066cc] dark:bg-[#2997ff] inline-block shrink-0" />
                  Revenue:
                </span>
                <span className="font-semibold font-mono text-foreground">
                  ₹{rev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`flex items-center justify-between text-xs px-2 py-0.5 rounded-full ${activeMetric === 'orders' ? 'bg-[#0066cc]/10 text-[#0066cc] dark:text-[#2997ff] font-semibold' : ''}`}>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0066cc] dark:bg-[#2997ff] inline-block shrink-0" />
                  Orders:
                </span>
                <span className="font-semibold font-mono text-foreground">
                  {orders.toLocaleString('en-IN')} {orders === 1 ? 'order' : 'orders'}
                </span>
              </div>
            </div>
            {viewMode === 'month' && (
              <div className="pt-1 border-t border-border/40 text-[10px] text-muted-foreground/80 text-center">
                Click point to view 24h hourly breakdown
              </div>
            )}
          </div>
          );
  }
          return null;
}

          export type ViewMode = 'month' | '24h';
          export type HourlyRange = 'today' | 'yesterday' | 'last24h' | 'day';

          export default function RevenueChart({
            data,
  orderPoints = [],
          isCurrentMonth = false,
          year,
          month,
          monthDisplay,
}: {
            data: RevenueData[];
          orderPoints?: OrderPoint[];
          isCurrentMonth?: boolean;
          year?: number;
          month?: number;
          monthDisplay?: string;
}) {
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');
          const [chartType, setChartType] = useState<'area' | 'bar'>('area');
          const [viewMode, setViewMode] = useState<ViewMode>('month');
            const [hourlyRange, setHourlyRange] = useState<HourlyRange>('today');

  // Default selected day to latest day with orders or today
  const storeNow = useMemo(() => getStoreNow(), []);
  const initialDay = useMemo(() => {
    if (isCurrentMonth) return storeNow.day;
    const maxDay = data.reduce((max, d) => Math.max(max, d.dayNum || 0), 1);
              return maxDay || 1;
  }, [isCurrentMonth, storeNow.day, data]);

              const [selectedDay, setSelectedDay] = useState<number>(initialDay);

                const {resolvedTheme} = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
                const isDark = mounted ? resolvedTheme === 'dark' : true;

                const gridStroke = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
                const axisColor = isDark ? '#cccccc' : '#7a7a7a';
                const strokeColor = metric === 'revenue'
                ? (isDark ? '#2997ff' : '#0066cc')
                : (isDark ? '#ffffff' : '#1d1d1f');
                const dotRing = isDark ? '#1d1d1f' : '#ffffff';

                // Compute 24-hour datasets
                const targetYear = year || storeNow.year;
                const targetMonth = month || storeNow.month;

  const todayHourlyData = useMemo(() => {
    return computeDayHourlyBuckets(orderPoints, storeNow.year, storeNow.month, storeNow.day);
  }, [orderPoints, storeNow]);

  const yesterdayHourlyData = useMemo(() => {
    const yRange = getStoreYesterdayRange();
                const yParts = getStoreDateParts(yRange.startDate);
                return computeDayHourlyBuckets(orderPoints, yParts.year, yParts.month, yParts.day);
  }, [orderPoints]);

  const last24hHourlyData = useMemo(() => {
    return computeLast24HoursBuckets(orderPoints);
  }, [orderPoints]);

  const customDayHourlyData = useMemo(() => {
    return computeDayHourlyBuckets(orderPoints, targetYear, targetMonth, selectedDay);
  }, [orderPoints, targetYear, targetMonth, selectedDay]);

  // Determine active chart dataset based on viewMode and hourlyRange
  const activeData: ChartPoint[] = useMemo(() => {
    if (viewMode === 'month') {
      return data.map((d) => ({
                  day: d.day,
                label: d.day,
                revenue: d.revenue,
                ordersCount: d.ordersCount,
                dayNum: d.dayNum,
      }));
    }

                if (hourlyRange === 'today') {
      return todayHourlyData.map((d) => ({
                  day: d.label,
                label: d.label,
                timeRange: d.timeRange,
                revenue: d.revenue,
                ordersCount: d.ordersCount,
                hour: d.hour,
      }));
    }

                if (hourlyRange === 'yesterday') {
      return yesterdayHourlyData.map((d) => ({
                  day: d.label,
                label: d.label,
                timeRange: d.timeRange,
                revenue: d.revenue,
                ordersCount: d.ordersCount,
                hour: d.hour,
      }));
    }

                if (hourlyRange === 'last24h') {
      return last24hHourlyData.map((d) => ({
                  day: d.label,
                label: d.label,
                timeRange: d.timeRange,
                revenue: d.revenue,
                ordersCount: d.ordersCount,
                hour: d.hour,
      }));
    }

    return customDayHourlyData.map((d) => ({
                  day: d.label,
                label: d.label,
                timeRange: d.timeRange,
                revenue: d.revenue,
                ordersCount: d.ordersCount,
                hour: d.hour,
    }));
  }, [
                viewMode,
                hourlyRange,
                data,
                todayHourlyData,
                yesterdayHourlyData,
                last24hHourlyData,
                customDayHourlyData,
                ]);

  // Aggregate stats for current view
  const stats = useMemo(() => {
    if (!activeData || activeData.length === 0) {
      return {totalRevenue: 0, totalOrders: 0, peakRevenue: 0, peakRevenueDay: '', peakOrders: 0, peakOrdersDay: '' };
    }
                let totalRevenue = 0;
                let totalOrders = 0;
                let peakRevenue = 0;
                let peakRevenueDay = '';
                let peakOrders = 0;
                let peakOrdersDay = '';

                  activeData.forEach((d) => {
                    totalRevenue += d.revenue;
                    totalOrders += d.ordersCount;
                    if (d.revenue > peakRevenue) {
                      peakRevenue = d.revenue;
                      peakRevenueDay = d.timeRange ? d.day : d.day;
                    }
                    if (d.ordersCount > peakOrders) {
                      peakOrders = d.ordersCount;
                      peakOrdersDay = d.timeRange ? d.day : d.day;
                    }
                  });

                return {totalRevenue, totalOrders, peakRevenue, peakRevenueDay, peakOrders, peakOrdersDay};
  }, [activeData]);

  // Available days in this month that have data or are valid for selection
  const availableDays = useMemo(() => {
    return data.filter((d) => d.dayNum !== undefined && d.dayNum > 0);
  }, [data]);

  // Context label for active 24h selection
  const current24hLabel = useMemo(() => {
    if (hourlyRange === 'today') {
      const monthShort = new Date(storeNow.year, storeNow.month - 1, storeNow.day).toLocaleDateString('en-US', {month: 'short' });
                return `Today (${storeNow.day} ${monthShort})`;
    }
                if (hourlyRange === 'yesterday') {
      const yRange = getStoreYesterdayRange();
                const yParts = getStoreDateParts(yRange.startDate);
                const monthShort = new Date(yParts.year, yParts.month - 1, yParts.day).toLocaleDateString('en-US', {month: 'short' });
                return `Yesterday (${yParts.day} ${monthShort})`;
    }
                if (hourlyRange === 'last24h') {
      return 'Rolling Past 24 Hours';
    }
                const monthShort = new Date(targetYear, targetMonth - 1, selectedDay).toLocaleDateString('en-US', {month: 'short' });
                return `${selectedDay} ${monthShort} (24 Hours)`;
  }, [hourlyRange, storeNow, targetYear, targetMonth, selectedDay]);

                if (!data || data.length === 0) {
    return (
                <div className="h-[260px] sm:h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
                  <p className="text-sm font-medium">No order data available for this month</p>
                  <p className="text-xs text-muted-foreground/80">Orders will appear here as they are placed</p>
                </div>
                );
  }

  const handlePointClick = (entry?: ChartClickPayload | null) => {
    if (viewMode === 'month' && entry) {
      const dayNum = entry.dayNum || (entry.payload && entry.payload.dayNum);
      if (dayNum) {
        setSelectedDay(dayNum);
        setHourlyRange('day');
        setViewMode('24h');
      }
    }
  };

                        return (
                        <div className="space-y-3.5">
                          {/* Chart Top Controls & Metric Switcher */}
                          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
                            {/* Metric Selector Tabs */}
                            <div className="flex items-center gap-1.5 p-1 rounded-full bg-muted border border-border">
                              <button
                                type="button"
                                onClick={() => setMetric('revenue')}
                                className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-normal transition-all active:scale-95 ${metric === 'revenue'
                                    ? 'bg-card text-foreground border border-border shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                  }`}
                              >
                                <IndianRupee size={13} />
                                <span>{viewMode === 'month' ? 'Daily Revenue' : 'Hourly Revenue'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setMetric('orders')}
                                className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-normal transition-all active:scale-95 ${metric === 'orders'
                                    ? 'bg-card text-foreground border border-border shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                  }`}
                              >
                                <Inbox size={13} />
                                <span>{viewMode === 'month' ? 'Orders per Day' : 'Orders per Hour'}</span>
                              </button>
                            </div>

                            {/* Center / Right: View Mode Toggle (Month vs 24 Hours) + Stats + Style */}
                            <div className="flex items-center flex-wrap gap-2 text-xs">
                              {/* Horizon Toggle: Month vs 24 Hours */}
                              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted border border-border">
                                <button
                                  type="button"
                                  onClick={() => setViewMode('month')}
                                  className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${viewMode === 'month'
                                      ? 'bg-card text-foreground shadow-xs'
                                      : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                  <CalendarDays size={12} />
                                  <span>Month</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewMode('24h');
                                    if (isCurrentMonth && hourlyRange !== 'yesterday' && hourlyRange !== 'last24h') {
                                      setHourlyRange('today');
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${viewMode === '24h'
                                      ? 'bg-card text-foreground shadow-xs'
                                      : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                  <Clock size={12} />
                                  <span>24 Hours</span>
                                </button>
                              </div>

                                      {/* Stats Summary Pill */}
                                      {metric === 'revenue' ? (
                                        <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/60 text-foreground font-medium text-[11px]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Total: ₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                          </span>
                                          {stats.peakRevenue > 0 && (
                                            <span className="text-[11px] text-muted-foreground">
                                              • Peak: <strong className="text-foreground font-medium">₹{stats.peakRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> ({stats.peakRevenueDay})
                                            </span>
              )}
                                        </div>
                                      ) : (
                                      <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/60 text-foreground font-medium text-[11px]">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                          Total: {stats.totalOrders} {stats.totalOrders === 1 ? 'order' : 'orders'}
                                        </span>
                                        {stats.peakOrders > 0 && (
                                          <span className="text-[11px] text-muted-foreground">
                                            • Peak: <strong className="text-foreground font-medium">{stats.peakOrders} orders</strong> ({stats.peakOrdersDay})
                                          </span>
              )}
                                  </div>
                                )}

                                {isCurrentMonth && viewMode === 'month' && (
                                  <span className="text-[10px] text-muted-foreground bg-muted border border-border/60 px-2 py-0.5 rounded-md font-medium">
                                    Month-to-date
                                  </span>
                                )}

          {/* Chart Display Style: Area / Bars */}
          <div className="flex items-center p-0.5 rounded-lg bg-muted border border-border text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setChartType('area')}
                                      aria-label="Area trend view"
                                      className={`px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium transition-all ${chartType === 'area'
                                          ? 'bg-card text-foreground shadow-xs'
                                          : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                      <TrendingUp size={12} />
                                      <span className="hidden xs:inline">Trend</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setChartType('bar')}
                                      aria-label="Bar chart view"
                                      className={`px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium transition-all ${chartType === 'bar'
                                          ? 'bg-card text-foreground shadow-xs'
                                          : 'text-muted-foreground hover:text-foreground'
              }`}
            >
                                  <BarChart2 size={12} />
                                  <span className="hidden xs:inline">Bars</span>
                                </button>
                              </div>
                            </div>
                          </div>

                                  {/* 24-Hour Range Sub-Selector Toolbar (Appears when 24 Hours is selected) */}
                                  {viewMode === '24h' && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 pb-1 border-t border-border/60 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              24h Options:
            </span>
            <button
              type="button"
              onClick={() => setHourlyRange('today')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 ${
                hourlyRange === 'today'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setHourlyRange('yesterday')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 ${
                hourlyRange === 'yesterday'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setHourlyRange('last24h')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 ${
                hourlyRange === 'last24h'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Last 24 Hours
            </button>

            {/* Select Day dropdown for any other calendar day */}
            {availableDays.length > 0 && (
              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-[11px] text-muted-foreground">or</span>
                <select
                  value={hourlyRange === 'day' ? selectedDay : ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setSelectedDay(val);
                      setHourlyRange('day');
                    }
                  }}
                  className={`text-xs rounded-full px-2.5 py-1 border transition-all cursor-pointer ${
                    hourlyRange === 'day'
                      ? 'bg-primary text-primary-foreground border-primary font-medium shadow-xs'
                      : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <option value="" disabled className="text-foreground bg-card">
                    Select Day...
                  </option>
                  {availableDays.map((d) => (
                    <option key={d.dayNum} value={d.dayNum} className="text-foreground bg-card">
                      {d.day} ({d.ordersCount} {d.ordersCount === 1 ? 'order' : 'orders'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active Period Label & Quick Link to Month */}
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-muted border border-border text-[11px] text-foreground font-mono">
                                      <Clock size={11} className="text-primary" />
                                      {current24hLabel}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setViewMode('month')}
                                      className="text-[11px] text-primary hover:underline font-medium"
                                    >
                                      ← Back to {monthDisplay || 'Month'}
                                    </button>
                                  </div>
                                </div>
                              )}

      {/* Responsive Chart Container */}
      <div className="h-[260px] sm:h-[300px] md:h-[340px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  {chartType === 'area' ? (
                                    <AreaChart
                                      data={activeData}
                                      margin={{
                                        top: 20,
                                        right: 20,
                                        left: 0,
                                        bottom: 10,
                                      }}
                                    >
                                      <defs>
                                        <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor={strokeColor} stopOpacity={isDark ? 0.28 : 0.2} />
                                          <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                                        </linearGradient>
                                      </defs>

                                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

                                      <XAxis
                                        dataKey="day"
                                        stroke={axisColor}
                                        tick={{ fill: axisColor, fontSize: 11 }}
                                        tickMargin={12}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={
                                          viewMode === '24h'
                                            ? 2 // Every 3 hours (12 AM, 3 AM, 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM)
                                            : activeData.length <= 15
                                              ? 0
                                              : activeData.length <= 25
                                                ? 1
                                                : 2
                                        }
                                      />

                                      <YAxis
                                        stroke={axisColor}
                                        tick={{ fill: axisColor, fontSize: 11 }}
                                        allowDecimals={false}
                                        tickFormatter={(value) => {
                                          if (metric === 'orders') {
                                            return `${value}`;
                                          }
                                        if(value === 0) return '₹0';
                  if (value >= 100000) return `₹${(value / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`;
                  if (value >= 1000) return `₹${(value / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}k`;
                                  return `₹${value}`;
                }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickMargin={10}
                                  width={metric === 'orders' ? 35 : 55}
              />

                                  <Tooltip
                                    content={
                                      <CustomTooltip activeMetric={metric} viewMode={viewMode} />
                                    }
                                  />

                                  <Area
                                    type="monotone"
                                    dataKey={metric === 'revenue' ? 'revenue' : 'ordersCount'}
                                    stroke={strokeColor}
                                    strokeWidth={2.5}
                                    fill="url(#metricGradient)"
                                    dot={
                                      viewMode === '24h'
                                        ? false
                                        : activeData.length <= 15
                                          ? { r: 3.5, fill: strokeColor, stroke: dotRing, strokeWidth: 1.5 }
                                          : false
                                    }
                                    activeDot={{ r: 5.5, fill: strokeColor, stroke: dotRing, strokeWidth: 2 }}
                                  />
                                </AreaChart>
                                ) : (
                                <BarChart
                                  data={activeData}
                                  margin={{
                                    top: 20,
                                    right: 20,
                                    left: 0,
                                    bottom: 10,
                                  }}
                                >
                                  <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor={strokeColor} stopOpacity={0.9} />
                                      <stop offset="100%" stopColor={strokeColor} stopOpacity={0.4} />
                                    </linearGradient>
                                  </defs>

                                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

                                  <XAxis
                                    dataKey="day"
                                    stroke={axisColor}
                                    tick={{ fill: axisColor, fontSize: 11 }}
                                    tickMargin={12}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={
                                      viewMode === '24h'
                                        ? 2
                                        : activeData.length <= 15
                                          ? 0
                                          : activeData.length <= 25
                                            ? 1
                                            : 2
                                    }
                                  />

                          <YAxis
                            stroke={axisColor}
                            tick={{ fill: axisColor, fontSize: 11 }}
                            allowDecimals={false}
                            tickFormatter={(value) => {
                              if (metric === 'orders') {
                                return `${value}`;
                              }
                              if (value === 0) return '₹0';
                              if (value >= 100000) return `₹${(value / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`;
                              if (value >= 1000) return `₹${(value / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}k`;
                              return `₹${value}`;
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={10}
                            width={metric === 'orders' ? 35 : 55}
                          />

                          <Tooltip
                            content={
                              <CustomTooltip activeMetric={metric} viewMode={viewMode} />
                            }
                          />

                          <Bar
                            dataKey={metric === 'revenue' ? 'revenue' : 'ordersCount'}
                            fill="url(#barGradient)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={viewMode === '24h' ? 24 : 36}
                            onClick={handlePointClick}
                            className={viewMode === 'month' ? 'cursor-pointer hover:opacity-80 transition-opacity' : undefined}
                          />
                        </BarChart>
          )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                  );
}
