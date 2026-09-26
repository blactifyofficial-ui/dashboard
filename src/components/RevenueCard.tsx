'use client';
import { useState } from 'react';
import { Eye, EyeClosed } from 'lucide-react';

export default function RevenueCard({ totalSales }: { totalSales: number }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-8  hover:bg-white/[0.06] transition-all duration-500 relative shadow-2xl flex flex-col">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>

      <div className="flex items-center justify-between relative z-10 mb-2 md:mb-3">
        <h2 className="text-sm font-medium text-neutral-400">Total Revenue (All Time)</h2>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-neutral-400 hover:text-white transition-colors p-1"
          aria-label={isVisible ? "Hide revenue" : "Show revenue"}
        >
          {isVisible ? <Eye size={18} /> : <EyeClosed size={18} />}
        </button>
      </div>

      <p className="text-4xl md:text-5xl font-bold text-white tracking-tight relative z-10 truncate mt-auto">
        {isVisible
          ? `₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '₹••••••••'}
      </p>
    </div>
  );
}
