'use client';

import { useState } from 'react';
import { 
  CodRemittanceRecord 
} from './types';
import { 
  HandCoins, 
  Pencil, 
  Trash2, 
  Calendar, 
  Truck, 
  Building2, 
  Receipt, 
  Layers, 
  Plus, 
  Check, 
  Copy,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RemittanceHistoryTableProps {
  remittances: CodRemittanceRecord[];
  onEdit: (remittance: CodRemittanceRecord) => void;
  onDelete: (id: string) => Promise<void>;
  onRecordNew: () => void;
  canManage: boolean;
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateVal: Date | string): string {
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RemittanceHistoryTable({
  remittances,
  onEdit,
  onDelete,
  onRecordNew,
  canManage,
}: RemittanceHistoryTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Reference copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await onDelete(id);
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to delete remittance record');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalSum = remittances.reduce(
    (acc, r) => acc + (parseFloat(r.amount) || 0),
    0
  );
  const totalParcels = remittances.reduce(
    (acc, r) => acc + (r.ordersCount ? parseInt(r.ordersCount, 10) || 0 : 0),
    0
  );

  if (remittances.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 sm:p-14 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center mb-4">
          <HandCoins size={28} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-foreground">
          No COD Remittances Recorded Yet
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1.5 mb-6">
          When you receive lump-sum settlements from India Post, Delhivery, or other couriers for delivered parcels, record them here to reconcile your COD balance.
        </p>
        {canManage && (
          <button
            onClick={onRecordNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors"
          >
            <Plus size={16} />
            Record COD Payment Received
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Container */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted/60 border-b border-border text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Date Received</th>
                <th className="py-3 px-4">Courier / Source</th>
                <th className="py-3 px-4">Amount Received</th>
                <th className="py-3 px-4">Parcels Covered</th>
                <th className="py-3 px-4">Deposited In</th>
                <th className="py-3 px-4">UTR / Reference</th>
                <th className="py-3 px-4">Notes</th>
                {canManage && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {remittances.map((remit) => (
                <tr
                  key={remit.id}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  {/* Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">
                        {formatDate(remit.receivedDate)}
                      </span>
                    </div>
                  </td>

                  {/* Courier / Source */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted border border-border text-foreground">
                      <Truck size={12} className="text-primary shrink-0" />
                      {remit.courier || 'India Post Domestic'}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-mono text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(remit.amount)}
                    </div>
                  </td>

                  {/* Parcels Covered */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {remit.ordersCount ? (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2 py-0.5 rounded bg-muted/80 text-foreground border border-border/80">
                        <Layers size={11} className="text-muted-foreground" />
                        {remit.ordersCount} parcels
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>

                  {/* Deposited In */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {remit.paymentMethodName ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <Building2 size={12} className="text-muted-foreground shrink-0" />
                        {remit.paymentMethodName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>

                  {/* UTR / Ref */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {remit.referenceNumber ? (
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs bg-muted/70 px-2 py-0.5 rounded border border-border/70 text-foreground group/ref">
                        <Receipt size={11} className="text-muted-foreground" />
                        <span className="max-w-[130px] truncate">{remit.referenceNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(remit.referenceNumber!, remit.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                          title="Copy reference"
                        >
                          {copiedId === remit.id ? (
                            <Check size={11} className="text-emerald-500" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>

                  {/* Notes */}
                  <td className="py-3.5 px-4 max-w-[200px]">
                    {remit.notes ? (
                      <p className="text-xs text-muted-foreground truncate" title={remit.notes}>
                        {remit.notes}
                      </p>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  {canManage && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {confirmDeleteId === remit.id ? (
                        <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-lg">
                          <span className="text-[11px] text-rose-400 font-medium px-1 flex items-center gap-1">
                            <AlertTriangle size={11} /> Delete?
                          </span>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(remit.id)}
                            className="px-2 py-0.5 text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? '...' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 text-[11px] font-medium bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => onEdit(remit)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit entry"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(remit.id)}
                            className="p-1.5 rounded-md hover:bg-rose-500/15 text-muted-foreground hover:text-rose-500 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary */}
        <div className="bg-muted/40 border-t border-border px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-foreground">{remittances.length}</strong> recorded remittance{remittances.length === 1 ? '' : 's'}
            </span>
            {totalParcels > 0 && (
              <span>
                • <strong className="text-foreground font-mono">{totalParcels}</strong> total parcels accounted
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Total Collected in View:</span>
            <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalSum)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
