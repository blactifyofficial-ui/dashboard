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

import { isCodOrder } from '@/lib/order-utils';

export interface MonthOrderDetail {
  id: string;
  orderNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
  totalPrice: string | null;
  currency: string | null;
  createdAt: Date | string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  paymentGateway: string | null;
  trackingId?: string | null;
  trackingCompany?: string | null;
  trackingUrl?: string | null;
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
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl relative overflow-hidden flex flex-col">
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-neutral-800 relative z-10 space-y-4 bg-neutral-900/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              Order Details &amp; Payment Types
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">
              Detailed list of all orders with order number, amount, and COD / normal payment breakdown
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={15} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white px-1.5 py-0.5 rounded bg-neutral-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Order Type Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterType === 'ALL'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>All Orders</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 border border-neutral-700 font-mono text-neutral-300">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => handleFilterChange('NORMAL')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterType === 'NORMAL'
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <CreditCard size={13} className="text-emerald-400" />
              <span>Normal (Prepaid)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                {orderStats.normalCount}
              </span>
            </button>

            <button
              onClick={() => handleFilterChange('COD')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterType === 'COD'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Banknote size={13} className="text-amber-400" />
              <span>COD (Cash on Delivery)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                {orderStats.codCount}
              </span>
            </button>
          </div>

          {/* Fulfillment Status Toggle */}
          <div className="flex items-center gap-1 text-xs">
            <SlidersHorizontal size={13} className="text-neutral-500 mr-1 hidden sm:inline" />
            <button
              onClick={() => handleFulfillmentChange('ALL')}
              className={`px-2.5 py-1.5 rounded-md border transition-colors ${
                fulfillmentFilter === 'ALL'
                  ? 'bg-neutral-800 text-white border-neutral-700'
                  : 'text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => handleFulfillmentChange('FULFILLED')}
              className={`px-2.5 py-1.5 rounded-md border transition-colors ${
                fulfillmentFilter === 'FULFILLED'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-medium'
                  : 'text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              Fulfilled
            </button>
            <button
              onClick={() => handleFulfillmentChange('UNFULFILLED')}
              className={`px-2.5 py-1.5 rounded-md border transition-colors ${
                fulfillmentFilter === 'UNFULFILLED'
                  ? 'bg-neutral-800 text-neutral-200 border-neutral-700 font-medium'
                  : 'text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              Unfulfilled
            </button>
          </div>
        </div>

        {/* Showing Summary text */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-1 border-t border-neutral-800/60">
          <span>
            Showing <strong className="text-white">{filteredOrders.length}</strong> {filteredOrders.length === 1 ? 'order' : 'orders'}
            {filterType !== 'ALL' && ` (${filterType === 'NORMAL' ? 'Normal / Prepaid' : 'COD'})`}
          </span>
          <span>
            Filtered Total: <strong className="text-white font-mono">₹{filteredTotalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </span>
        </div>
      </div>

      {/* Orders Table (Desktop & Tablet) */}
      <div className="relative z-10 w-full overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[700px]">
          <thead className="text-xs text-neutral-400 uppercase tracking-wider bg-neutral-900 border-b border-neutral-800">
            <tr>
              <th className="px-4 sm:px-6 py-3 font-medium">Order</th>
              <th className="px-4 sm:px-6 py-3 font-medium">Date &amp; Time</th>
              <th className="px-4 sm:px-6 py-3 font-medium">Customer</th>
              <th className="px-4 sm:px-6 py-3 font-medium">Payment / Type</th>
              <th className="px-4 sm:px-6 py-3 font-medium">Fulfillment</th>
              <th className="px-4 sm:px-6 py-3 font-medium text-right">Amount</th>
              <th className="px-4 sm:px-6 py-3 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
                      <Package size={24} />
                    </div>
                    <p className="text-sm font-medium text-neutral-300">No orders found matching your criteria</p>
                    <p className="text-xs text-neutral-500">Try changing your search term or filter options</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                const isCod = isCodOrder(order);
                const orderDate = order.createdAt ? new Date(order.createdAt) : null;
                const formattedDate = orderDate
                  ? orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '-';
                const formattedTime = orderDate
                  ? orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                  : '';
                const amount = parseFloat(order.totalPrice || '0') || 0;

                return (
                  <tr 
                    key={order.id} 
                    className="hover:bg-neutral-900/40 transition-colors"
                  >
                    {/* Order Number */}
                    <td className="px-4 sm:px-6 py-3.5 font-medium text-white whitespace-nowrap">
                      <Link 
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-white hover:text-neutral-300 transition-colors group/link"
                      >
                        <span className="font-mono text-sm">#{order.orderNumber || order.id.slice(0, 8)}</span>
                        <ArrowUpRight size={13} className="text-neutral-500 group-hover/link:text-white transition-colors shrink-0" />
                      </Link>
                    </td>

                    {/* Date */}
                    <td className="px-4 sm:px-6 py-3.5 text-neutral-300 whitespace-nowrap">
                      <div className="text-xs font-medium text-white">{formattedDate}</div>
                      {formattedTime && (
                        <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          <span>{formattedTime}</span>
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="font-medium text-white text-xs sm:text-sm max-w-[180px] truncate">
                        {order.customerName || 'Guest Customer'}
                      </div>
                      {order.customerEmail && (
                        <div className="text-xs text-neutral-500 max-w-[180px] truncate mt-0.5">
                          {order.customerEmail}
                        </div>
                      )}
                    </td>

                    {/* COD or Normal Order Detail */}
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      {isCod ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 w-fit">
                            <Banknote size={12} className="text-amber-400 shrink-0" />
                            <span>COD</span>
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {order.financialStatus === 'partially_paid' 
                              ? 'Partial COD (Advance Paid)' 
                              : order.financialStatus === 'pending'
                              ? 'Cash on Delivery'
                              : order.paymentGateway || 'Cash on Delivery'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 w-fit">
                            <CreditCard size={12} className="text-emerald-400 shrink-0" />
                            <span>Normal (Prepaid)</span>
                          </span>
                          <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-emerald-400" />
                            <span>{order.financialStatus || 'Paid Online'}</span>
                            {order.paymentGateway && <span className="text-neutral-500">• {order.paymentGateway}</span>}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Fulfillment */}
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium w-fit ${
                          order.fulfillmentStatus === 'fulfilled'
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700/60'
                        }`}>
                          {order.fulfillmentStatus ? order.fulfillmentStatus.charAt(0).toUpperCase() + order.fulfillmentStatus.slice(1) : 'Unfulfilled'}
                        </span>
                        {order.trackingId && (
                          order.trackingUrl ? (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5 w-fit"
                              title={`${order.trackingCompany || 'Courier'}: ${order.trackingId}`}
                            >
                              <span>{order.trackingCompany ? `${order.trackingCompany}: ` : ''}{order.trackingId}</span>
                              <ArrowUpRight size={10} className="shrink-0" />
                            </a>
                          ) : (
                            <span className="font-mono text-[11px] text-neutral-400 select-all">
                              {order.trackingCompany ? `${order.trackingCompany}: ` : ''}{order.trackingId}
                            </span>
                          )
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">
                      <span className="font-medium text-sm sm:text-base text-white font-mono">
                        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 sm:px-6 py-3.5 text-center whitespace-nowrap">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-neutral-800"
                        title="View Order Details"
                        aria-label="View Order Details"
                      >
                        <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3.5 sm:px-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/60 relative z-10">
          <div className="text-xs text-neutral-400">
            Page <span className="font-medium text-white">{currentPage}</span> of <span className="font-medium text-white">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 min-h-[32px] flex items-center gap-1 text-xs rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft size={13} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 min-h-[32px] flex items-center gap-1 text-xs rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
