'use client';

import { DebtsSummary } from './types';
import { formatCurrency } from './utils';
import { ArrowUpRight, ArrowDownLeft, Scale, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DebtsSummaryCardsProps {
  summary: DebtsSummary | null;
}

export default function DebtsSummaryCards({ summary }: DebtsSummaryCardsProps) {
  const lentOutstanding = summary?.totalLentOutstanding ?? 0;
  const lentPrincipal = summary?.totalLentPrincipal ?? 0;
  const borrowerCount = summary?.borrowerCount ?? 0;

  const borrowedOutstanding = summary?.totalBorrowedOutstanding ?? 0;
  const borrowedPrincipal = summary?.totalBorrowedPrincipal ?? 0;
  const lenderCount = summary?.lenderCount ?? 0;

  const netPosition = summary?.netPosition ?? 0;
  const overdueCount = summary?.overdueCount ?? 0;
  const overdueAmount = summary?.overdueAmount ?? 0;

  const isNetPositive = netPosition >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Card 1: Net Balance Position */}
      <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 shadow-none flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Net Position
          </span>
          <Badge
            className={`text-[10px] px-2.5 py-0.5 border ${
              isNetPositive
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
            }`}
          >
            {isNetPositive ? 'Net Receivable' : 'Net Payable'}
          </Badge>
        </div>
        <div>
          <p
            className={`text-2xl sm:text-[32px] font-bold font-mono tracking-tight ${
              isNetPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : ''}
            {formatCurrency(netPosition)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground font-semibold">
            {isNetPositive
              ? 'Others owe you more than you owe'
              : 'You owe more than what is receivable'}
          </p>
        </div>
      </div>

      {/* Card 2: You Lent (Receivables) */}
      <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 shadow-none flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            You Lent (To Receive)
          </span>
          <span className="text-[11px] font-mono text-muted-foreground font-semibold">
            {borrowerCount} {borrowerCount === 1 ? 'party' : 'parties'}
          </span>
        </div>
        <div>
          <p className="text-2xl sm:text-[32px] font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(lentOutstanding)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground font-semibold">
            Original: {formatCurrency(lentPrincipal)}
          </p>
        </div>
      </div>

      {/* Card 3: You Borrowed (Payables) */}
      <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 shadow-none flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            You Borrowed (To Pay)
          </span>
          <span className="text-[11px] font-mono text-muted-foreground font-semibold">
            {lenderCount} {lenderCount === 1 ? 'lender' : 'lenders'}
          </span>
        </div>
        <div>
          <p className="text-2xl sm:text-[32px] font-bold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
            {formatCurrency(borrowedOutstanding)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground font-semibold">
            Original: {formatCurrency(borrowedPrincipal)}
          </p>
        </div>
      </div>

      {/* Card 4: Overdue & Action Items */}
      <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 shadow-none flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle
              className={`w-3.5 h-3.5 ${
                overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
              }`}
            />
            Overdue Deadlines
          </span>
          {overdueCount > 0 && (
            <Badge className="text-[10px] px-2.5 py-0.5 bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              Needs Action
            </Badge>
          )}
        </div>
        <div>
          <p
            className={`text-2xl sm:text-[32px] font-bold font-mono tracking-tight ${
              overdueCount > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-foreground'
            }`}
          >
            {overdueCount} {overdueCount === 1 ? 'Loan' : 'Loans'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground font-semibold">
            {overdueCount > 0
              ? `${formatCurrency(overdueAmount)} past settlement date`
              : 'All due dates are on track'}
          </p>
        </div>
      </div>
    </div>
  );
}

