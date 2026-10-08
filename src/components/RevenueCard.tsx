'use client';

export default function RevenueCard({ totalSales }: { totalSales: number }) {
  return (
    <div className="group bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-8 hover:bg-white/[0.06] transition-all duration-500 relative shadow-2xl flex flex-col justify-between">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500 pointer-events-none"></div>

      <div className="flex items-center justify-between relative z-10 mb-2 md:mb-3">
        <h2 className="text-sm font-medium text-neutral-400">Total Revenue (All Time)</h2>
      </div>

      <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight relative z-10 truncate mt-auto">
        {`₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </p>
    </div>
  );
}

