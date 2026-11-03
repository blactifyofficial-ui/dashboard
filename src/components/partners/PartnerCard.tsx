'use client';

import { Plus, ArrowDownLeft, Banknote, Pencil, Trash2, Mail, Phone, History } from 'lucide-react';
import { Partner } from './types';
import { formatCurrency, formatDisplayDate } from './utils';

interface PartnerCardProps {
  partner: Partner;
  totalFund: number;
  onAddInvestment: (partnerId: string) => void;
  onAddWithdrawal: (partnerId: string) => void;
  onAddPayout: (partnerId: string) => void;
  onViewLedger: (partner: Partner) => void;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
}

export default function PartnerCard({
  partner,
  totalFund,
  onAddInvestment,
  onAddWithdrawal,
  onAddPayout,
  onViewLedger,
  onEdit,
  onDelete,
}: PartnerCardProps) {
  const shareOfFund = totalFund > 0 ? ((partner.totalInvested / totalFund) * 100).toFixed(1) : '0.0';
  const isActive = partner.status === 'ACTIVE';

  return (
    <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 flex flex-col justify-between transition-colors shadow-none">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-foreground truncate tracking-[-0.01em]">
                {partner.name}
              </h3>
              <span
              className={`text-[11px] font-normal px-2.5 py-0.5 rounded-full capitalize tracking-tight ${isActive
                  ? 'bg-muted/60 text-foreground border border-border'
                  : 'bg-muted/40 text-muted-foreground border border-border/40'
                }`}
                  >
              {partner.status}
            </span>
          </div>

          <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
            {partner.email && (
              <div className="flex items-center gap-1.5 truncate">
                <Mail size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate text-foreground font-semibold">{partner.email}</span>
              </div>
            )}
            {partner.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={12} className="text-muted-foreground shrink-0" />
                <span className="text-foreground font-semibold">{partner.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Equity Badge */}
        <div className="px-3 py-1.5 rounded-full bg-muted/60 border border-border text-right shrink-0">
          <div className="font-mono text-sm font-bold text-foreground">{partner.equityPercentage}%</div>
          <div className="text-[10px] text-muted-foreground font-semibold">Equity</div>
        </div>
      </div>

      {/* Capital & Payout Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mt-4 p-3.5 rounded-[14px] bg-muted/20 border border-border">
        <div>
          <span className="text-[11px] text-muted-foreground font-semibold block">Total Invested</span>
          <span className="text-xs sm:text-sm font-bold text-foreground font-mono">
            {formatCurrency(partner.totalInvested)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">Payouts Taken</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(partner.totalPayout || 0)}
          </span>
        </div>
        <div className="col-span-2 pt-2 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-semibold">Net Capital Pool:</span>
          <span className="text-xs sm:text-sm font-bold text-foreground font-mono">
            {formatCurrency(partner.netCapital)}
          </span>
        </div>
      </div>

      {/* Capital Share & Joined Date */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <span>Pool Share: <span className="text-foreground font-semibold font-mono">{shareOfFund}%</span></span>
        <span>Joined: <span className="text-foreground font-semibold">{formatDisplayDate(partner.joinedDate)}</span></span>
      </div>

      {partner.notes && (
        <p className="mt-2.5 text-xs text-muted-foreground bg-muted/20 p-3 rounded-[11px] border border-border line-clamp-2">
          {partner.notes}
        </p>
      )}
    </div>

      {/* Quick Action Buttons */ }
  <div className="mt-4 pt-3.5 border-t border-border flex flex-wrap items-center justify-between gap-2">
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onAddPayout(partner.id)}
        className="px-3 py-1 min-h-[32px] text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-full transition-all active:scale-95 flex items-center gap-1"
        title="Record Partner Payout"
      >
        <Banknote size={13} className="text-emerald-600 dark:text-emerald-400" />
        <span>Payout</span>
      </button>
      <button
        onClick={() => onAddInvestment(partner.id)}
        className="px-3 py-1 min-h-[32px] text-xs font-semibold text-foreground bg-muted/60 hover:bg-muted border border-border rounded-full transition-all active:scale-95 flex items-center gap-1"
        title="Add Capital Investment"
      >
        <Plus size={13} className="text-muted-foreground" />
        <span>Invest</span>
      </button>
      <button
        onClick={() => onAddWithdrawal(partner.id)}
        className="px-3 py-1 min-h-[32px] text-xs font-semibold text-foreground bg-muted/60 hover:bg-muted border border-border rounded-full transition-all active:scale-95 flex items-center gap-1"
        title="Record Capital Withdrawal"
      >
        <ArrowDownLeft size={13} className="text-muted-foreground" />
        <span>Withdraw</span>
      </button>
    </div>

    <div className="flex items-center gap-1">
      <button
        onClick={() => onViewLedger(partner)}
        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-all active:scale-95"
        title="View Partner History"
      >
        <History size={14} />
      </button>
      <button
        onClick={() => onEdit(partner)}
        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-all active:scale-95"
        title="Edit Partner Profile"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={() => onDelete(partner)}
        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-rose-500 rounded-full hover:bg-rose-500/10 transition-all active:scale-95"
        title="Delete Partner"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
    </div >
  );
}
