'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const emptySubscribe = () => () => {};

export default function OrdersChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const chartData = {
    labels: data.map((d) => {
      if (!d.date) return '';
      const dateObj = new Date(d.date.includes('T') ? d.date : `${d.date}T00:00:00`);
      return !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : String(d.date);
    }),
    datasets: [
      {
        label: 'Orders',
        data: data.map((d) => d.count),
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)',
        borderRadius: 4,
        maxBarThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 15, 15, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#fff' : '#0f172a',
        bodyColor: isDark ? '#fff' : '#0f172a',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        },
        ticks: {
          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.6)',
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        },
        ticks: {
          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.6)',
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
