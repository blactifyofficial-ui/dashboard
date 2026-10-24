'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ArrowUpRight, 
  CheckCircle2, 
  Banknote, 
  CreditCard, 
  Package, 
  Clock, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { isCodOrder, getCodAmountToCollect, getPrepaidAmount } from '@/lib/order-utils';
import { formatStoreDate, formatStoreTime } from '@/lib/date-utils';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface MonthOrderDetail {
  id: string;
  orderNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
  totalPrice: string | null;
  totalOutstanding?: string | null;
  currency: string | null;
  createdAt: Date | string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  paymentGateway: string | null;
  trackingId?: string | null;
  trackingCompany?: string | null;
  trackingUrl?: string | null;
  codStatus?: string | null;
}

interface MonthOrdersTableProps {
  orders: MonthOrderDetail[];
}

export default function MonthOrdersTable({ orders }: MonthOrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'NORMAL' | 'COD'>('ALL');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'ALL' | 'FULFILLED' | 'UNFULFILLED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const orderStats = useMemo(() => {
    let codCount = 0;
    let normalCount = 0;
    let codRevenue = 0;
    let normalRevenue = 0;

    orders.forEach((order) => {
      const isCod = isCodOrder(order);
      const price = parseFloat(order.totalPrice || '0') || 0;
      if (isCod) {
        codCount++;
        codRevenue += price;
      } else {
        normalCount++;
        normalRevenue += price;
      }
    });

    return { codCount, normalCount, codRevenue, normalRevenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const isCod = isCodOrder(order);
      
      // Type filter
      if (filterType === 'NORMAL' && isCod) return false;
      if (filterType === 'COD' && !isCod) return false;

      // Fulfillment filter
      if (fulfillmentFilter === 'FULFILLED' && order.fulfillmentStatus !== 'fulfilled') return false;
      if (fulfillmentFilter === 'UNFULFILLED' && order.fulfillmentStatus === 'fulfilled') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const orderNum = (order.orderNumber || '').toLowerCase();
        const name = (order.customerName || '').toLowerCase();
        const email = (order.customerEmail || '').toLowerCase();
        const amount = (order.totalPrice || '').toLowerCase();
        const gateway = (order.paymentGateway || '').toLowerCase();
        const status = (order.financialStatus || '').toLowerCase();

        const matches = 
          orderNum.includes(query) ||
          name.includes(query) ||
          email.includes(query) ||
          amount.includes(query) ||
          gateway.includes(query) ||
          status.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [orders, filterType, fulfillmentFilter, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Reset page on search or filter change
  const handleFilterChange = (type: 'ALL' | 'NORMAL' | 'COD') => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleFulfillmentChange = (type: 'ALL' | 'FULFILLED' | 'UNFULFILLED') => {
    setFulfillmentFilter(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const filteredTotalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (parseFloat(o.totalPrice || '0') || 0), 0);
  }, [filteredOrders]);

  return (
    <div className="bg-card border border-border rounded-xl relative overflow-hidden flex flex-col shadow-xs">
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-border relative z-10 space-y-3.5 bg-muted/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
              Order Details &amp; Payment Ledger
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              Comprehensive transaction records with real-time payment channels and fulfillment states
            </p>
          </div>

          {/* Search Input with 21st.dev Input */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              type="text"
              placeholder="Search by order #, name, email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-14 h-9 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-muted hover:bg-accent transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Order Type Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-muted/70 p-1 rounded-lg border border-border">
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterType === 'ALL'
                  ? 'bg-card text-foreground font-semibold shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>All Orders</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted border border-border/80 font-mono text-muted-foreground">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => handleFilterChange('NORMAL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterType === 'NORMAL'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CreditCard size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Prepaid</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                {orderStats.normalCount}
              </span>
            </button>

            <button
              onClick={() => handleFilterChange('COD')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterType === 'COD'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Banknote size={12} className="text-amber-600 dark:text-amber-400" />
              <span>COD</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
                {orderStats.codCount}
              </span>
            </button>
          </div>

          {/* Fulfillment Status Toggle */}
          <div className="flex items-center gap-1 text-xs">
            <SlidersHorizontal size={13} className="text-muted-foreground mr-1 hidden sm:inline" />
            <button
              onClick={() => handleFulfillmentChange('ALL')}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                fulfillmentFilter === 'ALL'
                  ? 'bg-card text-foreground border-border shadow-xs font-medium'
                  : 'text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => handleFulfillmentChange('FULFILLED')}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                fulfillmentFilter === 'FULFILLED'
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-medium'
                  : 'text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              Fulfilled
            </button>
            <button
              onClick={() => handleFulfillmentChange('UNFULFILLED')}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                fulfillmentFilter === 'UNFULFILLED'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-medium'
                  : 'text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              Unfulfilled
            </button>
          </div>
        </div>

        {/* Showing Summary text */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/80">
          <span>
            Showing <strong className="text-foreground font-mono">{filteredOrders.length}</strong> {filteredOrders.length === 1 ? 'order' : 'orders'}
            {filterType !== 'ALL' && ` (${filterType === 'NORMAL' ? 'Prepaid' : 'COD'})`}
          </span>
          <span>
            Filtered Total: <strong className="text-foreground font-mono">₹{filteredTotalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </span>
        </div>
      </div>

      {/* Orders Table (Desktop & Tablet) using 21st.dev Table */}
      <div className="relative z-10 w-full overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold text-xs">Order</TableHead>
              <TableHead className="font-semibold text-xs">Date &amp; Time</TableHead>
              <TableHead className="font-semibold text-xs">Customer</TableHead>
              <TableHead className="font-semibold text-xs">Payment &amp; Gateway</TableHead>
              <TableHead className="font-semibold text-xs">Fulfillment</TableHead>
              <TableHead className="font-semibold text-xs text-right">Amount</TableHead>
              <TableHead className="font-semibold text-xs text-center w-16">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2.5">
                    <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                      <Package size={20} />
                    </div>
                    <p className="text-sm font-medium text-foreground">No orders matching criteria</p>
                    <p className="text-xs text-muted-foreground">Try adjusting search query or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => {
                const isCod = isCodOrder(order);
                const formattedDate = formatStoreDate(order.createdAt);
                const formattedTime = formatStoreTime(order.createdAt);
                const amount = parseFloat(order.totalPrice || '0') || 0;

                return (
                  <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                    {/* Order Number */}
                    <TableCell className="font-medium text-foreground whitespace-nowrap">
                      <Link 
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors group/link"
                      >
                        <span className="font-mono text-xs sm:text-sm">#{order.orderNumber || order.id.slice(0, 8)}</span>
                        <ArrowUpRight size={13} className="text-muted-foreground group-hover/link:text-primary transition-colors shrink-0" />
                      </Link>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      <div className="text-xs font-medium text-foreground">{formattedDate}</div>
                      {formattedTime && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          <span>{formattedTime}</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="font-medium text-foreground text-xs sm:text-sm max-w-[180px] truncate">
                        {order.customerName || 'Guest Customer'}
                      </div>
                      {order.customerEmail && (
                        <div className="text-[11px] text-muted-foreground max-w-[180px] truncate mt-0.5">
                          {order.customerEmail}
                        </div>
                      )}
                    </TableCell>

                    {/* COD or Normal Order Detail */}
                    <TableCell className="whitespace-nowrap">
                      {isCod ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="warning" dot size="sm">
                              COD
                            </Badge>
                            {order.codStatus === 'COLLECTED' ? (
                              <Badge variant="success" size="sm">
                                Collected
                              </Badge>
                            ) : order.codStatus === 'RTO' ? (
                              <Badge variant="destructive" size="sm">
                                RTO
                              </Badge>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {order.financialStatus === 'partially_paid' 
                              ? 'Partial COD (Advance Paid)' 
                              : order.financialStatus === 'pending'
                              ? 'Cash on Delivery'
                              : order.paymentGateway || 'Cash on Delivery'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Badge variant="success" dot size="sm" className="w-fit">
                            Prepaid
                          </Badge>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />
                            <span>{order.financialStatus || 'Paid Online'}</span>
                            {order.paymentGateway && <span className="text-muted-foreground">• {order.paymentGateway}</span>}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Fulfillment */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <Badge 
                          variant={order.fulfillmentStatus === 'fulfilled' ? 'info' : 'neutral'} 
                          size="sm"
                          className="w-fit"
                        >
                          {order.fulfillmentStatus ? order.fulfillmentStatus.charAt(0).toUpperCase() + order.fulfillmentStatus.slice(1) : 'Unfulfilled'}
                        </Badge>
                        {order.trackingId && (
                          order.trackingUrl ? (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 w-fit"
                              title={`${order.trackingCompany || 'Courier'}: ${order.trackingId}`}
                            >
                              <span>{order.trackingCompany ? `${order.trackingCompany}: ` : ''}{order.trackingId}</span>
                              <ArrowUpRight size={10} className="shrink-0" />
                            </a>
                          ) : (
                            <span className="font-mono text-[11px] text-muted-foreground select-all">
                              {order.trackingCompany ? `${order.trackingCompany}: ` : ''}{order.trackingId}
                            </span>
                          )
                        )}
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right whitespace-nowrap">
                      {order.financialStatus === 'partially_paid' ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-medium text-xs sm:text-sm text-foreground font-mono">
                            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                            COD: ₹{getCodAmountToCollect(order).toLocaleString('en-IN')} (Adv: ₹{getPrepaidAmount(order).toLocaleString('en-IN')})
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-xs sm:text-sm text-foreground font-mono">
                          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-center whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Link
                          href={`/orders/${order.id}`}
                          title="View Order Details"
                          aria-label="View Order Details"
                        >
                          <ArrowUpRight size={14} />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 sm:px-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20 relative z-10">
          <div className="text-xs text-muted-foreground">
            Page <span className="font-medium font-mono text-foreground">{currentPage}</span> of <span className="font-medium font-mono text-foreground">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="gap-1"
            >
              <ChevronLeft size={13} />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="gap-1"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

