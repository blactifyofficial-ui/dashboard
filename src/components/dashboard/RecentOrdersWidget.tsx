'use client';

import Link from 'next/link';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { isCodOrder, getCodAmountToCollect } from '@/lib/order-utils';
import { formatStoreDate, formatStoreTime } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';

export interface RecentOrder {
  id: string;
  orderNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
  totalPrice: string | null;
  totalOutstanding?: string | null;
  createdAt: Date | string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  paymentGateway: string | null;
}

interface RecentOrdersWidgetProps {
  orders: RecentOrder[];
  canViewRevenue: boolean;
  canViewOrderDetails?: boolean;
}

export default function RecentOrdersWidget({
  orders,
  canViewRevenue,
  canViewOrderDetails = true,
}: RecentOrdersWidgetProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Recent Orders</h3>
          <span className="text-xs text-muted-foreground font-mono">({orders.length})</span>
        </div>
        {canViewRevenue && (
          <Link
            href="/revenue"
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Orders List */}
      <div className="divide-y divide-border/60 flex-1 overflow-y-auto max-h-[380px]">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
            <ShoppingBag size={28} className="text-muted-foreground/60" />
            <p className="text-sm">No recent orders found</p>
          </div>
        ) : (
          orders.map((order) => {
            const isCod = isCodOrder(order);
            const isFulfilled = (order.fulfillmentStatus || '').toLowerCase() === 'fulfilled';
            const price = parseFloat(order.totalPrice || '0') || 0;
            const orderNum = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.substring(0, 6)}`;

            const content = (
              <>
                {/* Left: Order # and Customer */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-semibold text-xs sm:text-sm text-foreground ${canViewOrderDetails ? 'group-hover:text-primary' : ''} transition-colors`}>
                      {orderNum}
                    </span>
                    {/* Payment Badge */}
                    <Badge variant={isCod ? 'warning' : 'success'} size="sm" dot>
                      {order.financialStatus === 'partially_paid' ? 'Partial COD' : (isCod ? 'COD' : 'Prepaid')}
                    </Badge>

                    {/* Fulfillment Badge */}
                    <Badge variant={isFulfilled ? 'info' : 'neutral'} size="sm" className="hidden sm:inline-flex">
                      {isFulfilled ? 'Fulfilled' : 'Unfulfilled'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                    <span className="truncate font-medium text-foreground/90">
                      {order.customerName || 'Customer'}
                    </span>
                    <span>•</span>
                    <span className="text-[11px] shrink-0 font-mono">
                      {formatStoreDate(order.createdAt, { month: 'short', day: 'numeric' })} at {formatStoreTime(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right: Price & Link icon */}
                <div className="flex items-center gap-2 shrink-0 text-right">
                  {canViewRevenue && (
                    order.financialStatus === 'partially_paid' ? (
                      <div className="flex flex-col items-end">
                        <div className="font-mono font-semibold text-sm sm:text-base text-foreground">
                          ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                          COD: ₹{getCodAmountToCollect(order).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ) : (
                      <div className="font-mono font-semibold text-sm sm:text-base text-foreground">
                        ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )
                  )}
                  {canViewOrderDetails && (
                    <ArrowUpRight
                      size={15}
                      className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                    />
                  )}
                </div>
              </>
            );

            if (canViewOrderDetails) {
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors group cursor-pointer"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={order.id}
                className="p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3"
              >
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
