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
import { IndianRupee, Inbox, TrendingUp, BarChart2 } from 'lucide-react';

const emptySubscribe = () => () => {};

export interface RevenueData {
  day: string;
  revenue: number;
  ordersCount: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: RevenueData }>;
  label?: string;
  activeMetric: 'revenue' | 'orders';
}

function CustomTooltip({ active, payload, label, activeMetric }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const rev = Number(data.revenue || 0);
    const orders = Number(data.ordersCount || 0);

    return (
      <div className="p-3 rounded-xl border border-border shadow-xl bg-card/95 backdrop-blur-md text-card-foreground min-w-[180px] space-y-2">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/60">
          <span className="text-xs font-semibold text-foreground">{label}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">24h Day</span>
        </div>
        <div className="space-y-1.5">
          <div className={`flex items-center justify-between text-xs px-1.5 py-0.5 rounded ${activeMetric === 'revenue' ? 'bg-muted/70 font-semibold' : ''}`}>
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
              Revenue:
            </span>
            <span className="font-bold font-mono text-foreground">
              ₹{rev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className={`flex items-center justify-between text-xs px-1.5 py-0.5 rounded ${activeMetric === 'orders' ? 'bg-muted/70 font-semibold' : ''}`}>
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
              Orders:
            </span>
            <span className="font-bold font-mono text-foreground">
              {orders.toLocaleString('en-IN')} {orders === 1 ? 'order' : 'orders'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function RevenueChart({ 
  data, 
  isCurrentMonth = false 
}: { 
  data: RevenueData[];
  isCurrentMonth?: boolean;
}) {
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';
  const axisColor = isDark ? '#a1a1aa' : '#64748b';
  const strokeColor = metric === 'revenue' 
    ? (isDark ? '#34d399' : '#059669') 
    : (isDark ? '#60a5fa' : '#2563eb');
  const dotRing = isDark ? '#0d0d0d' : '#ffffff';

  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { totalRevenue: 0, totalOrders: 0, peakRevenue: 0, peakRevenueDay: '', peakOrders: 0, peakOrdersDay: '' };
    }
    let totalRevenue = 0;
    let totalOrders = 0;
    let peakRevenue = 0;
    let peakRevenueDay = '';
    let peakOrders = 0;
    let peakOrdersDay = '';

    data.forEach((d) => {
      totalRevenue += d.revenue;
      totalOrders += d.ordersCount;
      if (d.revenue > peakRevenue) {
        peakRevenue = d.revenue;
        peakRevenueDay = d.day;
      }
      if (d.ordersCount > peakOrders) {
        peakOrders = d.ordersCount;
        peakOrdersDay = d.day;
      }
    });

    return { totalRevenue, totalOrders, peakRevenue, peakRevenueDay, peakOrders, peakOrdersDay };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] sm:h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
        <p className="text-sm font-medium">No order data available for this month</p>
        <p className="text-xs text-muted-foreground/80">Orders will appear here as they are placed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Chart Top Controls & Metric Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted border border-border">
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${
              metric === 'revenue'
                ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <IndianRupee size={13} />
            <span>Daily Revenue</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('orders')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${
              metric === 'orders'
                ? 'bg-card text-blue-600 dark:text-blue-400 shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Inbox size={13} />
            <span>Orders per Day</span>
          </button>
        </div>

        {/* Right side stats pill & chart view switcher */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
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

          {isCurrentMonth && (
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
              className={`px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium transition-all ${
                chartType === 'area'
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
              className={`px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium transition-all ${
                chartType === 'bar'
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

      {/* Responsive Chart Container */}
      <div className="h-[260px] sm:h-[300px] md:h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart
              data={data}
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
                interval={data.length <= 15 ? 0 : data.length <= 25 ? 1 : 2}
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

              <Tooltip content={<CustomTooltip activeMetric={metric} />} />

              <Area 
                type="monotone" 
                dataKey={metric === 'revenue' ? 'revenue' : 'ordersCount'} 
                stroke={strokeColor} 
                strokeWidth={2.5}
                fill="url(#metricGradient)"
                dot={
                  data.length <= 15 
                    ? { r: 3.5, fill: strokeColor, stroke: dotRing, strokeWidth: 1.5 } 
                    : false
                }
                activeDot={{ r: 5.5, fill: strokeColor, stroke: dotRing, strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={data}
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
                interval={data.length <= 15 ? 0 : data.length <= 25 ? 1 : 2}
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

              <Tooltip content={<CustomTooltip activeMetric={metric} />} />

              <Bar 
                dataKey={metric === 'revenue' ? 'revenue' : 'ordersCount'} 
                fill="url(#barGradient)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={36}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
