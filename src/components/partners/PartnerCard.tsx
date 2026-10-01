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

  return (
    <div className="bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between transition-all group">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white group-hover:text-white/90 transition-colors">
                {partner.name}
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  partner.status === 'ACTIVE'
                    ? 'bg-white/10 text-white border border-white/15'
                    : 'bg-white/5 text-white/40 border border-white/5'
                }`}
              >
                {partner.status}
              </span>
            </div>

            <div className="mt-1.5 space-y-0.5 text-xs text-white/50">
              {partner.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail size={12} className="text-white/40 shrink-0" />
                  <span className="truncate">{partner.email}</span>
                </div>
              )}
              {partner.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="text-white/40 shrink-0" />
                  <span>{partner.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Equity Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold text-right shrink-0">
            <div>{partner.equityPercentage}%</div>
            <div className="text-[10px] text-white/50 font-normal">Equity</div>
          </div>
        </div>

        {/* Capital Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-xl bg-black/40 border border-white/5">
          <div>
            <span className="text-[11px] text-white/50 block">Total Invested</span>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(partner.totalInvested)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-white/50 block">Withdrawn</span>
            <span className="text-sm font-semibold text-white/70">
              {formatCurrency(partner.totalWithdrawn)}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-white/50">Net Capital Balance</span>
            <span className="text-sm font-bold text-white">
              {formatCurrency(partner.netCapital)}
            </span>
          </div>
        </div>

        {/* Capital Share & Joined Date */}
        <div className="mt-3 flex items-center justify-between text-xs text-white/50 px-0.5">
          <span>Fund Share: <span className="text-white font-medium">{shareOfFund}%</span></span>
          <span>Joined: <span className="text-white/80">{formatDisplayDate(partner.joinedDate)}</span></span>
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
            className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            title="Add Investment"
          >
            <Plus size={13} />
            <span>Invest</span>
          </button>
          <button
            onClick={() => onAddWithdrawal(partner.id)}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            title="Record Withdrawal"
          >
            <ArrowDownLeft size={13} />
            <span>Withdraw</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewLedger(partner)}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="View Partner History"
          >
            <History size={15} />
          </button>
          <button
            onClick={() => onEdit(partner)}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Edit Partner Profile"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(partner)}
            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete Partner"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
