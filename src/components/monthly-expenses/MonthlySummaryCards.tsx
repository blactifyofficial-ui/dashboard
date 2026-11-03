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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Budgeted / Expected */}
            <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6">
              <p className="text-[12px] font-semibold text-muted-foreground mb-1 uppercase tracking-[-0.1px]">Total Planned</p>
              <p className="text-[26px] sm:text-[32px] font-semibold font-mono text-foreground tracking-[-0.374px]">
                {formatCurrency(stats.totalExpected)}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">{stats.totalItems} recurring {stats.totalItems === 1 ? 'item' : 'items'}</p>
            </div>

            {/* Total Paid */}
                <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6">
                  <p className="text-[12px] font-semibold text-muted-foreground mb-1 uppercase tracking-[-0.1px]">Total Paid</p>
                  <p className="text-[26px] sm:text-[32px] font-semibold font-mono text-[#0066cc] dark:text-[#2997ff] tracking-[-0.374px]">
                    {formatCurrency(stats.totalPaid)}
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">{stats.paidCount} of {stats.totalItems} settled</p>
                </div>

                {/* Remaining Due */}
                    <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6">
                      <p className="text-[12px] font-semibold text-muted-foreground mb-1 uppercase tracking-[-0.1px]">Remaining Due</p>
                      <p className="text-[26px] sm:text-[32px] font-semibold font-mono text-foreground tracking-[-0.374px]">
                        {formatCurrency(stats.totalPending)}
                      </p>
                      <p className="mt-1 text-[13px] text-muted-foreground">{stats.pendingCount} pending</p>
                    </div>

                    {/* Completion % */}
                      <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[-0.1px]">Settled</p>
                          <span className="text-[12px] font-mono font-semibold text-foreground">{stats.progressPercentage}%</span>
                        </div>
                          <p className="text-[26px] sm:text-[32px] font-semibold font-mono text-foreground tracking-[-0.374px]">
                            {stats.progressPercentage}%
                          </p>
                            <div className="w-full bg-muted h-1.5 rounded-full mt-2.5 overflow-hidden border border-border/40">
                              <div
                                className="h-full bg-[#0066cc] dark:bg-[#2997ff] rounded-full transition-all duration-300"
                                style={{ width: `${stats.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                      </div>
                      );
}
