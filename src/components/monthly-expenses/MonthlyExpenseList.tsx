'use client';

import { useState } from 'react';
import { 
  MonthlyExpenseEntry 
} from './types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Pencil, 
  Trash2, 
  Plus, 
  Search, 
  FileText, 
  Check, 
  SlidersHorizontal 
} from 'lucide-react';

interface MonthlyExpenseListProps {
  entries: MonthlyExpenseEntry[];
  monthLabel: string;
  onMarkPaidClick: (entry: MonthlyExpenseEntry) => void;
  onToggleUnpaid: (entry: MonthlyExpenseEntry) => Promise<void>;
  onEditClick: (entry: MonthlyExpenseEntry) => void;
  onAddClick: () => void;
  onOpenTemplates: () => void;
  onDeleteEntry: (id: string) => Promise<void>;
}

function formatCurrency(val: string | number): string {
  const num = typeof val === 'string' ? parseFloat(val) || 0 : val;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

function getDueDayBadge(dueDayStr: string | null | undefined, monthStr: string, isPaid: boolean) {
  if (!dueDayStr || isPaid) return null;
  const dueDay = parseInt(dueDayStr, 10);
  if (isNaN(dueDay)) return null;

  const now = new Date();
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthNumStr, 10);

  const dueDate = new Date(year, monthNum - 1, dueDay);
  
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueZero = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = dueZero.getTime() - todayZero.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <AlertTriangle size={11} />
        Overdue {Math.abs(diffDays)}d
      </span>
    );
  } else if (diffDays === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
        <Clock size={11} />
        Due Today
      </span>
    );
  } else if (diffDays <= 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border">
        <Clock size={11} />
        Due in {diffDays}d
      </span>
    );
  } else {
    return (
      <span className="text-xs text-muted-foreground">
        Due {dueDay}th
      </span>
    );
  }
}

export default function MonthlyExpenseList({
  entries,
  monthLabel,
  onMarkPaidClick,
  onToggleUnpaid,
  onEditClick,
  onAddClick,
  onOpenTemplates,
  onDeleteEntry,
}: MonthlyExpenseListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase())) ||
      (e.category && e.category.toLowerCase().includes(search.toLowerCase())) ||
      (e.referenceNumber && e.referenceNumber.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === 'PENDING') return e.status === 'PENDING';
    if (filter === 'PAID') return e.status === 'PAID';
    return true;
  });

  const pendingCount = entries.filter((e) => e.status === 'PENDING').length;
  const paidCount = entries.filter((e) => e.status === 'PAID').length;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-xs">
      {/* Search & Filter Toolbar */}
      <div className="flex-none p-3 sm:p-4 border-b border-border flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-muted/20">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-9 pr-3.5 py-1.5 min-h-[38px] bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-muted/50 border border-border p-0.5 rounded-lg overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter('ALL')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'ALL'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'PENDING'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'PAID'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Paid ({paidCount})
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onOpenTemplates}
            className="flex-1 sm:flex-none px-3 py-1.5 min-h-[36px] text-xs font-medium text-foreground bg-card hover:bg-muted border border-border rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <SlidersHorizontal size={14} />
            <span>Templates</span>
          </button>

          <button
            onClick={onAddClick}
            className="flex-1 sm:flex-none px-3.5 py-1.5 min-h-[36px] text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto min-h-0">
        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2 px-4">
            <div className="w-10 h-10 mx-auto rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
              <FileText size={18} />
            </div>
            <p className="text-sm font-medium text-foreground">
              {entries.length === 0 ? 'No recurring bills found for this month.' : 'No bills match your search filter.'}
            </p>
            {entries.length === 0 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={onAddClick}
                  className="px-3.5 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Bill
                </button>
                <button
                  onClick={onOpenTemplates}
                  className="px-3.5 py-1.5 text-xs font-medium text-foreground bg-card hover:bg-muted border border-border rounded-lg transition-colors"
                >
                  Configure Templates
                </button>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="sticky top-0 bg-muted/40 text-xs text-muted-foreground uppercase tracking-wider border-b border-border z-10">
              <tr>
                <th className="w-12 px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 font-medium">Expense</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Payment Info</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredEntries.map((entry) => {
                const isPaid = entry.status === 'PAID';
                const expected = parseFloat(entry.expectedAmount || '0') || 0;
                const actual = parseFloat(entry.actualAmount || '0') || 0;
                const dueBadge = getDueDayBadge(entry.dueDay, entry.month, isPaid);

                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-muted/30 transition-colors group ${
                      isPaid ? 'opacity-75 hover:opacity-100' : ''
                    }`}
                  >
                    {/* Status Checkbox */}
                    <td className="px-4 py-3 text-center align-middle">
                      <button
                        onClick={() => {
                          if (isPaid) {
                            onToggleUnpaid(entry);
                          } else {
                            onMarkPaidClick(entry);
                          }
                        }}
                        className={`w-7 h-7 flex items-center justify-center mx-auto rounded-md border transition-colors ${
                          isPaid
                            ? 'bg-primary text-primary-foreground border-primary hover:opacity-90'
                            : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground'
                        }`}
                        title={isPaid ? 'Click to mark as pending' : 'Click to mark as paid'}
                      >
                        {isPaid ? <Check size={13} className="stroke-[3]" /> : <Circle size={13} />}
                      </button>
                    </td>

                    {/* Expense Name & Notes */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col">
                        <span className={`font-medium ${isPaid ? 'text-muted-foreground line-through decoration-border' : 'text-foreground'}`}>
                          {entry.name}
                        </span>
                        {entry.notes && (
                          <span className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-sm" title={entry.notes}>
                            {entry.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 align-middle">
                      <span className="bg-muted border border-border/70 px-2 py-0.5 rounded text-xs text-foreground">
                        {entry.category || 'General'}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3 align-middle">
                      {isPaid ? (
                        <span className="text-xs text-muted-foreground font-mono">
                          Settled
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {dueBadge || (
                            <span className="text-xs text-muted-foreground">
                              {entry.dueDay ? `${entry.dueDay}th of month` : '—'}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Payment Info */}
                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                      {isPaid ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-foreground font-medium flex-wrap">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span>Paid on {entry.paidDate ? new Date(entry.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Done'}</span>
                          </div>
                          {(entry.paymentMethodName || entry.referenceNumber) && (
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {[entry.paymentMethodName, entry.referenceNumber].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right align-middle font-mono font-medium">
                      <div className={isPaid ? 'text-muted-foreground' : 'text-foreground'}>
                        {formatCurrency(isPaid && actual > 0 ? actual : expected)}
                      </div>
                      {isPaid && actual > 0 && expected > 0 && actual !== expected && (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          Exp: {formatCurrency(expected)}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right align-middle">
                      <div className="flex items-center justify-end gap-1">
                        {!isPaid ? (
                          <button
                            onClick={() => onMarkPaidClick(entry)}
                            className="px-2.5 py-1 text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 border border-border rounded-md transition-colors"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => onMarkPaidClick(entry)}
                            className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                            title="Edit payment"
                          >
                            Edit Payment
                          </button>
                        )}

                        <button
                          onClick={() => onEditClick(entry)}
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                          title="Edit bill"
                        >
                          <Pencil size={13} />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Remove "${entry.name}" from ${monthLabel}?`)) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-rose-500 rounded-md hover:bg-rose-500/10 transition-colors"
                          title="Delete bill"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer Summary */}
      <div className="flex-none px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          <span className="text-foreground font-medium">{entries.length}</span> {entries.length === 1 ? 'record' : 'records'} total
          <span className="mx-2">•</span>
          <span className="text-foreground font-medium">{paidCount}</span> settled, <span className="text-foreground font-medium">{pendingCount}</span> pending
        </div>
      </div>
    </div>
  );
}
