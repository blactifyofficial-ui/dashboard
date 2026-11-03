'use client';

import { CodStats } from './types';
import { Banknote, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CodSummaryCardsProps {
  stats: CodStats;
  timeRangeLabel?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function CodSummaryCards({ stats, timeRangeLabel }: CodSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Total COD Amount from Orders */}
        <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[-0.1px]">
                  Total COD Orders
                </span>
                  <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                    <Banknote size={16} className="text-foreground" />
                  </div>
                </div>
                  <div className="text-[26px] sm:text-[32px] font-semibold font-mono text-foreground tracking-[-0.374px]">
                    {formatCurrency(stats.totalCodAmount)}
                  </div>
                </div>
                  <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[12px] text-muted-foreground">
                    <span>{stats.totalCodCount} orders from store</span>
                    {timeRangeLabel && <span className="font-semibold text-foreground">{timeRangeLabel}</span>}
                  </div>
                </div>

                {/* 2. Collected Amount */}
                  <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[12px] font-semibold text-[#0066cc] dark:text-[#2997ff] uppercase tracking-[-0.1px] flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="shrink-0" />
                            Collected Amount
                          </span>
                            <Badge variant="default" size="sm" className="font-mono">
                              {stats.remittanceCount} {stats.remittanceCount === 1 ? 'payout' : 'payouts'}
                            </Badge>
                          </div>
                            <div className="text-[26px] sm:text-[32px] font-semibold font-mono text-[#0066cc] dark:text-[#2997ff] tracking-[-0.374px]">
                              {formatCurrency(stats.collectedAmount)}
                            </div>
                          </div>
                            <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[12px] text-muted-foreground">
                              <span>Total remitted to accounts</span>
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                                {stats.collectionRate}% collected
                              </span>
                            </div>
                          </div>

                          {/* 3. Pending to Collect */}
                            <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-[-0.1px] flex items-center gap-1.5">
                                      <Clock size={14} className="shrink-0" />
                                      Pending to Collect
                                    </span>
                                    <Badge variant="warning" size="sm" className="font-mono">
                                      Due Balance
                                    </Badge>
                                </div>
                                  <div className="text-[26px] sm:text-[32px] font-semibold font-mono text-amber-600 dark:text-amber-400 tracking-[-0.374px]">
                                    {formatCurrency(stats.pendingAmount)}
                                  </div>
                                </div>
                                  <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[12px] text-muted-foreground">
                                    <span>Remaining from couriers</span>
                                      <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                                        {100 - Math.min(100, stats.collectionRate)}% remaining
                                      </span>
                                  </div>
                                </div>

                                {/* 4. Collection Progress */}
                                  <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between gap-2 mb-2">
                                          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[-0.1px] flex items-center gap-1.5">
                                            <TrendingUp size={14} className="shrink-0 text-[#0066cc] dark:text-[#2997ff]" />
                                            Collection Rate
                                          </span>
                                            <span className="font-mono text-xs font-semibold text-foreground">
                                              {stats.collectionRate}%
                                            </span>
                                          </div>
                                            <div className="text-[26px] sm:text-[32px] font-semibold font-mono text-foreground tracking-[-0.374px]">
                                              {stats.collectionRate}%
                                            </div>
                                          </div>
                                          <div className="mt-3 pt-3 border-t border-border/60">
                                              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden border border-border/40">
                                                <div
                                                  className="h-full bg-[#0066cc] dark:bg-[#2997ff] transition-all duration-500 rounded-full"
                                                  style={{ width: `${Math.min(100, stats.collectionRate)}%` }}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                      </div>
                                      );
}
