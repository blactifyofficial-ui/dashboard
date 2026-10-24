'use client';

import { Plus, ArrowUpRight, ArrowDownLeft, Pencil, Trash2, FileText, CreditCard, Hash } from 'lucide-react';
import { PartnerTransaction } from './types';
import { formatCurrency, formatDisplayDate } from './utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
        <Button
          size="sm"
          onClick={onOpenAddTxn}
          className="self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Record Transaction</span>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead className="font-medium">Date</TableHead>
              <TableHead className="font-medium">Partner</TableHead>
              <TableHead className="font-medium">Type</TableHead>
              <TableHead className="font-medium">Amount</TableHead>
              <TableHead className="font-medium">Payment Method</TableHead>
              <TableHead className="font-medium">Reference / UTR</TableHead>
              <TableHead className="font-medium">Notes</TableHead>
              <TableHead className="font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground mb-2">
                    <FileText size={18} />
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    No transactions recorded matching the filters
                  </div>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    Record capital injections, withdrawals, profit shares, or dividends to see them in this ledger.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((txn) => {
                const isPositive = txn.type === 'INVESTMENT';
                const isPayout = txn.type === 'PAYOUT';
                const isWithdrawal = txn.type === 'WITHDRAWAL';

                const typeLabels = {
                  INVESTMENT: 'Capital In',
                  WITHDRAWAL: 'Withdrawal',
                  PROFIT_SHARE: 'Profit Share',
                  PAYOUT: 'Partner Payout',
                }[txn.type] || txn.type;

                return (
                  <TableRow key={txn.id} className="hover:bg-muted/40 transition-colors group">
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs font-mono">
                      {formatDisplayDate(txn.transactionDate)}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground whitespace-nowrap">
                      {txn.partnerName || '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant={isPayout ? 'success' : isPositive ? 'outline' : 'secondary'}
                        size="sm"
                        className="gap-1"
                      >
                        {isPositive && <ArrowUpRight size={11} />}
                        {isWithdrawal && <ArrowDownLeft size={11} />}
                        {isPayout && <ArrowDownLeft size={11} />}
                        {typeLabels}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-bold font-mono whitespace-nowrap ${isPayout ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                      {isPositive ? '+' : '-'} {formatCurrency(txn.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                      {txn.paymentMethodName ? (
                        <span className="inline-flex items-center gap-1">
                          <CreditCard size={11} className="text-muted-foreground" />
                          {txn.paymentMethodName}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                      {txn.referenceNumber ? (
                        <span className="inline-flex items-center gap-1">
                          <Hash size={11} className="text-muted-foreground" />
                          {txn.referenceNumber}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                      {txn.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditTxn(txn)}
                          className="h-7 w-7"
                          title="Edit transaction"
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteTxn(txn)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                          title="Delete transaction"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
