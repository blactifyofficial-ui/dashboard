'use client';

import { X, Plus, Users, CreditCard, Hash } from 'lucide-react';
import { Partner, PartnerTransaction } from './types';
import { formatCurrency, formatDisplayDate } from './utils';

interface PartnerLedgerModalProps {
  partner: Partner | null;
  transactions: PartnerTransaction[];
  onClose: () => void;
  onAddTransaction: (partnerId: string, defaultType?: 'INVESTMENT' | 'WITHDRAWAL' | 'PAYOUT') => void;
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{partner.name} - Statement & History</h3>
              <p className="text-xs text-neutral-400">
                Equity: <strong className="text-white">{partner.equityPercentage}%</strong> • Joined {formatDisplayDate(partner.joinedDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Metrics Bar in Modal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-neutral-950 border-b border-neutral-800 text-center">
          <div>
            <span className="text-[11px] text-neutral-400 font-medium block">Total Invested</span>
            <span className="text-sm sm:text-base font-bold text-white font-mono">
              {formatCurrency(partner.totalInvested)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-emerald-400 font-medium block">Payouts Taken</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
              {formatCurrency(partner.totalPayout || 0)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 font-medium block">Withdrawn</span>
            <span className="text-sm sm:text-base font-bold text-neutral-200 font-mono">
              {formatCurrency(partner.totalWithdrawn)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 font-medium block">Net Balance</span>
            <span className="text-sm sm:text-base font-bold text-white font-mono">
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
              const isPayout = txn.type === 'PAYOUT';

              return (
                <div
                  key={txn.id}
                  className="p-3 sm:p-3.5 rounded-lg bg-neutral-950/60 border border-neutral-800 flex items-center justify-between gap-3 hover:bg-neutral-950 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase border ${
                          isPayout
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}
                      >
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
                    <span
                      className={`text-sm font-bold font-mono ${
                        isPayout ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {isPositive ? '+' : '-'} {formatCurrency(txn.amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const pid = partner.id;
                onClose();
                onAddTransaction(pid, 'PAYOUT');
              }}
              className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} />
              <span>Record Payout</span>
            </button>
            <button
              onClick={() => {
                const pid = partner.id;
                onClose();
                onAddTransaction(pid, 'INVESTMENT');
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} />
              <span>Record Transaction</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
