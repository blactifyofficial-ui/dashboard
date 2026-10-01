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
    <div className="space-y-5">
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white">Equity & Ownership Cap Table</h3>
        <p className="text-xs text-white/60 mt-1">
          Summary of partner equity percentage stakes compared to active net invested capital.
        </p>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-white/60 uppercase tracking-wider">
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
                return (
                  <tr key={partner.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      {partner.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          partner.status === 'ACTIVE'
                            ? 'bg-white/10 text-white border border-white/15'
                            : 'bg-white/5 text-white/40 border border-white/5'
                        }`}
                      >
                        {partner.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {partner.equityPercentage}%
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">
                      {formatCurrency(partner.totalInvested)}
                    </td>
                    <td className="py-3.5 px-4 text-white/70">
                      {formatCurrency(partner.totalWithdrawn)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {formatCurrency(partner.netCapital)}
                    </td>
                    <td className="py-3.5 px-4 text-white/70">
                      {capitalShare}%
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="border-t-2 border-white/10 bg-white/[0.02] font-bold text-white">
                <td className="py-3.5 px-4">Total</td>
                <td className="py-3.5 px-4">—</td>
                <td className="py-3.5 px-4">{summary?.totalAllocatedEquity || 0}%</td>
                <td className="py-3.5 px-4">{formatCurrency(summary?.totalInvested || 0)}</td>
                <td className="py-3.5 px-4">{formatCurrency(summary?.totalWithdrawn || 0)}</td>
                <td className="py-3.5 px-4">{formatCurrency(summary?.netActiveCapitalPool || 0)}</td>
                <td className="py-3.5 px-4">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
