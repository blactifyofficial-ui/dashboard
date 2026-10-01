'use client';

import { MonthlyStats } from './types';

interface MonthlySummaryCardsProps {
  stats: MonthlyStats;
  monthLabel?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function MonthlySummaryCards({ stats }: MonthlySummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Budgeted / Expected */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Total Planned</p>
        <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
          {formatCurrency(stats.totalExpected)}
        </p>
        <p className="mt-1 text-xs text-white/40">{stats.totalItems} recurring {stats.totalItems === 1 ? 'item' : 'items'}</p>
      </div>

      {/* Total Paid */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Total Paid</p>
        <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
          {formatCurrency(stats.totalPaid)}
        </p>
        <p className="mt-1 text-xs text-white/40">{stats.paidCount} of {stats.totalItems} settled</p>
      </div>

      {/* Remaining Due */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Remaining Due</p>
        <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
          {formatCurrency(stats.totalPending)}
        </p>
        <p className="mt-1 text-xs text-white/40">{stats.pendingCount} pending</p>
      </div>

      {/* Completion % */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Settled</p>
          <span className="text-xs font-mono text-white/60">{stats.progressPercentage}%</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
          {stats.progressPercentage}%
        </p>
        <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${stats.progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
