'use client';

import Link from 'next/link';
import { HandCoins, ArrowRight, Truck } from 'lucide-react';

interface OrderCodCardProps {
  order: {
    totalPrice: string | null;
    trackingCompany?: string | null;
    courier?: string | null;
    trackingId?: string | null;
  };
}

export default function OrderCodCard({ order }: OrderCodCardProps) {
  const courier = order.trackingCompany || order.courier || 'Courier';
  const price = parseFloat(order.totalPrice || '0') || 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6 text-foreground shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3.5">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <HandCoins size={16} className="text-amber-500" />
          <span>Cash on Delivery (COD)</span>
        </h2>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
          COD Order
        </span>
      </div>

      <div className="space-y-2.5 text-xs sm:text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Amount to Collect</span>
          <span className="font-mono font-bold text-foreground">
            ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Courier / Carrier</span>
          <span className="text-foreground font-medium flex items-center gap-1">
            <Truck size={12} className="text-muted-foreground" />
            {courier}
          </span>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border/60">
          Courier remittances are recorded in lump-sum payouts for multiple parcels.
        </p>

        <div className="pt-2">
          <Link
            href="/cod"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <span>View COD Collections Ledger</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
