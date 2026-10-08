'use client';

import { Plus, ArrowUpRight, ArrowDownLeft, Pencil, Trash2, FileText, CreditCard, Hash } from 'lucide-react';
import { PartnerTransaction } from './types';
import { formatCurrency, formatDisplayDate } from './utils';

interface MasterLedgerTabProps {
  transactions: PartnerTransaction[];
  onOpenAddTxn: () => void;
  onEditTxn: (txn: PartnerTransaction) => void;
  onDeleteTxn: (txn: PartnerTransaction) => void;
}

export default function MasterLedgerTab({
  transactions,
  onOpenAddTxn,
  onEditTxn,
  onDeleteTxn,
}: MasterLedgerTabProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">
            Master Capital Ledger
          </h3>
          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground border border-border">
            {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <button
          onClick={onOpenAddTxn}
          className="px-3.5 py-2 min-h-[38px] bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-opacity self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Record Transaction</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Partner</th>
              <th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4">Amount</th>
              <th className="py-2.5 px-4">Payment Method</th>
              <th className="py-2.5 px-4">Reference / UTR</th>
              <th className="py-2.5 px-4">Notes</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-muted-foreground space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground mb-2">
                    <FileText size={18} />
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    No transactions recorded matching the filters
                  </div>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Record capital injections, withdrawals, profit shares, or dividends to see them in this ledger.
                  </p>
                </td>
              </tr>
            ) : (
              transactions.map((txn) => {
                const isPositive = txn.type === 'INVESTMENT';
                const isPayout = txn.type === 'PAYOUT';
                const isWithdrawal = txn.type === 'WITHDRAWAL';

                const typeBadgeStyles = isPayout
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-muted text-foreground border-border';

                const typeLabels = {
                  INVESTMENT: 'Capital In',
                  WITHDRAWAL: 'Withdrawal',
                  PROFIT_SHARE: 'Profit Share',
                  PAYOUT: 'Partner Payout',
                }[txn.type] || txn.type;

                return (
                  <tr key={txn.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs font-mono">
                      {formatDisplayDate(txn.transactionDate)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground whitespace-nowrap">
                      {txn.partnerName || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadgeStyles}`}
                      >
                        {isPositive && <ArrowUpRight size={11} />}
                        {isWithdrawal && <ArrowDownLeft size={11} />}
                        {isPayout && <ArrowDownLeft size={11} className="text-emerald-600 dark:text-emerald-400" />}
                        {typeLabels}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-bold font-mono whitespace-nowrap ${isPayout ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                      {isPositive ? '+' : '-'} {formatCurrency(txn.amount)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                      {txn.paymentMethodName ? (
                        <span className="inline-flex items-center gap-1">
                          <CreditCard size={11} className="text-muted-foreground" />
                          {txn.paymentMethodName}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs whitespace-nowrap">
                      {txn.referenceNumber ? (
                        <span className="inline-flex items-center gap-1">
                          <Hash size={11} className="text-muted-foreground" />
                          {txn.referenceNumber}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs truncate">
                      {txn.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditTxn(txn)}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                          title="Edit transaction"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteTxn(txn)}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
