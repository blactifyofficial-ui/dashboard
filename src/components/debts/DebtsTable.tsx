'use client';

import { Debt } from './types';
import { formatCurrency, formatDisplayDate, getDaysRemainingBadge } from './utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  History,
  Pencil,
  Trash2,
  Banknote,
  AlertCircle,
} from 'lucide-react';

interface DebtsTableProps {
  debts: Debt[];
  canManage: boolean;
  canDelete: boolean;
  onRecordSettlement: (debt: Debt) => void;
  onViewLedger: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
}

export default function DebtsTable({
  debts,
  canManage,
  canDelete,
  onRecordSettlement,
  onViewLedger,
  onEdit,
  onDelete,
}: DebtsTableProps) {
  if (debts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-[18px] p-12 text-center shadow-none">
        <div className="w-12 h-12 rounded-full bg-muted/60 border border-border flex items-center justify-center mx-auto mb-3 text-muted-foreground">
          <Banknote className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No debt or loan records found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
          There are no borrowed or lent amounts matching your filters. Click &quot;Lend Money&quot; or &quot;Borrow Money&quot; above to create a record.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[18px] overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Contact / Party
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Type
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                Original Principal
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                Outstanding Balance
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Dates &amp; Deadlines
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Category
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {debts.map((debt) => {
              const original = Number(debt.amount) || 0;
              const remaining = Number(debt.remainingAmount) || 0;
              const repaid = Math.max(0, original - remaining);
              const progressPct = original > 0 ? Math.min(100, Math.round((repaid / original) * 100)) : 0;
              const isLent = debt.type === 'LENT';
              const isSettled = debt.status === 'SETTLED' || remaining <= 0.001;
              const dueBadge = !isSettled ? getDaysRemainingBadge(debt.dueDate) : null;

              return (
                <TableRow key={debt.id} className="border-border hover:bg-muted/40 transition-colors">
                  {/* Contact Info */}
                  <TableCell className="py-3.5 font-medium">
                    <div>
                      <span className="text-sm font-semibold text-foreground">{debt.contactName}</span>
                      {debt.notes && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-[240px] mt-0.5" title={debt.notes}>
                          {debt.notes}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Type Badge */}
                  <TableCell className="py-3.5">
                    {isLent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Lent (Get)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        Borrowed (Owe)
                      </span>
                    )}
                  </TableCell>

                  {/* Original Principal */}
                  <TableCell className="py-3.5 text-right font-mono font-medium text-xs text-muted-foreground">
                    {formatCurrency(original)}
                  </TableCell>

                  {/* Outstanding Balance */}
                  <TableCell className="py-3.5 text-right">
                    <div>
                      <span
                        className={`font-mono font-bold text-sm ${
                          isSettled
                            ? 'text-muted-foreground line-through'
                            : isLent
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {formatCurrency(remaining)}
                      </span>
                      {original > 0 && (
                        <div className="mt-1 w-24 ml-auto">
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                            <div
                              className={`h-full transition-all ${
                                isSettled
                                  ? 'bg-muted-foreground'
                                  : isLent
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-muted-foreground block text-right mt-0.5">
                            {progressPct}% settled
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Dates */}
                  <TableCell className="py-3.5 text-xs">
                    <div className="space-y-1">
                      <div className="text-foreground">
                        <span className="text-muted-foreground text-[10px] mr-1">Date:</span>
                        {formatDisplayDate(debt.transactionDate)}
                      </div>
                      {debt.dueDate ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground text-[10px]">Due:</span>
                          <span className="text-foreground font-mono text-[11px]">
                            {formatDisplayDate(debt.dueDate)}
                          </span>
                          {dueBadge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${dueBadge.className}`}
                            >
                              {dueBadge.text}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No deadline</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="py-3.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
                      {debt.category}
                    </span>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-3.5">
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border">
                        <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                        Settled
                      </span>
                    ) : debt.computedStatus === 'OVERDUE' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        <AlertCircle className="w-3 h-3" />
                        Overdue
                      </span>
                    ) : debt.status === 'PARTIALLY_SETTLED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                        <Clock className="w-3 h-3" />
                        Partial ({progressPct}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-muted/60 text-foreground border border-border">
                        Active
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isSettled && canManage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRecordSettlement(debt)}
                          className="h-7 text-xs px-2.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          title="Record settlement or installment"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Settle
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewLedger(debt)}
                        className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="View settlement history and timeline"
                      >
                        <History className="w-3.5 h-3.5" />
                      </Button>

                      {canManage && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(debt)}
                          className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Edit details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(debt)}
                          className="h-7 w-7 p-0 rounded-full text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/10"
                          title="Delete debt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

