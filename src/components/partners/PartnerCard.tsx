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
    <div className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-colors">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {partner.name}
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isActive
                    ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                    : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                }`}
              >
                {partner.status}
              </span>
            </div>

            <div className="mt-1.5 space-y-0.5 text-xs text-neutral-400">
              {partner.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail size={12} className="text-neutral-500 shrink-0" />
                  <span className="truncate text-neutral-300">{partner.email}</span>
                </div>
              )}
              {partner.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="text-neutral-500 shrink-0" />
                  <span className="text-neutral-300">{partner.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Equity Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-right shrink-0">
            <div className="font-mono text-sm font-bold text-white">{partner.equityPercentage}%</div>
            <div className="text-[10px] text-neutral-400 font-medium">Equity</div>
          </div>
        </div>

        {/* Capital & Payout Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-lg bg-neutral-950 border border-neutral-800/80">
          <div>
            <span className="text-[11px] text-neutral-400 font-medium block">Total Invested</span>
            <span className="text-xs sm:text-sm font-bold text-white font-mono">
              {formatCurrency(partner.totalInvested)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-emerald-400 font-medium block">Payouts Taken</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
              {formatCurrency(partner.totalPayout || 0)}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Net Capital Pool:</span>
            <span className="text-xs sm:text-sm font-bold text-white font-mono">
              {formatCurrency(partner.netCapital)}
            </span>
          </div>
        </div>

        {/* Capital Share & Joined Date */}
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 px-0.5">
          <span>Pool Share: <span className="text-neutral-200 font-medium font-mono">{shareOfFund}%</span></span>
          <span>Joined: <span className="text-neutral-300">{formatDisplayDate(partner.joinedDate)}</span></span>
        </div>

        {partner.notes && (
          <p className="mt-2.5 text-xs text-neutral-400 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80 line-clamp-2">
            {partner.notes}
          </p>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-4 pt-3.5 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onAddPayout(partner.id)}
            className="px-2.5 py-1 min-h-[32px] text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1"
            title="Record Partner Payout"
          >
            <Banknote size={13} className="text-emerald-400" />
            <span>Payout</span>
          </button>
          <button
            onClick={() => onAddInvestment(partner.id)}
            className="px-2.5 py-1 min-h-[32px] text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors flex items-center gap-1"
            title="Add Capital Investment"
          >
            <Plus size={13} className="text-neutral-400" />
            <span>Invest</span>
          </button>
          <button
            onClick={() => onAddWithdrawal(partner.id)}
            className="px-2.5 py-1 min-h-[32px] text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors flex items-center gap-1"
            title="Record Capital Withdrawal"
          >
            <ArrowDownLeft size={13} className="text-neutral-400" />
            <span>Withdraw</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewLedger(partner)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="View Partner History"
          >
            <History size={14} />
          </button>
          <button
            onClick={() => onEdit(partner)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Edit Partner Profile"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(partner)}
            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
            title="Delete Partner"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
