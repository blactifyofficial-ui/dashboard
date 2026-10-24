'use client';

import Link from 'next/link';
import { HandCoins, ArrowRight, Truck, Info, CheckCircle2 } from 'lucide-react';
import { getCodAmountToCollect, getPrepaidAmount } from '@/lib/order-utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <Card>
      <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <HandCoins size={16} className="text-amber-500" />
          <span>Cash on Delivery (COD)</span>
        </CardTitle>
        <Badge variant="warning" size="sm" dot>
          {isPartiallyPaid ? 'Partial COD' : 'COD Order'}
        </Badge>
      </CardHeader>

      <CardContent className="pt-4 space-y-3 text-xs sm:text-sm">
        {/* Main Amount to Collect */}
        <div className="flex justify-between items-center py-2 px-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <span className="font-medium text-amber-900 dark:text-amber-200">
            {isPartiallyPaid ? 'COD Balance to Collect' : 'Amount to Collect'}
          </span>
          <span className="font-mono font-bold text-base text-amber-700 dark:text-amber-300">
            ₹{amountToCollect.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Breakdown for Partial COD */}
        {isPartiallyPaid && (
          <div className="space-y-2 pt-1 border-b border-border/60 pb-3 text-muted-foreground text-xs">
            <div className="flex justify-between items-center">
              <span>Total Order Value</span>
              <span className="font-mono text-foreground font-medium">
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
            <div className="mt-2 p-2.5 rounded-md bg-muted/60 border border-border text-[11px] text-muted-foreground flex items-start gap-1.5 leading-relaxed">
              <Info size={13} className="shrink-0 text-amber-500 mt-0.5" />
              <span>
                Customer paid <strong>₹{prepaidAdvance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> in advance online. The courier collects the remaining unpaid balance of <strong>₹{amountToCollect.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> at delivery.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-1">
          <span className="text-muted-foreground">Courier / Carrier</span>
          <span className="text-foreground font-medium flex items-center gap-1.5">
            <Truck size={13} className="text-muted-foreground" />
            {courier}
          </span>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border/60">
          Courier remittances are recorded in lump-sum payouts for multiple parcels.
        </p>

        <div className="pt-1">
          <Link
            href="/cod"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <span>View COD Collections Ledger</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

