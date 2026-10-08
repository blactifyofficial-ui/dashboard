'use client';

import { Partner, SummaryData } from './types';
import { formatCurrency } from './utils';

interface PartnerSummaryCardsProps {
  summary: SummaryData | null;
  partners: Partner[];
}

const PARTNER_COLORS = [
  { bg: 'bg-emerald-400', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  { bg: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-400' },
  { bg: 'bg-purple-500', dot: 'bg-purple-500', text: 'text-purple-400' },
  { bg: 'bg-amber-400', dot: 'bg-amber-400', text: 'text-amber-400' },
  { bg: 'bg-rose-400', dot: 'bg-rose-400', text: 'text-rose-400' },
  { bg: 'bg-cyan-400', dot: 'bg-cyan-400', text: 'text-cyan-400' },
  { bg: 'bg-indigo-400', dot: 'bg-indigo-400', text: 'text-indigo-400' },
  { bg: 'bg-orange-400', dot: 'bg-orange-400', text: 'text-orange-400' },
];

export default function PartnerSummaryCards({ summary, partners }: PartnerSummaryCardsProps) {
  const totalFund = summary?.totalInvested || 0;
  const netCapital = summary?.netActiveCapitalPool || 0;
  const totalPayouts = summary?.totalPayouts || 0;
  const allocatedEquity = summary?.totalAllocatedEquity || 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Invested */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Total Capital In</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
            {formatCurrency(totalFund)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {partners.length} {partners.length === 1 ? 'partner' : 'partners'} total
          </p>
        </div>

        {/* Card 2: Total Payouts Taken */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wider">Total Payouts Taken</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(totalPayouts)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Distributed to partners
          </p>
        </div>

        {/* Card 3: Net Active Capital */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Net Capital Pool</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
            {formatCurrency(netCapital)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary?.activePartnerCount || 0} active {summary?.activePartnerCount === 1 ? 'contributor' : 'contributors'}
          </p>
        </div>

        {/* Card 4: Equity Stake */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Equity Allocated</p>
            <span className="text-xs font-mono text-muted-foreground">{allocatedEquity}%</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
            {allocatedEquity}%
          </p>
          <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(allocatedEquity, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Capital Contribution Breakdown Bar */}
      {partners.length > 0 && totalFund > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capital Pool Distribution</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-foreground border border-border">
                {partners.filter(p => p.totalInvested > 0).length} {partners.filter(p => p.totalInvested > 0).length === 1 ? 'Contributor' : 'Contributors'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Total: <strong className="text-foreground font-semibold">{formatCurrency(totalFund)}</strong>
            </span>
          </div>

          {/* Progress Stack Bar */}
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex gap-0.5">
            {partners
              .filter((p) => p.totalInvested > 0)
              .map((partner, index) => {
                const percentage = ((partner.totalInvested / totalFund) * 100).toFixed(1);
                const colorObj = PARTNER_COLORS[index % PARTNER_COLORS.length];

                return (
                  <div
                    key={partner.id}
                    style={{ width: `${percentage}%` }}
                    className={`${colorObj.bg} h-full transition-all duration-300 hover:opacity-90`}
                    title={`${partner.name}: ${formatCurrency(partner.totalInvested)} (${percentage}%)`}
                  />
                );
              })}
          </div>

          {/* Partner Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
            {partners
              .filter((p) => p.totalInvested > 0)
              .map((partner, index) => {
                const percentage = ((partner.totalInvested / totalFund) * 100).toFixed(1);
                const colorObj = PARTNER_COLORS[index % PARTNER_COLORS.length];

                return (
                  <div key={partner.id} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${colorObj.dot}`} />
                    <span className="text-foreground font-medium">{partner.name}</span>
                    <span className="text-muted-foreground font-mono">({percentage}%)</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
