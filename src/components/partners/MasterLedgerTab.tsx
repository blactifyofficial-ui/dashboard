'use client';

import { Plus, ArrowUpRight, ArrowDownLeft, Pencil, Trash2 } from 'lucide-react';
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
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40">
        <div>
          <h3 className="text-base font-semibold text-white">Master Transaction Ledger</h3>
          <p className="text-xs text-white/60 mt-0.5">
            Detailed record of all capital investments, drawings, profit distributions, and payouts.
          </p>
        </div>
        <button
          onClick={onOpenAddTxn}
          className="px-3.5 py-2 bg-white text-black hover:bg-white/90 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus size={14} />
          <span>Record Transaction</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-white/60 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Partner</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4">Reference / UTR</th>
              <th className="py-3 px-4">Notes</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-white/50 text-sm">
                  No transactions recorded yet matching the current filters.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => {
                const isPositive = txn.type === 'INVESTMENT';
                const isWithdrawal = txn.type === 'WITHDRAWAL' || txn.type === 'PAYOUT';

                const typeBadgeStyles = {
                  INVESTMENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  WITHDRAWAL: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  PROFIT_SHARE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  PAYOUT: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                }[txn.type] || 'bg-white/5 text-white/70 border-white/10';

                const typeLabels = {
                  INVESTMENT: 'Capital In',
                  WITHDRAWAL: 'Withdrawal',
                  PROFIT_SHARE: 'Profit Share',
                  PAYOUT: 'Payout',
                }[txn.type] || txn.type;

                return (
                  <tr key={txn.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-4 text-white/80 whitespace-nowrap text-xs font-mono">
                      {formatDisplayDate(txn.transactionDate)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                      {txn.partnerName || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${typeBadgeStyles}`}
                      >
                        {isPositive && <ArrowUpRight size={12} />}
                        {isWithdrawal && <ArrowDownLeft size={12} />}
                        {typeLabels}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                      <span className={isPositive ? 'text-emerald-400' : 'text-amber-400'}>
                        {isPositive ? '+' : '-'} {formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-white/70 whitespace-nowrap text-xs">
                      {txn.paymentMethodName || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-white/50 font-mono text-xs whitespace-nowrap">
                      {txn.referenceNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-white/60 text-xs max-w-xs truncate">
                      {txn.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditTxn(txn)}
                          className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                          title="Edit transaction"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteTxn(txn)}
                          className="p-1 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 size={14} />
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
