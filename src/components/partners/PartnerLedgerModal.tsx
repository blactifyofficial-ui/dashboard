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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted border border-border text-foreground">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{partner.name} - Statement & History</h3>
              <p className="text-xs text-muted-foreground">
                Equity: <strong className="text-foreground">{partner.equityPercentage}%</strong> • Joined {formatDisplayDate(partner.joinedDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Metrics Bar in Modal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/30 border-b border-border text-center">
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Total Invested</span>
            <span className="text-sm sm:text-base font-bold text-foreground font-mono">
              {formatCurrency(partner.totalInvested)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">Payouts Taken</span>
            <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(partner.totalPayout || 0)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Withdrawn</span>
            <span className="text-sm sm:text-base font-bold text-foreground font-mono">
              {formatCurrency(partner.totalWithdrawn)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Net Balance</span>
            <span className="text-sm sm:text-base font-bold text-foreground font-mono">
              {formatCurrency(partner.netCapital)}
            </span>
          </div>
        </div>

        {/* Transaction List */}
        <div className="p-4 sm:p-5 max-h-96 overflow-y-auto space-y-2">
          {partnerTransactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No transactions recorded for this partner yet.
            </div>
          ) : (
            partnerTransactions.map((txn) => {
              const isPositive = txn.type === 'INVESTMENT';
              const isPayout = txn.type === 'PAYOUT';

              return (
                <div
                  key={txn.id}
                  className="p-3 sm:p-3.5 rounded-lg bg-card border border-border flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase border ${
                          isPayout
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-muted text-foreground border-border'
                        }`}
                      >
                        {txn.type}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{formatDisplayDate(txn.transactionDate)}</span>
                      {txn.paymentMethodName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CreditCard size={11} className="text-muted-foreground" />
                          {txn.paymentMethodName}
                        </span>
                      )}
                    </div>
                    {txn.notes && <p className="text-xs text-foreground mt-1">{txn.notes}</p>}
                    {txn.referenceNumber && (
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Hash size={10} /> {txn.referenceNumber}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold font-mono ${
                        isPayout ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
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

        <div className="p-4 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const pid = partner.id;
                onClose();
                onAddTransaction(pid, 'PAYOUT');
              }}
              className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
              className="px-3.5 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-opacity"
            >
              <Plus size={14} />
              <span>Record Transaction</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-muted hover:bg-muted/80 border border-border text-foreground rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
