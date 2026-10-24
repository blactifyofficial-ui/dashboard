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
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
        <div className="w-12 h-12 rounded-xl bg-muted border border-border text-muted-foreground mx-auto flex items-center justify-center mb-3">
          <Package size={24} />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          No COD Orders Found
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1">
          No Cash on Delivery orders matched your current filters. Try selecting a different date range or clearing your search.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Container using 21st.dev Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold text-xs">Order #</TableHead>
                <TableHead className="font-semibold text-xs">Date</TableHead>
                <TableHead className="font-semibold text-xs">Customer</TableHead>
                <TableHead className="font-semibold text-xs">Courier / Tracking</TableHead>
                <TableHead className="font-semibold text-xs">Fulfillment</TableHead>
                <TableHead className="font-semibold text-xs">Shopify Status</TableHead>
                <TableHead className="font-semibold text-xs text-right">COD to Collect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => {
                const courierName = order.trackingCompany || order.courier || 'India Post';
                const isFulfilled = (order.fulfillmentStatus || '').toLowerCase() === 'fulfilled';

                return (
                  <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                    {/* Order # */}
                    <TableCell className="whitespace-nowrap font-mono font-semibold text-foreground text-xs sm:text-sm">
                      {order.orderNumber ? `#${order.orderNumber}` : order.id.slice(0, 8)}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Calendar size={11} />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="max-w-[180px]">
                        <div className="font-medium text-foreground text-xs sm:text-sm truncate">
                          {order.customerName || 'Anonymous Customer'}
                        </div>
                        {order.customerEmail && (
                          <div className="text-[11px] text-muted-foreground truncate font-mono">
                            {order.customerEmail}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Courier / Tracking */}
                    <TableCell className="whitespace-nowrap">
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
                    </TableCell>

                    {/* Fulfillment */}
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={isFulfilled ? 'info' : 'neutral'} size="sm">
                        {order.fulfillmentStatus || 'unfulfilled'}
                      </Badge>
                    </TableCell>

                    {/* Shopify Financial Status */}
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="subtle" size="sm" className="font-mono">
                        {order.financialStatus || 'pending'}
                      </Badge>
                    </TableCell>

                    {/* COD to Collect */}
                    <TableCell className="whitespace-nowrap text-right">
                      {(() => {
                        const isPartial = (order.financialStatus || '').toLowerCase() === 'partially_paid';
                        const codAmount = getCodAmountToCollect(order);
                        const prepaid = getPrepaidAmount(order);

                        return (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-mono font-bold text-foreground text-xs sm:text-sm">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer with Pagination & Summary */}
        <div className="bg-muted/20 border-t border-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Total in this view: <strong className="text-foreground font-mono">{orders.length}</strong> orders (
              <strong className="text-foreground font-mono">{formatCurrency(totalAmount)}</strong>)
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <div className="inline-flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 w-7"
                >
                  <ChevronLeft size={13} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 w-7"
                >
                  <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
