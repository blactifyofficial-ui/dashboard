'use client';

import { Partner, SummaryData } from './types';
import { formatCurrency } from './utils';

interface CapTableTabProps {
  partners: Partner[];
  summary: SummaryData | null;
}

export default function CapTableTab({ partners, summary }: CapTableTabProps) {
  const totalFund = summary?.totalInvested || 0;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Equity &amp; Ownership Cap Table</h3>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground border border-border">
              {summary?.totalAllocatedEquity || 0}% Allocated
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-2.5 px-4">Partner</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Equity Stake (%)</th>
                <th className="py-2.5 px-4">Total Invested</th>
                <th className="py-2.5 px-4">Payouts Taken</th>
                <th className="py-2.5 px-4">Withdrawn</th>
                <th className="py-2.5 px-4">Net Capital Balance</th>
                <th className="py-2.5 px-4">Share of Capital Fund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {partners.map((partner) => {
                const capitalShare = totalFund > 0 ? ((partner.totalInvested / totalFund) * 100).toFixed(1) : '0.0';
                const isActive = partner.status === 'ACTIVE';

                return (
                  <tr key={partner.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {partner.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isActive
                            ? 'bg-muted text-foreground border border-border'
                            : 'bg-muted/40 text-muted-foreground border border-border/40'
                        }`}
                      >
                        {partner.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground font-mono">
                      {partner.equityPercentage}%
                    </td>
                    <td className="py-3 px-4 text-foreground font-mono font-medium">
                      {formatCurrency(partner.totalInvested)}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      {formatCurrency(partner.totalPayout || 0)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">
                      {formatCurrency(partner.totalWithdrawn)}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground font-mono">
                      {formatCurrency(partner.netCapital)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">
                      {capitalShare}%
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="border-t-2 border-border bg-muted/30 font-bold text-foreground font-mono text-xs">
                <td className="py-3 px-4 font-sans font-bold">Total</td>
                <td className="py-3 px-4 font-sans font-normal text-muted-foreground">—</td>
                <td className="py-3 px-4 text-foreground">{summary?.totalAllocatedEquity || 0}%</td>
                <td className="py-3 px-4 text-foreground">{formatCurrency(summary?.totalInvested || 0)}</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">{formatCurrency(summary?.totalPayouts || 0)}</td>
                <td className="py-3 px-4 text-muted-foreground">{formatCurrency(summary?.totalWithdrawn || 0)}</td>
                <td className="py-3 px-4 text-foreground">{formatCurrency(summary?.netActiveCapitalPool || 0)}</td>
                <td className="py-3 px-4 text-foreground">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
