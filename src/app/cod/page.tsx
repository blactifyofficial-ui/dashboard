'use client';

import { useState, useEffect, useCallback } from 'react';
import { HandCoins, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';
import LoadingSpinner from '@/components/LoadingSpinner';
import CodSummaryCards from '@/components/cod/CodSummaryCards';
import CodFilterToolbar from '@/components/cod/CodFilterToolbar';
import RemittanceHistoryTable from '@/components/cod/RemittanceHistoryTable';
import CodOrdersList from '@/components/cod/CodOrdersList';
import RecordRemittanceModal from '@/components/cod/RecordRemittanceModal';
import CodExportButton from '@/components/cod/CodExportButton';
import { CodRemittanceRecord, CodOrderBrief, CodStats, PaymentMethodOption } from '@/components/cod/types';
import toast from 'react-hot-toast';

export default function CodCollectionPage() {
  const { hasPermission } = useAuth();
  const canViewCod = hasPermission('cod:view');
  const canManageCod = hasPermission('cod:manage');
  const canExportCod = hasPermission('cod:export');
  const canDeleteCod = hasPermission('cod:delete');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<'remittances' | 'orders'>('remittances');
  const [timeRange, setTimeRange] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [courier, setCourier] = useState<string>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remittanceToEdit, setRemittanceToEdit] = useState<CodRemittanceRecord | null>(null);

  // Data States
  const [remittances, setRemittances] = useState<CodRemittanceRecord[]>([]);
  const [orders, setOrders] = useState<CodOrderBrief[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [availableCouriers, setAvailableCouriers] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  const [stats, setStats] = useState<CodStats>({
    totalCodAmount: 0,
    totalCodCount: 0,
    collectedAmount: 0,
    remittanceCount: 0,
    pendingAmount: 0,
    collectionRate: 0,
  });

  const triggerRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const params = new URLSearchParams();
        if (timeRange) params.set('timeRange', timeRange);
        if (selectedMonth) params.set('month', selectedMonth);
        if (courier && courier !== 'ALL') params.set('courier', courier);
        if (search.trim()) params.set('search', search.trim());

        const res = await fetch(`/api/cod?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch COD data');
        }

        const data = await res.json();
        if (!ignore) {
          setRemittances(data.remittances || []);
          setOrders(data.orders || []);
          if (data.stats) setStats(data.stats);
          if (data.availableCouriers) setAvailableCouriers(data.availableCouriers);
          if (data.availableMonths) setAvailableMonths(data.availableMonths);
          if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
          setLoading(false);
          setRefreshing(false);
        }
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : 'Error loading COD collection data';
        toast.error(msg);
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [timeRange, selectedMonth, courier, search, refreshKey]);

  // Open modal to record new remittance
  const handleOpenRecordModal = () => {
    setRemittanceToEdit(null);
    setIsModalOpen(true);
  };

  // Open modal to edit existing remittance
  const handleOpenEditModal = (remit: CodRemittanceRecord) => {
    setRemittanceToEdit(remit);
    setIsModalOpen(true);
  };

  // Delete remittance
  const handleDeleteRemittance = async (id: string) => {
    const res = await fetch(`/api/cod?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete');
    }
    toast.success('Remittance entry deleted');
    triggerRefresh();
  };

  // Listen for sync completion to refresh
  useEffect(() => {
    const handleSyncComplete = () => {
      triggerRefresh();
    };
    window.addEventListener('shopify-sync:complete', handleSyncComplete);
    return () => {
      window.removeEventListener('shopify-sync:complete', handleSyncComplete);
    };
  }, [triggerRefresh]);

  if (!canViewCod) {
    return <AccessDenied message="You do not have permission to view COD collections." />;
  }

  return (
    <div className="space-y-6 relative z-10 w-full max-w-[1920px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/20 flex items-center justify-center text-[#0066cc] dark:text-[#2997ff] shrink-0">
                <HandCoins size={18} />
              </div>
                <h1 className="text-[26px] sm:text-[34px] font-semibold tracking-[-0.374px] text-foreground leading-[1.2]">
                  COD Collections
                </h1>
            </div>
              <p className="text-[14px] sm:text-[15px] text-muted-foreground tracking-[-0.224px]">
                Track Cash on Delivery remittances, reconcile courier payouts, and record collected amounts
              </p>
          </div>

          {/* Header Right Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {canManageCod && (
                <button
                  onClick={handleOpenRecordModal}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-normal text-[14px] sm:text-[15px] tracking-[-0.224px] transition-all cursor-pointer active:scale-95"
                >
                  <Plus size={16} />
                  <span>Record COD Received</span>
                </button>
              )}
              {canExportCod && (
                <CodExportButton
                  remittances={remittances}
                  orders={orders}
                  mode={activeTab}
                />
              )}
              <button
                onClick={triggerRefresh}
                disabled={refreshing || loading}
                className="p-2.5 rounded-full border border-border bg-card text-foreground hover:bg-muted/60 transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                title="Refresh table"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Summary KPI Cards */}
          <CodSummaryCards
            stats={stats}
            timeRangeLabel={
              selectedMonth
                ? selectedMonth
                : timeRange === 'this_month'
                  ? 'This Month'
                  : timeRange === 'last_month'
                    ? 'Last Month'
                    : timeRange === 'last_30_days'
                      ? 'Last 30 Days'
                      : undefined
            }
          />

          {/* Filter and Tab Navigation Toolbar */}
          <CodFilterToolbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
            search={search}
            onSearchChange={setSearch}
            courier={courier}
            onCourierChange={setCourier}
            availableCouriers={availableCouriers}
            remittanceCount={remittances.length}
            ordersCount={orders.length}
          />

          {/* Main Content Area */}
          {loading ? (
            <div className="py-24 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : activeTab === 'remittances' ? (
            <RemittanceHistoryTable
              remittances={remittances}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteRemittance}
              onRecordNew={handleOpenRecordModal}
              canManage={canManageCod}
              canDelete={canDeleteCod}
            />
          ) : (
            <CodOrdersList orders={orders} />
          )}

          {/* Record / Edit Remittance Modal */}
          <RecordRemittanceModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setRemittanceToEdit(null);
            }}
            remittanceToEdit={remittanceToEdit}
            paymentMethods={paymentMethods}
            availableCouriers={availableCouriers}
            onSuccess={triggerRefresh}
          />
        </div>
        );
}
