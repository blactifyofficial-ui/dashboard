'use client';

import { useState } from 'react';
import { CodOrderBrief } from './types';
import { 
  Package, 
  ExternalLink, 
  Calendar, 
  Truck, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getCodAmountToCollect, getPrepaidAmount } from '@/lib/order-utils';

interface CodOrdersListProps {
  orders: CodOrderBrief[];
}

function formatCurrency(amount: string | number | null): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0') || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateVal: Date | string | null): string {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CodOrdersList({ orders }: CodOrdersListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const totalPages = Math.ceil(orders.length / pageSize) || 1;
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalAmount = orders.reduce((acc, o) => acc + getCodAmountToCollect(o), 0);

  if (orders.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 sm:p-14 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted border border-border text-muted-foreground mx-auto flex items-center justify-center mb-4">
          <Package size={28} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-foreground">
          No COD Orders Found
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1.5">
          No Cash on Delivery orders matched your current filters. Try selecting a different date range or clearing your search.
        </p>
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
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Courier / Tracking</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4">Shopify Status</th>
                <th className="py-3 px-4 text-right">COD to Collect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedOrders.map((order) => {
                const courierName = order.trackingCompany || order.courier || 'India Post';
                const isFulfilled = (order.fulfillmentStatus || '').toLowerCase() === 'fulfilled';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {/* Order # */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-foreground">
                        {order.orderNumber ? `#${order.orderNumber}` : order.id.slice(0, 8)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="max-w-[180px]">
                        <div className="font-medium text-foreground truncate">
                          {order.customerName || 'Anonymous Customer'}
                        </div>
                        {order.customerEmail && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {order.customerEmail}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Courier / Tracking */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Truck size={11} className="text-primary" />
                          {courierName}
                        </span>
                        {order.trackingId ? (
                          <div>
                            {order.trackingUrl ? (
                              <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                              >
                                {order.trackingId}
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span className="font-mono text-[11px] text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border">
                                {order.trackingId}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Fulfillment */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                          isFulfilled
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {order.fulfillmentStatus || 'unfulfilled'}
                      </span>
                    </td>

                    {/* Shopify Financial Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-muted text-muted-foreground border border-border">
                        {order.financialStatus || 'pending'}
                      </span>
                    </td>

                    {/* COD to Collect */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      {(() => {
                        const isPartial = (order.financialStatus || '').toLowerCase() === 'partially_paid';
                        const codAmount = getCodAmountToCollect(order);
                        const prepaid = getPrepaidAmount(order);

                        return (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-mono font-bold text-foreground">
                              {formatCurrency(codAmount)}
                            </span>
                            {isPartial && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Total: {formatCurrency(order.totalPrice)} • Adv: {formatCurrency(prepaid)}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination & Summary */}
        <div className="bg-muted/40 border-t border-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Total in this view: <strong className="text-foreground">{orders.length}</strong> orders (
              <strong className="text-foreground font-mono">{formatCurrency(totalAmount)}</strong>)
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
