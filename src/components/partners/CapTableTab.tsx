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
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-white">Equity &amp; Ownership Cap Table</h3>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
              {summary?.totalAllocatedEquity || 0}% Allocated
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
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
            <tbody className="divide-y divide-neutral-800 text-xs">
              {partners.map((partner) => {
                const capitalShare = totalFund > 0 ? ((partner.totalInvested / totalFund) * 100).toFixed(1) : '0.0';
                const isActive = partner.status === 'ACTIVE';

                return (
                  <tr key={partner.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {partner.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isActive
                            ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                            : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                        }`}
                      >
                        {partner.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white font-mono">
                      {partner.equityPercentage}%
                    </td>
                    <td className="py-3 px-4 text-white font-mono font-medium">
                      {formatCurrency(partner.totalInvested)}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-mono font-semibold">
                      {formatCurrency(partner.totalPayout || 0)}
                    </td>
                    <td className="py-3 px-4 text-neutral-300 font-mono">
                      {formatCurrency(partner.totalWithdrawn)}
                    </td>
                    <td className="py-3 px-4 font-bold text-white font-mono">
                      {formatCurrency(partner.netCapital)}
                    </td>
                    <td className="py-3 px-4 text-neutral-300 font-mono">
                      {capitalShare}%
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="border-t-2 border-neutral-800 bg-neutral-950 font-bold text-white font-mono text-xs">
                <td className="py-3 px-4 font-sans font-bold">Total</td>
                <td className="py-3 px-4 font-sans font-normal text-neutral-500">—</td>
                <td className="py-3 px-4 text-white">{summary?.totalAllocatedEquity || 0}%</td>
                <td className="py-3 px-4 text-white">{formatCurrency(summary?.totalInvested || 0)}</td>
                <td className="py-3 px-4 text-emerald-400">{formatCurrency(summary?.totalPayouts || 0)}</td>
                <td className="py-3 px-4 text-neutral-300">{formatCurrency(summary?.totalWithdrawn || 0)}</td>
                <td className="py-3 px-4 text-white">{formatCurrency(summary?.netActiveCapitalPool || 0)}</td>
                <td className="py-3 px-4 text-white">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
