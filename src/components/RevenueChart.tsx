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
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
            labelStyle={{ color: '#888', marginBottom: '4px' }}
          />
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
