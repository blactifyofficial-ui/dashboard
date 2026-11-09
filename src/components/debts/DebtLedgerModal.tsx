'use client';

import { useState, useEffect, useCallback } from 'react';
import { Debt, DebtSettlement } from './types';
import { formatCurrency, formatDisplayDate } from './utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Loader2,
  History,
  CreditCard,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DebtLedgerModalProps {
  open: boolean;
  onClose: () => void;
  debt: Debt | null;
  canManage: boolean;
  onSettlementChanged: () => void;
}

export default function DebtLedgerModal(props: DebtLedgerModalProps) {
  if (!props.open || !props.debt) return null;
  return <DebtLedgerModalContent key={props.debt.id} {...props} debt={props.debt} />;
}

function DebtLedgerModalContent({
  onClose,
  debt,
  canManage,
  onSettlementChanged,
}: DebtLedgerModalProps & { debt: Debt }) {
  const [settlements, setSettlements] = useState<DebtSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch(`/api/debts/${debt.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch settlements');
      setSettlements(data.settlements || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading history';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [debt.id]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/debts/${debt.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch settlements');
        if (active) setSettlements(data.settlements || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error loading history';
        if (active) toast.error(msg);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [debt.id]);

  const originalPrincipal = Number(debt.amount) || 0;
  const remaining = Number(debt.remainingAmount) || 0;
  const totalSettled = Math.max(0, originalPrincipal - remaining);
  const isLent = debt.type === 'LENT';

  const handleRevertSettlement = async (settlementId: string) => {
    if (!confirm('Are you sure you want to revert this settlement payment? The outstanding balance will be restored.')) {
      return;
    }

    setRevertingId(settlementId);
    try {
      const res = await fetch(`/api/debts/${debt.id}/settlements/${settlementId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revert settlement');

      toast.success('Settlement reverted and balance restored');
      await fetchLedger();
      onSettlementChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revert';
      toast.error(msg);
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-popover border border-border rounded-[18px] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Settlement Ledger &amp; History
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete transaction log and installments for {debt.contactName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Summary Card */}
        <div className="p-5 pb-4 bg-muted/20 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-foreground">{debt.contactName}</span>
              {isLent ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] px-2.5 py-0.5">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> Lent
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] px-2.5 py-0.5">
                  <ArrowDownLeft className="w-3 h-3 mr-1" /> Borrowed
                </Badge>
              )}
            </div>

            <span className="text-[11px] font-mono text-muted-foreground">
              Started {formatDisplayDate(debt.transactionDate)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-card border border-border text-center">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                Principal
              </span>
              <span className="text-sm font-bold font-mono text-foreground">
                {formatCurrency(originalPrincipal)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                Total Repaid
              </span>
              <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalSettled)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                Remaining
              </span>
              <span className="text-sm font-bold font-mono text-foreground">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline of Settlements */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Settlement Installments ({settlements.length})
          </h3>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs">Loading ledger history...</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-border rounded-xl p-6">
              <Banknote className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-xs text-foreground font-medium">No settlements recorded yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Use the &quot;Settle&quot; action on the table to record a repayment installment.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {settlements.map((st) => (
                <div
                  key={st.id}
                  className="flex items-start justify-between p-3.5 rounded-xl bg-card border border-border hover:border-border/80 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(st.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        on {formatDisplayDate(st.settlementDate)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {st.paymentMethodName && (
                        <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded border border-border">
                          <CreditCard className="w-3 h-3" />
                          {st.paymentMethodName}
                        </span>
                      )}
                      {st.creatorName && (
                        <span>by {st.creatorName}</span>
                      )}
                    </div>

                    {st.notes && (
                      <p className="text-xs text-foreground pt-0.5 italic">
                        &quot;{st.notes}&quot;
                      </p>
                    )}
                  </div>

                  {canManage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={revertingId === st.id}
                      onClick={() => handleRevertSettlement(st.id)}
                      className="h-7 px-2.5 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs"
                      title="Revert payment and restore debt balance"
                    >
                      {revertingId === st.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Revert
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-border bg-muted/30">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-8 px-4 rounded-full border-border text-foreground hover:bg-muted"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

