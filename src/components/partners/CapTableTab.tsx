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
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">Equity & Ownership Cap Table</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/15">
              {summary?.totalAllocatedEquity || 0}% Allocated
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Equity Stake (%)</th>
                <th className="py-3 px-4">Total Invested</th>
                <th className="py-3 px-4">Withdrawn</th>
                <th className="py-3 px-4">Net Capital Balance</th>
                <th className="py-3 px-4">Share of Capital Fund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {partners.map((partner) => {
                const capitalShare = totalFund > 0 ? ((partner.totalInvested / totalFund) * 100).toFixed(1) : '0.0';
                const isActive = partner.status === 'ACTIVE';

                return (
                  <tr key={partner.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {partner.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/10 text-white/80 border border-white/15'
                            : 'bg-white/5 text-neutral-400 border border-white/10'
                        }`}
                      >
                        {partner.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-mono">
                      {partner.equityPercentage}%
                    </td>
                    <td className="py-3.5 px-4 text-white font-mono font-medium">
                      {formatCurrency(partner.totalInvested)}
                    </td>
                    <td className="py-3.5 px-4 text-white/80 font-mono">
                      {formatCurrency(partner.totalWithdrawn)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-mono">
                      {formatCurrency(partner.netCapital)}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300 font-mono">
                      {capitalShare}%
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="border-t-2 border-white/10 bg-white/[0.04] font-bold text-white font-mono">
                <td className="py-3.5 px-4 font-sans font-bold">Total</td>
                <td className="py-3.5 px-4 font-sans font-normal text-neutral-400">—</td>
                <td className="py-3.5 px-4 text-white">{summary?.totalAllocatedEquity || 0}%</td>
                <td className="py-3.5 px-4 text-white">{formatCurrency(summary?.totalInvested || 0)}</td>
                <td className="py-3.5 px-4 text-white/80">{formatCurrency(summary?.totalWithdrawn || 0)}</td>
                <td className="py-3.5 px-4 text-white">{formatCurrency(summary?.netActiveCapitalPool || 0)}</td>
                <td className="py-3.5 px-4 text-white">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
