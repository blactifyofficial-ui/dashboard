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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <AlertTriangle size={11} />
        Overdue {Math.abs(diffDays)}d
      </span>
    );
  } else if (diffDays === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
        <Clock size={11} />
        Due Today
      </span>
    );
  } else if (diffDays <= 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/10 text-neutral-300 border border-white/15">
        <Clock size={11} />
        Due in {diffDays}d
      </span>
    );
  } else {
    return (
      <span className="text-xs text-white/50">
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
    <div className="flex-1 min-h-0 flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-sm">
      {/* Search & Filter Toolbar */}
      <div className="flex-none p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/40">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-white/5 border border-white/10 p-0.5 rounded-lg">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'ALL'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'PENDING'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'PAID'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Paid ({paidCount})
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenTemplates}
            className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <SlidersHorizontal size={13} />
            <span>Templates</span>
          </button>

          <button
            onClick={onAddClick}
            className="px-3.5 py-1.5 text-xs font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredEntries.length === 0 ? (
          <div className="py-20 text-center text-white/40 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <FileText size={20} />
            </div>
            <p className="text-sm font-medium text-white/70">
              {entries.length === 0 ? 'No recurring bills found for this month.' : 'No bills match your search filter.'}
            </p>
            {entries.length === 0 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={onAddClick}
                  className="px-3 py-1.5 text-xs font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Bill
                </button>
                <button
                  onClick={onOpenTemplates}
                  className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  Configure Templates
                </button>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-neutral-950/90 backdrop-blur-md text-xs text-white/50 uppercase tracking-wider border-b border-white/10 z-10">
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
            <tbody className="divide-y divide-white/5">
              {filteredEntries.map((entry) => {
                const isPaid = entry.status === 'PAID';
                const expected = parseFloat(entry.expectedAmount || '0') || 0;
                const actual = parseFloat(entry.actualAmount || '0') || 0;
                const dueBadge = getDueDayBadge(entry.dueDay, entry.month, isPaid);

                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-white/[0.03] transition-colors group ${
                      isPaid ? 'opacity-70 hover:opacity-100' : ''
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
                        className={`p-1.5 rounded-md border transition-all ${
                          isPaid
                            ? 'bg-white text-black border-white hover:bg-neutral-200'
                            : 'bg-white/5 border-white/20 text-white/40 hover:text-white hover:border-white/40'
                        }`}
                        title={isPaid ? 'Click to mark as pending' : 'Click to mark as paid'}
                      >
                        {isPaid ? <Check size={13} className="stroke-[3]" /> : <Circle size={13} />}
                      </button>
                    </td>

                    {/* Expense Name & Notes */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col">
                        <span className={`font-medium ${isPaid ? 'text-white/60 line-through decoration-white/20' : 'text-white'}`}>
                          {entry.name}
                        </span>
                        {entry.notes && (
                          <span className="text-xs text-white/40 truncate max-w-sm" title={entry.notes}>
                            {entry.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 align-middle">
                      <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-white/80">
                        {entry.category || 'General'}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3 align-middle">
                      {isPaid ? (
                        <span className="text-xs text-white/40 font-mono">
                          Settled
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {dueBadge || (
                            <span className="text-xs text-white/60">
                              {entry.dueDay ? `${entry.dueDay}th of month` : '—'}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Payment Info */}
                    <td className="px-4 py-3 align-middle text-xs text-white/60">
                      {isPaid ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-white/80 font-medium flex-wrap">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span>Paid on {entry.paidDate ? new Date(entry.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Done'}</span>
                            <span className="text-[10px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded font-normal" title="Recorded in Expense tracker">
                              Recorded in Expense
                            </span>
                          </div>
                          {(entry.paymentMethodName || entry.referenceNumber) && (
                            <div className="text-[11px] text-white/40 font-mono">
                              {[entry.paymentMethodName, entry.referenceNumber].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right align-middle font-mono font-medium">
                      <div className={isPaid ? 'text-white/70' : 'text-white'}>
                        {formatCurrency(isPaid && actual > 0 ? actual : expected)}
                      </div>
                      {isPaid && actual > 0 && expected > 0 && actual !== expected && (
                        <div className="text-[11px] text-white/40 font-mono">
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
                            className="px-2.5 py-1 text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-md transition-colors"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => onMarkPaidClick(entry)}
                            className="px-2 py-1 text-xs text-white/50 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                            title="Edit payment"
                          >
                            Edit Payment
                          </button>
                        )}

                        <button
                          onClick={() => onEditClick(entry)}
                          className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                          title="Edit bill"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Remove "${entry.name}" from ${monthLabel}?`)) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          className="p-1.5 text-white/40 hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-colors"
                          title="Delete bill"
                        >
                          <Trash2 size={14} />
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
      <div className="flex-none px-4 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-white/50">
        <div>
          <span className="text-white font-medium">{entries.length}</span> {entries.length === 1 ? 'record' : 'records'} total
          <span className="mx-2">•</span>
          <span className="text-white font-medium">{paidCount}</span> settled, <span className="text-white font-medium">{pendingCount}</span> pending
        </div>
      </div>
    </div>
  );
}
