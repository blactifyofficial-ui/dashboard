'use client';

import { Activity, ShieldCheck, AlertTriangle, AlertCircle, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { AiStrategicReport } from '@/lib/ai/prompts';
import { FinancialSnapshot } from '@/lib/ai/financial-aggregator';

interface HealthScoreCardProps {
  report: AiStrategicReport;
  snapshot: FinancialSnapshot;
}

export default function HealthScoreCard({ report, snapshot }: HealthScoreCardProps) {
  const score = report.healthScore ?? 75;

  let scoreColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  let statusBadge = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  let statusIcon = ShieldCheck;

  if (score < 40) {
    scoreColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    statusBadge = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    statusIcon = AlertCircle;
  } else if (score < 60) {
    scoreColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    statusBadge = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    statusIcon = AlertTriangle;
  } else if (score < 80) {
    scoreColor = 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    statusBadge = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    statusIcon = Activity;
  }

  const StatusIconComponent = statusIcon;

  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Score Gauge */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Activity size={14} className="text-primary shrink-0" />
              Business Health Rating
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${statusBadge}`}>
              <StatusIconComponent size={12} />
              {report.healthStatus || 'STABLE'}
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${scoreColor.split(' ')[0]}`}>
              {score}
            </div>
            <span className="text-sm font-medium text-muted-foreground">/ 100</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Composite score weighted across net operating margin, cash flow runway, COD return risk, and Meta Ads return efficiency.
          </p>

          {/* Quick Ledger Snapshot Bar */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
            <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Net Operating Income</span>
              <span className={`text-xs sm:text-sm font-mono font-bold ${snapshot.profitability.netOperatingIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{snapshot.profitability.netOperatingIncome.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Net Margin</span>
              <span className={`text-xs sm:text-sm font-mono font-bold ${snapshot.profitability.netMarginPercent >= 15 ? 'text-emerald-400' : snapshot.profitability.netMarginPercent >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {snapshot.profitability.netMarginPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Executive Briefing & Synthetic KPIs */}
        <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Executive Strategic Briefing
            </h3>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line bg-muted/30 p-4 rounded-lg border border-border/60 font-sans">
              {report.summary}
            </p>
          </div>

          {/* Synthetic KPIs Grid */}
          {report.syntheticKpis && report.syntheticKpis.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Key Strategic Diagnostic Signals
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {report.syntheticKpis.map((kpi, idx) => {
                  let badge = 'text-neutral-300 border-border bg-muted/40';
                  if (kpi.status === 'positive') badge = 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
                  if (kpi.status === 'warning') badge = 'text-amber-300 border-amber-500/30 bg-amber-500/10';
                  if (kpi.status === 'danger') badge = 'text-rose-300 border-rose-500/30 bg-rose-500/10';

                  return (
                    <div key={idx} className="p-2.5 rounded-lg bg-card border border-border flex flex-col justify-between shadow-2xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{kpi.label}</span>
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${badge}`}>
                          {kpi.value}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                        {kpi.commentary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
