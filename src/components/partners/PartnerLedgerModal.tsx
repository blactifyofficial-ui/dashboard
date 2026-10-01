'use client';

import { X, Plus, Users } from 'lucide-react';
import { Partner, PartnerTransaction } from './types';
import { formatCurrency, formatDisplayDate } from './utils';

interface PartnerLedgerModalProps {
  partner: Partner | null;
  transactions: PartnerTransaction[];
  onClose: () => void;
  onAddTransaction: (partnerId: string) => void;
}

export default function PartnerLedgerModal({
  partner,
  transactions,
  onClose,
  onAddTransaction,
}: PartnerLedgerModalProps) {
  if (!partner) return null;

  const partnerTransactions = transactions.filter((t) => t.partnerId === partner.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/80">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{partner.name} - Ledger</h3>
              <p className="text-xs text-white/60">
                Equity: {partner.equityPercentage}% | Joined {formatDisplayDate(partner.joinedDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Metrics Bar in Modal */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-black/40 border-b border-white/5 text-center">
          <div>
            <span className="text-xs text-white/50 block">Total Invested</span>
            <span className="text-base font-bold text-white">
              {formatCurrency(partner.totalInvested)}
            </span>
          </div>
          <div>
            <span className="text-xs text-white/50 block">Total Withdrawn</span>
            <span className="text-base font-bold text-white/70">
              {formatCurrency(partner.totalWithdrawn)}
            </span>
          </div>
          <div>
            <span className="text-xs text-white/50 block">Net Capital Balance</span>
            <span className="text-base font-bold text-white">
              {formatCurrency(partner.netCapital)}
            </span>
          </div>
        </div>

        {/* Transaction List */}
        <div className="p-5 max-h-96 overflow-y-auto space-y-3">
          {partnerTransactions.length === 0 ? (
            <div className="py-8 text-center text-white/50 text-sm">
              No transactions recorded for this partner yet.
            </div>
          ) : (
            partnerTransactions.map((txn) => (
              <div
                key={txn.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full uppercase ${
                        txn.type === 'INVESTMENT'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {txn.type}
                    </span>
                    <span className="text-xs text-white/50">{formatDisplayDate(txn.transactionDate)}</span>
                    {txn.paymentMethodName && (
                      <span className="text-xs text-white/40">• {txn.paymentMethodName}</span>
                    )}
                  </div>
                  {txn.notes && <p className="text-xs text-white/70 mt-1">{txn.notes}</p>}
                  {txn.referenceNumber && (
                    <p className="text-[11px] font-mono text-white/40 mt-0.5">Ref: {txn.referenceNumber}</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-bold ${
                      txn.type === 'INVESTMENT' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {txn.type === 'INVESTMENT' ? '+' : '-'} {formatCurrency(txn.amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <button
            onClick={() => {
              const pid = partner.id;
              onClose();
              onAddTransaction(pid);
            }}
            className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Add Transaction for this Partner</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
