'use client';
import { useState, useEffect } from 'react';
import { Inbox, Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface InventoryItem {
  id: string;
  title: string;
  inventoryQuantity: string;
  imageUrl: string | null;
  sku: string | null;
  price: string | null;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const pageSize = 15;

  const fetchInventory = (currentPage: number = page, currentSearch: string = search, currentStatus: string = statusFilter) => {
    setIsFetching(true);
    fetch(`/api/inventory?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(currentSearch)}&status=${encodeURIComponent(currentStatus)}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setItems(data.data);
          setTotalPages(data.pagination.totalPages);
        } else if (Array.isArray(data)) {
          setItems(data);
        } else {
          console.error("API Error:", data);
        }
        setInvLoading(false);
        setIsFetching(false);
      })
      .catch(err => {
        console.error(err);
        setInvLoading(false);
        setIsFetching(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInventory(page, search, statusFilter);

    const interval = setInterval(() => {
      fetchInventory(page, search, statusFilter);
    }, 10000);
      
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

  return (
    <div className="flex flex-col h-full space-y-6 relative z-10">
      <header className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Live Inventory</h1>
          <p className="text-neutral-400 text-sm md:text-base">Manage your live inventory records</p>
        </div>
      </header>

      <InventoryTab 
        items={items} 
        loading={invLoading} 
        isFetching={isFetching}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
      />
    </div>
  );
}

function InventoryTab({ items, loading, isFetching, search, setSearch, statusFilter, setStatusFilter, page, setPage, totalPages }: { items: InventoryItem[], loading: boolean, isFetching: boolean, search: string, setSearch: (s: string) => void, statusFilter: string, setStatusFilter: (s: string) => void, page: number, setPage: (p: number | ((prev: number) => number)) => void, totalPages: number }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
      <div className="flex-none p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 bg-black/50">
        <h2 className="text-xl font-semibold text-white tracking-tight">Current Inventory</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none pr-10 relative cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255, 255, 255, 0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1em 1em'
            }}
          >
            <option value="All" className="bg-neutral-900">All Status</option>
            <option value="In Stock" className="bg-neutral-900">In Stock</option>
            <option value="Low Stock" className="bg-neutral-900">Low Stock</option>
            <option value="Out of Stock" className="bg-neutral-900">Out of Stock</option>
          </select>
        </div>
      </div>
      
      
      <div className={`flex-1 min-h-0 relative z-10 w-full overflow-auto no-scrollbar transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <table className="w-full text-sm text-left min-w-[900px]">
          <thead className="sticky top-0 text-xs text-neutral-400 uppercase tracking-wider bg-neutral-950/80 backdrop-blur-md border-b border-white/5 z-20 shadow-sm">
            <tr>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Image</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Product</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Available Stock</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 md:px-8 py-10 md:py-20 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
                      <Inbox size={32} className="text-white/50"/>
                    </div>
                    <p className="text-lg font-medium text-white/80">No inventory records found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item: InventoryItem) => {
                const count = Number(item.inventoryQuantity);
                const statusColor = count > 10 ? 'text-green-400' : count > 0 ? 'text-yellow-400' : 'text-red-400';
                const statusText = count > 10 ? 'In Stock' : count > 0 ? 'Low Stock' : 'Out of Stock';

                return (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors duration-200 group">
                    <td className="px-4 md:px-8 py-4 md:py-5">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.imageUrl} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-sm" alt="Stock" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xs text-neutral-500 shadow-inner">No Img</div>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-white group-hover:text-neutral-300 transition-colors">
                      {item.title} {item.sku ? <span className="text-neutral-500 text-xs ml-2">({item.sku})</span> : ''}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5 text-right font-medium text-white text-lg">
                      {item.inventoryQuantity}
                    </td>
                    <td className={`px-4 md:px-8 py-4 md:py-5 text-right font-semibold ${statusColor}`}>
                      {statusText}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex-none p-4 md:px-8 py-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <div className="text-neutral-400">
          Page {page} of {totalPages || 1}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 text-white rounded-lg transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 text-white rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
