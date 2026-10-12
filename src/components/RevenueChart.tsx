'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

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
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const rev = Number(data.revenue || 0);
    const orders = Number(data.ordersCount || 0);

    return (
      <div className="p-3 rounded-xl border border-border shadow-xl bg-card/95 backdrop-blur-md text-card-foreground min-w-[170px] space-y-2">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/60">
          <span className="text-xs font-semibold text-foreground">{label}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Daily</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
              Revenue:
            </span>
            <span className="font-bold font-mono text-foreground">
              ₹{rev.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
              Orders:
            </span>
            <span className="font-semibold font-mono text-foreground">
              {orders.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function RevenueChart({ data }: { data: RevenueData[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';
  const axisColor = isDark ? '#a1a1aa' : '#64748b';
  const strokeColor = isDark ? '#ffffff' : '#0f172a';
  const dotRing = isDark ? '#0d0d0d' : '#ffffff';

  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] sm:h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
        <p className="text-sm font-medium">No revenue data available for this month</p>
        <p className="text-xs text-muted-foreground/80">Orders will appear here as they are placed</p>
      </div>
    );
  }

  return (
    <div className="h-[260px] sm:h-[300px] md:h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
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
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={isDark ? 0.2 : 0.15} />
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
            tickFormatter={(value) => {
              if (value === 0) return '₹0';
              if (value >= 100000) return `₹${(value / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`;
              if (value >= 1000) return `₹${(value / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}k`;
              return `₹${value}`;
            }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            width={55}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke={strokeColor} 
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={
              data.length <= 15 
                ? { r: 3.5, fill: strokeColor, stroke: dotRing, strokeWidth: 1.5 } 
                : false
            }
            activeDot={{ r: 5.5, fill: strokeColor, stroke: dotRing, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
