'use client';

import { useMemo } from 'react';
import { Debt, DebtContact } from './types';
import { formatCurrency } from './utils';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Sliders,
  Phone,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface PersonDebtCardProps {
  contact: DebtContact;
  debts: Debt[];
  canManage: boolean;
  onAdjustAmount: (contact: DebtContact) => void;
  onLendMoney: (contact: DebtContact) => void;
  onBorrowMoney: (contact: DebtContact) => void;
}

export default function PersonDebtCard({
  contact,
  debts,
  canManage,
  onAdjustAmount,
  onLendMoney,
  onBorrowMoney,
}: PersonDebtCardProps) {
  // Find open debts for this contact
  const contactDebts = useMemo(() => {
    const nameLower = contact.name.trim().toLowerCase();
    return debts.filter((d) => {
      const match =
        (d.contactId && d.contactId === contact.id) ||
        (d.contactName && d.contactName.trim().toLowerCase() === nameLower);
      return match;
    });
  }, [debts, contact]);

  const activeDebts = useMemo(() => {
    return contactDebts.filter(
      (d) => d.status !== 'SETTLED' && d.status !== 'CANCELLED' && Number(d.remainingAmount) > 0.001
    );
  }, [contactDebts]);

  const activeLent = useMemo(() => {
    return activeDebts
      .filter((d) => d.type === 'LENT')
      .reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);
  }, [activeDebts]);

  const activeBorrowed = useMemo(() => {
    return activeDebts
      .filter((d) => d.type === 'BORROWED')
      .reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);
  }, [activeDebts]);

  const netBalance = activeLent - activeBorrowed;
  const hasActiveBalance = activeLent > 0.001 || activeBorrowed > 0.001;

  // Category badge formatting
  const categoryLabel = contact.category || 'GENERAL';

  return (
    <div className="bg-card border border-border rounded-[18px] p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-border/80 shadow-none">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-foreground truncate tracking-[-0.01em]">
                {contact.name}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-muted/60 text-muted-foreground border border-border">
                {categoryLabel}
              </span>
            </div>

            {/* Sub-info: Phone or Notes */}
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {contact.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-foreground font-mono text-[11px]">{contact.phone}</span>
                </div>
              )}
              {contact.notes && (
                <div className="flex items-center gap-1.5 truncate">
                  <FileText size={12} className="text-muted-foreground shrink-0" />
                  <span className="truncate italic text-[11px] text-muted-foreground">{contact.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active status pill */}
          <div className="shrink-0 text-right">
            {hasActiveBalance ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                {activeDebts.length} {activeDebts.length === 1 ? 'active loan' : 'active loans'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Settled
              </span>
            )}
          </div>
        </div>

        {/* Balance Metrics Card */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-3.5 rounded-[14px] bg-muted/20 border border-border">
          <div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              Owes You (Lent)
            </span>
            <span className="text-xs sm:text-sm font-bold text-foreground font-mono mt-0.5 block">
              {formatCurrency(activeLent)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3" />
              You Owe (Borrowed)
            </span>
            <span className="text-xs sm:text-sm font-bold text-foreground font-mono mt-0.5 block">
              {formatCurrency(activeBorrowed)}
            </span>
          </div>

          {/* Net Position Row */}
          <div className="col-span-2 pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Net Position:</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-mono font-bold text-xs sm:text-sm ${netBalance > 0.001
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : netBalance < -0.001
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                  }`}
              >
                {netBalance > 0 ? `+${formatCurrency(netBalance)}` : formatCurrency(netBalance)}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${netBalance > 0.001
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : netBalance < -0.001
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
              >
                {netBalance > 0.001 ? 'THEY OWE' : netBalance < -0.001 ? 'YOU OWE' : 'CLEAR'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between gap-2">
        {canManage && (
          <Button
            size="sm"
            onClick={() => onAdjustAmount(contact)}
            disabled={!hasActiveBalance}
            className={`flex-1 h-8 px-3 text-xs font-semibold rounded-full shadow-xs transition-all ${hasActiveBalance
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
              }`}
            title={hasActiveBalance ? `Adjust or settle balance for ${contact.name}` : 'No active balance to adjust'}
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            Adjust Amount
          </Button>
        )}

        {/* Quick + Lend and + Borrow buttons */}
        {canManage && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onLendMoney(contact)}
              className="h-8 px-2.5 text-[11px] font-semibold rounded-full border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
              title={`Lend money to ${contact.name}`}
            >
              <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
              Lend
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onBorrowMoney(contact)}
              className="h-8 px-2.5 text-[11px] font-semibold rounded-full border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
              title={`Borrow money from ${contact.name}`}
            >
              <ArrowDownLeft className="w-3 h-3 mr-1 text-amber-600 dark:text-amber-400" />
              Borrow
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
