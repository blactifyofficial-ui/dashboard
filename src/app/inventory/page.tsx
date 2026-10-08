'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Package,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { InventoryResponse } from '@/app/api/inventory/route';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const canViewInventory = hasPermission('inventory:view');
  const canViewValuation = hasPermission('inventory:view_valuation');
  const canSyncInventory = hasPermission('inventory:sync');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [data, setData] = useState<InventoryResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'VALUE_DESC' | 'VALUE_ASC' | 'STOCK_DESC' | 'STOCK_ASC' | 'PRICE_DESC' | 'TITLE_ASC'>('VALUE_DESC');
  const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: data?.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const fetchInventory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/inventory');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch inventory (${res.status})`);
      }
      const json: InventoryResponse = await res.json();
      setData(json);
      if (isRefresh) {
        toast.success('Inventory synced with Shopify');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Error fetching inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInventory();
  }, [fetchInventory]);

  const toggleExpand = (productId: number) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];

    let result = [...data.products];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.vendor.toLowerCase().includes(q) ||
          p.productType.toLowerCase().includes(q) ||
          p.variants.some((v) => (v.sku && v.sku.toLowerCase().includes(q)) || v.title.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((p) => p.stockStatus === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'VALUE_DESC':
          return b.potentialRevenue - a.potentialRevenue;
        case 'VALUE_ASC':
          return a.potentialRevenue - b.potentialRevenue;
        case 'STOCK_DESC':
          return b.totalStock - a.totalStock;
        case 'STOCK_ASC':
          return a.totalStock - b.totalStock;
        case 'PRICE_DESC':
          return b.minPrice - a.minPrice;
        case 'TITLE_ASC':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [data, searchQuery, statusFilter, sortBy]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredProducts.length);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  // Smart page numbers array
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [safeCurrentPage, totalPages]);

  // Loading Screen
  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const summary = data?.summary;

  if (!canViewInventory) {
    return <AccessDenied message="You do not have permission to view inventory and stock levels." />;
  }

  return (
    <div className="flex flex-col space-y-4 sm:space-y-6 pb-12 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Inventory & Stock Value</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-neutral-300 border border-white/15">
              Shopify Live Stock
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {canViewValuation
              ? 'Live stock counts and expected revenue if all current stock is sold.'
              : 'Live inventory stock counts and product availability across warehouses.'}
          </p>
        </div>

        {/* Top Header Action Buttons */}
        {canSyncInventory && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInventory(true)}
              disabled={refreshing}
              className="p-2.5 min-h-[40px] px-3.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              title="Refresh from Shopify"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Shopify'}</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      {summary && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${canViewValuation ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-3 sm:gap-4`}>
          {/* Card 1: Total Potential Revenue (Valuation only) */}
          {canViewValuation && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/5 rounded-full blur-xl pointer-events-none" />
              <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Total Stock Value</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                {formatCurrency(summary.totalPotentialRevenue)}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Avg. {formatCurrency(summary.avgUnitSellingPrice)} / piece
              </p>
            </div>
          )}

          {/* Card 2: Total Units in Stock */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Total Items in Stock</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {summary.totalStockUnits.toLocaleString()} <span className="text-xs font-normal text-white/40">units</span>
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {summary.totalActiveProducts} active products ({summary.totalVariants} options/sizes)
            </p>
          </div>

          {/* Card 3: Catalog MRP Valuation (Valuation only) */}
          {canViewValuation && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
              <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Original MRP Value</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                {formatCurrency(summary.totalMRPValuation)}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Store Discount: {formatCurrency(summary.potentialDiscountValue)}
              </p>
            </div>
          )}

          {/* Card 4: Stock Health */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Stock Availability</p>
            <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {summary.inStockCount} In Stock
              </span>
              <span className="text-white/20">•</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                {summary.lowStockCount} Low
              </span>
              <span className="text-white/20">•</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                {summary.outOfStockCount} Out
              </span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden flex">
              <div
                style={{ width: `${(summary.inStockCount / (summary.totalProducts || 1)) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`In Stock: ${summary.inStockCount}`}
              />
              <div
                style={{ width: `${(summary.lowStockCount / (summary.totalProducts || 1)) * 100}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Low Stock: ${summary.lowStockCount}`}
              />
              <div
                style={{ width: `${(summary.outOfStockCount / (summary.totalProducts || 1)) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Out of Stock: ${summary.outOfStockCount}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by product name, SKU, or category..."
            className="w-full bg-black/40 border border-white/10 focus:border-white/25 rounded-xl h-10 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
            <Filter size={13} className="text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setCurrentPage(1);
              }}
              aria-label="Filter products by stock status"
              className="bg-transparent text-xs text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#1e1e1e] text-white">All Products ({data?.products?.length || 0})</option>
              <option value="IN_STOCK" className="bg-[#1e1e1e] text-white">In Stock (More than 5)</option>
              <option value="LOW_STOCK" className="bg-[#1e1e1e] text-white">Low Stock (1 to 5 left)</option>
              <option value="OUT_OF_STOCK" className="bg-[#1e1e1e] text-white">Out of Stock (0 left)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
            <ArrowUpDown size={13} className="text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as typeof sortBy);
                setCurrentPage(1);
              }}
              aria-label="Sort products list"
              className="bg-transparent text-xs text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="VALUE_DESC" className="bg-[#1e1e1e] text-white">Highest Total Stock Value</option>
              <option value="VALUE_ASC" className="bg-[#1e1e1e] text-white">Lowest Total Stock Value</option>
              <option value="STOCK_DESC" className="bg-[#1e1e1e] text-white">Most Units in Stock</option>
              <option value="STOCK_ASC" className="bg-[#1e1e1e] text-white">Least Units in Stock</option>
              <option value="PRICE_DESC" className="bg-[#1e1e1e] text-white">Highest Price</option>
              <option value="TITLE_ASC" className="bg-[#1e1e1e] text-white">Product Name (A to Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
        <div className="flex-none p-4 sm:px-6 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Product Stock & Value Breakdown</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10">
              {filteredProducts.length} items
            </span>
          </div>
          {data?.fetchedAt && (
            <span className="text-[11px] text-neutral-500">
              Synced: {new Date(data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-white/20" />
            <p className="text-sm">No products found matching your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/5 overflow-x-auto">
              {paginatedProducts.map((product) => {
                const isExpanded = !!expandedProducts[product.id];
                const hasMultipleVariants = product.variants.length > 1;

                return (
                  <div key={product.id} className="transition-colors hover:bg-white/[0.02]">
                    {/* Main Product Row */}
                    <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Image & Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Package className="w-5 h-5 text-white/20" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-white truncate max-w-md">
                              {product.title}
                            </h3>
                            <a
                              href={product.shopifyAdminUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neutral-500 hover:text-white transition-colors p-1"
                              title="Open in Shopify Admin"
                            >
                              <ExternalLink size={13} />
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5 flex-wrap">
                            <span>{product.vendor}</span>
                            {product.productType && (
                              <>
                                <span className="text-white/20">•</span>
                                <span>{product.productType}</span>
                              </>
                            )}
                            <span className="text-white/20">•</span>
                            <span>{product.variants.length} variant{product.variants.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quantity, Price & Stock Value */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                        {/* Stock Status Badge */}
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.stockStatus === 'IN_STOCK'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                  : product.stockStatus === 'LOW_STOCK'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  product.stockStatus === 'IN_STOCK'
                                    ? 'bg-emerald-400'
                                    : product.stockStatus === 'LOW_STOCK'
                                    ? 'bg-amber-400'
                                    : 'bg-rose-400'
                                }`}
                              />
                              {product.totalStock} in stock
                            </span>
                          </div>
                          {canViewValuation && (
                            <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                              {formatCurrency(product.minPrice)}
                              {product.maxPrice > product.minPrice ? ` - ${formatCurrency(product.maxPrice)}` : ''}
                            </div>
                          )}
                        </div>

                        {/* Total Stock Value */}
                        {canViewValuation && (
                          <div className="text-right min-w-[110px]">
                            <div className="text-sm font-bold font-mono text-white tracking-tight">
                              {formatCurrency(product.potentialRevenue)}
                            </div>
                            <div className="text-[11px] text-neutral-500">Stock Value</div>
                          </div>
                        )}

                        {/* Expand Toggle */}
                        {hasMultipleVariants && (
                          <button
                            onClick={() => toggleExpand(product.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
                            title={isExpanded ? 'Collapse variants' : 'Expand variants'}
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Variants Accordion */}
                    {isExpanded && (
                      <div className="bg-black/40 border-t border-white/5 px-4 sm:px-6 py-3 sm:pl-16">
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                          Options & Variants
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {product.variants.map((v) => {
                            const variantStockColor =
                              v.inventoryQuantity > 5
                                ? 'text-emerald-400'
                                : v.inventoryQuantity > 0
                                ? 'text-amber-400'
                                : 'text-rose-400';

                            const variantDotColor =
                              v.inventoryQuantity > 5
                                ? 'bg-emerald-400'
                                : v.inventoryQuantity > 0
                                ? 'bg-amber-400'
                                : 'bg-rose-400';

                            return (
                              <div
                                key={v.id}
                                className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex items-center justify-between"
                              >
                                <div>
                                  <div className="text-xs font-medium text-white">{v.title}</div>
                                  <div className="text-[10px] font-mono text-neutral-400">
                                    {v.sku ? `SKU: ${v.sku}` : ''}
                                    {v.sku && canViewValuation ? ' • ' : ''}
                                    {canViewValuation ? formatCurrency(v.price) : ''}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-xs font-semibold font-mono flex items-center justify-end gap-1.5 ${variantStockColor}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${variantDotColor}`}></span>
                                    {v.inventoryQuantity} in stock
                                  </div>
                                  {canViewValuation && (
                                    <div className="text-[10px] font-mono text-neutral-300">
                                      {formatCurrency(v.potentialRevenue)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls Footer */}
            <div className="flex-none p-4 sm:px-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40">
              {/* Left: Showing range */}
              <div className="text-xs text-neutral-400">
                Showing <span className="font-mono font-medium text-white">{filteredProducts.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-mono font-medium text-white">{endIndex}</span> of <span className="font-mono font-medium text-white">{filteredProducts.length}</span> products
              </div>

              {/* Center: Page numbers */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {pageNumbers.map((page, idx) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-neutral-600">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = page === safeCurrentPage;
                    return (
                      <button
                        key={`page-${page}`}
                        onClick={() => setCurrentPage(page as number)}
                        className={`min-w-[32px] h-8 px-2 text-xs font-mono font-medium rounded-lg transition-all ${
                          isCurrent
                            ? 'bg-white text-black shadow-sm font-semibold'
                            : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Right: Page Size Selector + Prev/Next */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-xl px-2.5 py-1">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Products per page"
                    className="bg-transparent text-xs text-neutral-300 focus:outline-none cursor-pointer"
                  >
                    <option value={10} className="bg-[#1e1e1e] text-white">10 / page</option>
                    <option value={15} className="bg-[#1e1e1e] text-white">15 / page</option>
                    <option value={25} className="bg-[#1e1e1e] text-white">25 / page</option>
                    <option value={50} className="bg-[#1e1e1e] text-white">50 / page</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="p-2 min-h-[32px] min-w-[32px] rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors flex items-center justify-center"
                    title="Previous Page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-2 min-h-[32px] min-w-[32px] rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors flex items-center justify-center"
                    title="Next Page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
