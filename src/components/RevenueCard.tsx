'use client';

export default function RevenueCard({ totalSales }: { totalSales: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue (All Time)</h2>
      </div>

      <p className="text-2xl sm:text-3xl font-semibold font-mono text-foreground tracking-tight truncate mt-auto">
        {`₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </p>
    </div>
  );
}
