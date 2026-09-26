'use client';

import dynamic from 'next/dynamic';

const DynamicOrdersChart = dynamic(() => import('./OrdersChart'), {
  ssr: false,
  loading: () => <div className="w-full h-64 animate-pulse bg-white/5 rounded-xl"></div>
});

export default DynamicOrdersChart;
