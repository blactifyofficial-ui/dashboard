'use client';

import { X, Plus, Users, CreditCard, Hash } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{partner.name} - Statement & History</h3>
              <p className="text-xs text-neutral-400">
                Equity: <strong className="text-white">{partner.equityPercentage}%</strong> • Joined {formatDisplayDate(partner.joinedDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Metrics Bar in Modal */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-black/40 border-b border-white/5 text-center">
          <div>
            <span className="text-[11px] text-white/50 font-medium block">Total Invested</span>
            <span className="text-base font-bold text-white font-mono">
              {formatCurrency(partner.totalInvested)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-white/50 font-medium block">Total Withdrawn</span>
            <span className="text-base font-bold text-white/80 font-mono">
              {formatCurrency(partner.totalWithdrawn)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-white/50 font-medium block">Net Capital Balance</span>
            <span className="text-base font-bold text-white font-mono">
              {formatCurrency(partner.netCapital)}
            </span>
          </div>
        </div>

        {/* Transaction List */}
        <div className="p-4 sm:p-5 max-h-96 overflow-y-auto space-y-2">
          {partnerTransactions.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              No transactions recorded for this partner yet.
            </div>
          ) : (
            partnerTransactions.map((txn) => {
              const isPositive = txn.type === 'INVESTMENT';
              return (
                <div
                  key={txn.id}
                  className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-white/10 text-white/80 border border-white/15">
                        {txn.type}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">{formatDisplayDate(txn.transactionDate)}</span>
                      {txn.paymentMethodName && (
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                          <CreditCard size={11} className="text-neutral-500" />
                          {txn.paymentMethodName}
                        </span>
                      )}
                    </div>
                    {txn.notes && <p className="text-xs text-neutral-300 mt-1">{txn.notes}</p>}
                    {txn.referenceNumber && (
                      <p className="text-[11px] font-mono text-neutral-500 mt-0.5 flex items-center gap-1">
                        <Hash size={10} /> {txn.referenceNumber}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold font-mono text-white">
                      {isPositive ? '+' : '-'} {formatCurrency(txn.amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <button
            onClick={() => {
              const pid = partner.id;
              onClose();
              onAddTransaction(pid);
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>Record Transaction for Partner</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 rounded-xl text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
