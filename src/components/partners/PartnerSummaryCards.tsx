'use client';

import { ArrowUpRight, ArrowDownLeft, Wallet, PieChart } from 'lucide-react';
import { Partner, SummaryData } from './types';
import { formatCurrency } from './utils';

interface PartnerSummaryCardsProps {
  summary: SummaryData | null;
  partners: Partner[];
}

export default function PartnerSummaryCards({ summary, partners }: PartnerSummaryCardsProps) {
  const totalFund = summary?.totalInvested || 0;

  return (
    <div className="space-y-4">
      {/* 4 Uniform KPI Cards matching Dashboard / Meta Ads styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Total Invested */}
        <div className="group bg-white/[0.03] border border-white/5 rounded-2xl md:rounded-3xl p-6 hover:bg-white/[0.06] transition-all duration-300 relative flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-neutral-400">Total Invested</h2>
            <ArrowUpRight size={18} className="text-neutral-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white tracking-tight">
              {formatCurrency(summary?.totalInvested || 0)}
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              {partners.length} {partners.length === 1 ? 'partner' : 'partners'} across lifetime
            </p>
          </div>
        </div>

        {/* Card 2: Total Withdrawals */}
        <div className="group bg-white/[0.03] border border-white/5 rounded-2xl md:rounded-3xl p-6 hover:bg-white/[0.06] transition-all duration-300 relative flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-neutral-400">Total Withdrawals</h2>
            <ArrowDownLeft size={18} className="text-neutral-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white tracking-tight">
              {formatCurrency(summary?.totalWithdrawn || 0)}
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Capital returned or paid out
            </p>
          </div>
        </div>

        {/* Card 3: Net Active Capital */}
        <div className="group bg-white/[0.03] border border-white/5 rounded-2xl md:rounded-3xl p-6 hover:bg-white/[0.06] transition-all duration-300 relative flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-neutral-400">Net Active Capital</h2>
            <Wallet size={18} className="text-neutral-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white tracking-tight">
              {formatCurrency(summary?.netActiveCapitalPool || 0)}
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Current partner capital pool
            </p>
          </div>
        </div>

        {/* Card 4: Equity Allocated */}
        <div className="group bg-white/[0.03] border border-white/5 rounded-2xl md:rounded-3xl p-6 hover:bg-white/[0.06] transition-all duration-300 relative flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-neutral-400">Equity Allocated</h2>
            <PieChart size={18} className="text-neutral-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white tracking-tight">
              {summary?.totalAllocatedEquity || 0}%
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              {summary?.activePartnerCount || 0} active of {summary?.partnerCount || 0} registered
            </p>
          </div>
        </div>
      </div>

      {/* Capital Contribution Breakdown Bar */}
      {partners.length > 0 && totalFund > 0 && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white/80">Capital Pool Distribution</h2>
            <span className="text-xs text-white/60">
              Total Invested: <span className="text-white font-medium">{formatCurrency(totalFund)}</span>
            </span>
          </div>

          {/* Progress Stack Bar */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex gap-0.5">
            {partners
              .filter((p) => p.totalInvested > 0)
              .map((partner, index) => {
                const percentage = ((partner.totalInvested / totalFund) * 100).toFixed(1);
                const opacities = [
                  'bg-white',
                  'bg-white/80',
                  'bg-white/60',
                  'bg-white/45',
                  'bg-white/30',
                  'bg-white/20',
                ];
                const shade = opacities[index % opacities.length];

                return (
                  <div
                    key={partner.id}
                    style={{ width: `${percentage}%` }}
                    className={`${shade} h-full transition-all duration-300 hover:opacity-80`}
                    title={`${partner.name}: ${formatCurrency(partner.totalInvested)} (${percentage}%)`}
                  />
                );
              })}
          </div>

          {/* Partner Legend */}
          <div className="flex items-center gap-4 mt-3 flex-wrap text-xs">
            {partners
              .filter((p) => p.totalInvested > 0)
              .map((partner, index) => {
                const percentage = ((partner.totalInvested / totalFund) * 100).toFixed(1);
                const dotOpacities = [
                  'bg-white',
                  'bg-white/80',
                  'bg-white/60',
                  'bg-white/45',
                  'bg-white/30',
                  'bg-white/20',
                ];
                return (
                  <div key={partner.id} className="flex items-center gap-1.5 text-white/70">
                    <span className={`w-2 h-2 rounded-full ${dotOpacities[index % dotOpacities.length]}`} />
                    <span className="font-medium text-white">{partner.name}</span>
                    <span className="text-white/50">({percentage}%)</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
