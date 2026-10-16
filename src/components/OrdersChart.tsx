'use client';

import { useState, useSyncExternalStore } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';
import { BarChart2, TrendingUp } from 'lucide-react';

const emptySubscribe = () => () => {};

export interface OrderDataPoint {
  date: string;
  day?: string;
  count: number;
  revenue?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { date: string; label: string; count: number; revenue?: number } }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const orders = Number(data.count || 0);
    const rev = data.revenue;
    const title = label || data.label;

    return (
      <div className="p-3 rounded-xl border border-border shadow-xl bg-card/95 backdrop-blur-md text-card-foreground min-w-[170px] space-y-2">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/60">
          <span className="text-xs font-semibold text-foreground">{title}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Daily</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
              Orders:
            </span>
            <span className="font-bold font-mono text-foreground">
              {orders.toLocaleString('en-IN')}
            </span>
          </div>

          {rev !== undefined && rev > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                Revenue:
              </span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ₹{rev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export default function OrdersChart({
  data,
}: {
  data: OrderDataPoint[];
}) {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const barFillTop = isDark ? '#818cf8' : '#4f46e5';
  const barFillBottom = isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(79, 70, 229, 0.4)';
  const dotRing = isDark ? '#0c0d10' : '#ffffff';

  const formattedData = (data || []).map((d) => {
    let label = d.day;
    if (!label && d.date) {
      const dateObj = new Date(d.date.includes('T') ? d.date : `${d.date}T00:00:00`);
      label = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : String(d.date);
    }
    return {
      ...d,
      label: label || '',
      count: Number(d.count || 0),
    };
  });

  const totalOrders = formattedData.reduce((acc, d) => acc + d.count, 0);
  const peakOrder = formattedData.reduce(
    (max, d) => (d.count > max.count ? d : max),
    formattedData[0] || { count: 0, label: '' }
  );

  return (
    <div className="space-y-4">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/60 text-foreground font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {totalOrders} {totalOrders === 1 ? 'order' : 'orders'} this month
          </span>
          {peakOrder.count > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              • Peak: <strong className="text-foreground font-medium">{peakOrder.count}</strong> on {peakOrder.label}
            </span>
          )}
        </div>

        {/* View Switcher: Bar vs Trend */}
        <div className="flex items-center p-0.5 rounded-lg bg-muted/70 border border-border/80 text-xs">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${
              chartType === 'bar'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart2 size={13} />
            <span>Bars</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${
              chartType === 'area'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp size={13} />
            <span>Trend</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[260px] sm:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={formattedData}
              margin={{ top: 15, right: 10, left: -15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="orderBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barFillTop} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={barFillBottom} stopOpacity={0.65} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

              <XAxis
                dataKey="label"
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval={formattedData.length <= 15 ? 0 : formattedData.length <= 25 ? 1 : 2}
              />

              <YAxis
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, (dataMax: number) => Math.max(dataMax + 2, 4)]}
                tickMargin={8}
                width={35}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', radius: 6 }}
              />

              <Bar
                dataKey="count"
                fill="url(#orderBarGradient)"
                radius={[5, 5, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          ) : (
            <AreaChart
              data={formattedData}
              margin={{ top: 15, right: 10, left: -15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="orderAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barFillTop} stopOpacity={isDark ? 0.25 : 0.2} />
                  <stop offset="100%" stopColor={barFillTop} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

              <XAxis
                dataKey="label"
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval={formattedData.length <= 15 ? 0 : formattedData.length <= 25 ? 1 : 2}
              />

              <YAxis
                stroke={axisColor}
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, (dataMax: number) => Math.max(dataMax + 2, 4)]}
                tickMargin={8}
                width={35}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="count"
                stroke={barFillTop}
                strokeWidth={2.5}
                fill="url(#orderAreaGradient)"
                dot={
                  formattedData.length <= 15
                    ? { r: 3.5, fill: barFillTop, stroke: dotRing, strokeWidth: 1.5 }
                    : false
                }
                activeDot={{ r: 5.5, fill: barFillTop, stroke: dotRing, strokeWidth: 2 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
