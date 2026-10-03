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
    return (
      <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px' }}>
        <p style={{ color: '#888', margin: '0 0 6px 0', fontSize: '13px' }}>{label}</p>
        <p style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '14px', fontWeight: 500 }}>
          Revenue : ₹{Number(data.revenue).toLocaleString('en-IN')}
        </p>
        <p style={{ color: '#fff', margin: 0, fontSize: '14px', fontWeight: 500 }}>
          Orders : {Number(data.ordersCount ?? 0).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
}

export default function RevenueChart({ data }: { data: RevenueData[] }) {
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
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke="#888" 
            tick={{ fill: '#888' }} 
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#888" 
            tick={{ fill: '#888' }} 
            tickFormatter={(value) => `₹${value}`}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#fff" 
            strokeWidth={3}
            dot={{ fill: '#fff', r: 4 }}
            activeDot={{ r: 6, fill: '#fff', stroke: '#333', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
