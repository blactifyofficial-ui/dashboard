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
    <div className="flex-1 min-h-0 flex flex-col bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="flex-none p-3 sm:p-4 border-b border-neutral-800 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-neutral-900/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-9 pr-3.5 py-1.5 min-h-[38px] bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-neutral-950 border border-neutral-800 p-0.5 rounded-lg overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter('ALL')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'ALL'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'PENDING'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'PAID'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
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
            className="flex-1 sm:flex-none px-3 py-1.5 min-h-[36px] text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <SlidersHorizontal size={14} />
            <span>Templates</span>
          </button>

          <button
            onClick={onAddClick}
            className="flex-1 sm:flex-none px-3.5 py-1.5 min-h-[36px] text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto min-h-0">
        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 space-y-2 px-4">
            <div className="w-10 h-10 mx-auto rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
              <FileText size={18} />
            </div>
            <p className="text-sm font-medium text-white">
              {entries.length === 0 ? 'No recurring bills found for this month.' : 'No bills match your search filter.'}
            </p>
            {entries.length === 0 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={onAddClick}
                  className="px-3.5 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Bill
                </button>
                <button
                  onClick={onOpenTemplates}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
                >
                  Configure Templates
                </button>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="sticky top-0 bg-neutral-900 text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800 z-10">
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
            <tbody className="divide-y divide-neutral-800/60">
              {filteredEntries.map((entry) => {
                const isPaid = entry.status === 'PAID';
                const expected = parseFloat(entry.expectedAmount || '0') || 0;
                const actual = parseFloat(entry.actualAmount || '0') || 0;
                const dueBadge = getDueDayBadge(entry.dueDay, entry.month, isPaid);

                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-neutral-800/30 transition-colors group ${
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
                            ? 'bg-white text-black border-white hover:bg-neutral-200'
                            : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:text-white hover:border-neutral-500'
                        }`}
                        title={isPaid ? 'Click to mark as pending' : 'Click to mark as paid'}
                      >
                        {isPaid ? <Check size={13} className="stroke-[3]" /> : <Circle size={13} />}
                      </button>
                    </td>

                    {/* Expense Name & Notes */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col">
                        <span className={`font-medium ${isPaid ? 'text-neutral-400 line-through decoration-neutral-600' : 'text-white'}`}>
                          {entry.name}
                        </span>
                        {entry.notes && (
                          <span className="text-xs text-neutral-400 truncate max-w-xs sm:max-w-sm" title={entry.notes}>
                            {entry.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 align-middle">
                      <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs text-neutral-300">
                        {entry.category || 'General'}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3 align-middle">
                      {isPaid ? (
                        <span className="text-xs text-neutral-500 font-mono">
                          Settled
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {dueBadge || (
                            <span className="text-xs text-neutral-400">
                              {entry.dueDay ? `${entry.dueDay}th of month` : '—'}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Payment Info */}
                    <td className="px-4 py-3 align-middle text-xs text-neutral-400">
                      {isPaid ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-neutral-300 font-medium flex-wrap">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span>Paid on {entry.paidDate ? new Date(entry.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Done'}</span>
                          </div>
                          {(entry.paymentMethodName || entry.referenceNumber) && (
                            <div className="text-[11px] text-neutral-500 font-mono">
                              {[entry.paymentMethodName, entry.referenceNumber].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right align-middle font-mono font-medium">
                      <div className={isPaid ? 'text-neutral-300' : 'text-white'}>
                        {formatCurrency(isPaid && actual > 0 ? actual : expected)}
                      </div>
                      {isPaid && actual > 0 && expected > 0 && actual !== expected && (
                        <div className="text-[11px] text-neutral-500 font-mono">
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
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => onMarkPaidClick(entry)}
                            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
                            title="Edit payment"
                          >
                            Edit Payment
                          </button>
                        )}

                        <button
                          onClick={() => onEditClick(entry)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
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
                          className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-colors"
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
      <div className="flex-none px-4 py-3 border-t border-neutral-800 bg-neutral-900/80 flex items-center justify-between text-xs text-neutral-400">
        <div>
          <span className="text-white font-medium">{entries.length}</span> {entries.length === 1 ? 'record' : 'records'} total
          <span className="mx-2">•</span>
          <span className="text-white font-medium">{paidCount}</span> settled, <span className="text-white font-medium">{pendingCount}</span> pending
        </div>
      </div>
    </div>
  );
}
