'use client';

import {
  LineChart,
  Line,
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
  isDark?: boolean;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 rounded-lg border border-border shadow-lg bg-popover text-popover-foreground">
        <p className="text-xs mb-1.5 text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold mb-1">
          Revenue: ₹{Number(data.revenue).toLocaleString('en-IN')}
        </p>
        <p className="text-sm font-medium">
          Orders: {Number(data.ordersCount ?? 0).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
}

export default function RevenueChart({ data }: { data: RevenueData[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const gridStroke = isDark ? '#262626' : '#e2e8f0';
  const axisColor = isDark ? '#a1a1aa' : '#64748b';
  const lineColor = isDark ? '#ffffff' : '#0f172a';

  return (
    <div className="h-[260px] sm:h-[300px] md:h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke={axisColor} 
            tick={{ fill: axisColor, fontSize: 12 }} 
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke={axisColor} 
            tick={{ fill: axisColor, fontSize: 12 }} 
            tickFormatter={(value) => `₹${value}`}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip isDark={isDark} />} />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke={lineColor} 
            strokeWidth={3}
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6, fill: lineColor, stroke: gridStroke, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
