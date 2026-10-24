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
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RemittanceHistoryTableProps {
  remittances: CodRemittanceRecord[];
  onEdit: (remittance: CodRemittanceRecord) => void;
  onDelete: (id: string) => Promise<void>;
  onRecordNew: () => void;
  canManage: boolean;
  canDelete?: boolean;
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
  canDelete = canManage,
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
        <div className="w-12 h-12 rounded-xl bg-muted border border-border text-muted-foreground mx-auto flex items-center justify-center mb-3">
          <HandCoins size={24} />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          No COD Remittances Recorded Yet
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
          When you receive lump-sum settlements from India Post, Delhivery, or other couriers for delivered parcels, record them here to reconcile your COD balance.
        </p>
        {canManage && (
          <Button
            onClick={onRecordNew}
            className="gap-2"
          >
            <Plus size={16} />
            <span>Record COD Payment Received</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Container using 21st.dev Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table className="min-w-[750px]">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold text-xs">Date Received</TableHead>
                <TableHead className="font-semibold text-xs">Courier / Source</TableHead>
                <TableHead className="font-semibold text-xs">Amount Received</TableHead>
                <TableHead className="font-semibold text-xs">Parcels Covered</TableHead>
                <TableHead className="font-semibold text-xs">Deposited In</TableHead>
                <TableHead className="font-semibold text-xs">UTR / Reference</TableHead>
                <TableHead className="font-semibold text-xs">Notes</TableHead>
                {canManage && <TableHead className="font-semibold text-xs text-right w-20">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {remittances.map((remit) => (
                <TableRow
                  key={remit.id}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  {/* Date */}
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-muted-foreground shrink-0" />
                      <span className="font-medium font-mono text-xs text-foreground">
                        {formatDate(remit.receivedDate)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Courier / Source */}
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="neutral" size="sm" className="gap-1.5 font-medium">
                      <Truck size={12} className="text-primary shrink-0" />
                      {remit.courier || 'India Post Domestic'}
                    </Badge>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="whitespace-nowrap">
                    <div className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(remit.amount)}
                    </div>
                  </TableCell>

                  {/* Parcels Covered */}
                  <TableCell className="whitespace-nowrap">
                    {remit.ordersCount ? (
                      <Badge variant="subtle" size="sm" className="font-mono">
                        <Layers size={11} className="mr-1 text-muted-foreground" />
                        {remit.ordersCount} parcels
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Deposited In */}
                  <TableCell className="whitespace-nowrap">
                    {remit.paymentMethodName ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <Building2 size={12} className="text-muted-foreground shrink-0" />
                        {remit.paymentMethodName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* UTR / Ref */}
                  <TableCell className="whitespace-nowrap">
                    {remit.referenceNumber ? (
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs bg-muted/70 px-2 py-0.5 rounded border border-border/70 text-foreground group/ref">
                        <Receipt size={11} className="text-muted-foreground" />
                        <span className="max-w-[130px] truncate">{remit.referenceNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(remit.referenceNumber!, remit.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors ml-0.5 cursor-pointer"
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
                  </TableCell>

                  {/* Notes */}
                  <TableCell className="max-w-[200px]">
                    {remit.notes ? (
                      <p className="text-xs text-muted-foreground truncate" title={remit.notes}>
                        {remit.notes}
                      </p>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  {canManage && (
                    <TableCell className="text-right whitespace-nowrap">
                      {confirmDeleteId === remit.id ? (
                        <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-lg">
                          <span className="text-[11px] text-rose-500 font-medium px-1 flex items-center gap-1">
                            <AlertTriangle size={11} /> Delete?
                          </span>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(remit.id)}
                            className="px-2 py-0.5 text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isDeleting ? '...' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 text-[11px] font-medium bg-muted hover:bg-muted/80 text-foreground rounded transition-colors cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(remit)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit entry"
                          >
                            <Pencil size={13} />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmDeleteId(remit.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title="Delete entry"
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
