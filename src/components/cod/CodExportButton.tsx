'use client';

import { Download } from 'lucide-react';
import { CodRemittanceRecord, CodOrderBrief } from './types';
import { getCodAmountToCollect, getPrepaidAmount } from '@/lib/order-utils';

interface CodExportButtonProps {
  remittances?: CodRemittanceRecord[];
  orders?: CodOrderBrief[];
  mode?: 'remittances' | 'orders';
  filename?: string;
}

export default function CodExportButton({ 
  remittances = [], 
  orders = [], 
  mode = 'remittances',
  filename = 'cod_remittances' 
}: CodExportButtonProps) {
  const handleExport = () => {
    if (mode === 'remittances') {
      if (!remittances || remittances.length === 0) return;

      const headers = [
        'ID',
        'Date Received',
        'Courier',
        'Amount Received',
        'Parcels Covered',
        'Deposited In',
        'Reference / UTR',
        'Notes',
        'Recorded At',
      ];

      const rows = remittances.map((r) => [
        `"${r.id}"`,
        `"${r.receivedDate ? new Date(r.receivedDate).toISOString().slice(0, 10) : ''}"`,
        `"${(r.courier || '').replace(/"/g, '""')}"`,
        `"${r.amount || '0'}"`,
        `"${r.ordersCount || ''}"`,
        `"${(r.paymentMethodName || '').replace(/"/g, '""')}"`,
        `"${(r.referenceNumber || '').replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
        `"${r.createdAt ? new Date(r.createdAt).toISOString() : ''}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      if (!orders || orders.length === 0) return;

      const headers = [
        'Order Number',
        'Date',
        'Customer Name',
        'Customer Email',
        'Total Order Amount',
        'COD to Collect',
        'Advance Paid Online',
        'Gateway',
        'Financial Status',
        'Fulfillment Status',
        'Courier',
        'Tracking ID',
      ];

      const rows = orders.map((o) => [
        `"${o.orderNumber || o.id}"`,
        `"${o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : ''}"`,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${(o.customerEmail || '').replace(/"/g, '""')}"`,
        `"${o.totalPrice || '0'}"`,
        `"${getCodAmountToCollect(o)}"`,
        `"${getPrepaidAmount(o)}"`,
        `"${(o.paymentGateway || '').replace(/"/g, '""')}"`,
        `"${o.financialStatus || ''}"`,
        `"${o.fulfillmentStatus || ''}"`,
        `"${(o.trackingCompany || o.courier || '').replace(/"/g, '""')}"`,
        `"${o.trackingId || ''}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `cod_orders_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const hasData = mode === 'remittances' ? remittances.length > 0 : orders.length > 0;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!hasData}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      title={`Download ${mode === 'remittances' ? 'remittances' : 'orders'} as CSV`}
    >
      <Download size={13} className="text-muted-foreground" />
      <span>Export CSV</span>
    </button>
  );
}
