'use client';

import Link from 'next/link';
import { HandCoins, ArrowRight, Truck, Info, CheckCircle2 } from 'lucide-react';
import { getCodAmountToCollect, getPrepaidAmount } from '@/lib/order-utils';

interface OrderCodCardProps {
  order: {
    totalPrice: string | null;
    totalOutstanding?: string | null;
    financialStatus?: string | null;
    trackingCompany?: string | null;
    courier?: string | null;
    trackingId?: string | null;
  };
}

export default function OrderCodCard({ order }: OrderCodCardProps) {
  const courier = order.trackingCompany || order.courier || 'Courier';
  const totalPrice = parseFloat(order.totalPrice || '0') || 0;
  const isPartiallyPaid = (order.financialStatus || '').toLowerCase() === 'partially_paid';
  const amountToCollect = getCodAmountToCollect(order);
  const prepaidAdvance = getPrepaidAmount(order);

  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6 text-foreground shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3.5">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <HandCoins size={16} className="text-amber-500" />
          <span>Cash on Delivery (COD)</span>
        </h2>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
          isPartiallyPaid
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25'
        }`}>
          {isPartiallyPaid ? 'Partial COD' : 'COD Order'}
        </span>
      </div>

      <div className="space-y-2.5 text-xs sm:text-sm">
        {/* Main Amount to Collect */}
        <div className="flex justify-between items-center py-1 bg-amber-500/10 -mx-2 px-2.5 rounded-lg border border-amber-500/20">
          <span className="font-medium text-amber-900 dark:text-amber-200">
            {isPartiallyPaid ? 'COD Balance to Collect' : 'Amount to Collect'}
          </span>
          <span className="font-mono font-bold text-base text-amber-700 dark:text-amber-300">
            ₹{amountToCollect.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Breakdown for Partial COD */}
        {isPartiallyPaid && (
          <div className="space-y-1.5 pt-1 border-b border-border/60 pb-2.5 text-muted-foreground text-xs">
            <div className="flex justify-between items-center">
              <span>Total Order Value</span>
              <span className="font-mono text-foreground">
                ₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Advance Paid Online</span>
              </span>
              <span className="font-mono font-medium">
                -₹{prepaidAdvance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 p-2 rounded-md bg-muted/60 border border-border text-[11px] text-muted-foreground flex items-start gap-1.5">
              <Info size={13} className="shrink-0 text-amber-500 mt-0.5" />
              <span>
                Customer paid <strong>₹{prepaidAdvance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> in advance online. The courier should collect the remaining unpaid balance of <strong>₹{amountToCollect.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> at delivery.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-1">
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

