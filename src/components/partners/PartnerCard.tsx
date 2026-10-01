'use client';

import { Plus, ArrowDownLeft, Pencil, Trash2, Mail, Phone, History } from 'lucide-react';
import { Partner } from './types';
import { formatCurrency, formatDisplayDate } from './utils';

interface PartnerCardProps {
  partner: Partner;
  totalFund: number;
  onAddInvestment: (partnerId: string) => void;
  onAddWithdrawal: (partnerId: string) => void;
  onViewLedger: (partner: Partner) => void;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
}

export default function PartnerCard({
  partner,
  totalFund,
  onAddInvestment,
  onAddWithdrawal,
  onViewLedger,
  onEdit,
  onDelete,
}: PartnerCardProps) {
  const shareOfFund = totalFund > 0 ? ((partner.totalInvested / totalFund) * 100).toFixed(1) : '0.0';
  const isActive = partner.status === 'ACTIVE';

  return (
    <div className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 group relative">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white truncate">
                {partner.name}
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isActive
                    ? 'bg-white/10 text-white/80 border border-white/15'
                    : 'bg-white/5 text-white/40 border border-white/5'
                }`}
              >
                {partner.status}
              </span>
            </div>

            <div className="mt-1.5 space-y-0.5 text-xs text-neutral-400">
              {partner.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail size={12} className="text-white/40 shrink-0" />
                  <span className="truncate text-white/70">{partner.email}</span>
                </div>
              )}
              {partner.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="text-white/40 shrink-0" />
                  <span className="text-white/70">{partner.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Equity Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-right shrink-0">
            <div className="font-mono text-sm font-bold text-white">{partner.equityPercentage}%</div>
            <div className="text-[10px] text-white/50 font-medium">Equity</div>
          </div>
        </div>

        {/* Capital Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-lg bg-black/40 border border-white/5">
          <div>
            <span className="text-[11px] text-white/50 font-medium block">Total Invested</span>
            <span className="text-sm font-bold text-white font-mono">
              {formatCurrency(partner.totalInvested)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-white/50 font-medium block">Withdrawn</span>
            <span className="text-sm font-bold text-white/80 font-mono">
              {formatCurrency(partner.totalWithdrawn)}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-white/50">Net Capital Pool</span>
            <span className="text-sm font-bold text-white font-mono">
              {formatCurrency(partner.netCapital)}
            </span>
          </div>
        </div>

        {/* Capital Share & Joined Date */}
        <div className="mt-3 flex items-center justify-between text-xs text-white/50 px-0.5">
          <span>Pool Share: <span className="text-white font-medium font-mono">{shareOfFund}%</span></span>
          <span>Joined: <span className="text-white/70">{formatDisplayDate(partner.joinedDate)}</span></span>
        </div>

        {partner.notes && (
          <p className="mt-2.5 text-xs text-white/60 bg-white/[0.02] p-2 rounded-lg border border-white/5 line-clamp-2">
            {partner.notes}
          </p>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddInvestment(partner.id)}
            className="px-2.5 py-1 text-xs font-medium text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex items-center gap-1"
            title="Add Capital Investment"
          >
            <Plus size={13} className="text-white/60" />
            <span>Invest</span>
          </button>
          <button
            onClick={() => onAddWithdrawal(partner.id)}
            className="px-2.5 py-1 text-xs font-medium text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex items-center gap-1"
            title="Record Capital Withdrawal"
          >
            <ArrowDownLeft size={13} className="text-white/60" />
            <span>Withdraw</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewLedger(partner)}
            className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="View Partner History"
          >
            <History size={14} />
          </button>
          <button
            onClick={() => onEdit(partner)}
            className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Edit Partner Profile"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(partner)}
            className="p-1.5 text-white/50 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
            title="Delete Partner"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
