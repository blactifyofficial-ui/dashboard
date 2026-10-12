'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from './LoadingSpinner';

const DynamicOrdersChart = dynamic(() => import('./OrdersChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] sm:h-[320px] flex items-center justify-center">
      <LoadingSpinner size="small" />
    </div>
  )
});

export default DynamicOrdersChart;
