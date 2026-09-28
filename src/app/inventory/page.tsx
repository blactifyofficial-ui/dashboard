'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Inbox, Plus, Search, Archive, Package, GitCompare } from 'lucide-react';

interface InventoryItem {
  id: string;
  title: string;
  inventoryQuantity: string;
  imageUrl: string | null;
  sku: string | null;
  price: string | null;
}

interface Stock {
  id: string;
  productImage: string | null;
  buyingPrice: string;
  sellingPrice: string;
  stockCount: string;
  totalPurchaseAmount: string;
  expectedReturn: string;
  productId: string | null;
}

export default function CombinedInventoryStocksPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'stocks' | 'compare'>('inventory');
  
  // Inventory State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const pageSize = 15;

  // Stocks State
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchInventory = (currentPage: number = page, currentSearch: string = search, currentStatus: string = statusFilter) => {
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
      })
      .catch(err => {
        console.error(err);
        setInvLoading(false);
      });
  };

  const fetchStocks = () => {
    fetch('/api/stocks')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStocks(data);
        } else {
          setStocks([]);
        }
        setStocksLoading(false);
      })
      .catch(err => {
        console.error(err);
        setStocksLoading(false);
      });
  };

  useEffect(() => {
    // Initial fetch
    fetchInventory(page, search, statusFilter);
    fetchStocks();

    // Polling every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchInventory(page, search, statusFilter);
      fetchStocks();
    }, 10000);
      
    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

  return (
    <div className="flex flex-col h-full space-y-6 relative z-10">
      <header className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Inventory & Stocks</h1>
          <p className="text-neutral-400 text-sm md:text-base">Manage and compare live inventory with stock records</p>
        </div>
        {activeTab === 'stocks' && (
          <Link href="/stocks/new" className="inline-flex items-center justify-center px-6 py-3 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all gap-2 w-full md:w-auto">
            <Plus size={16} />
            <span>Add Stock</span>
          </Link>
        )}
      </header>

      {/* Tabs */}
      <div className="flex-none flex bg-white/5 border border-white/10 p-1 rounded-2xl w-fit mb-4 overflow-x-auto max-w-full hide-scrollbar">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
        >
          <Archive size={16} />
          Live Inventory
        </button>
        <button 
          onClick={() => setActiveTab('stocks')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'stocks' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
        >
          <Package size={16} />
          Stock Log
        </button>
        <button 
          onClick={() => setActiveTab('compare')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'compare' ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
        >
          <GitCompare size={16} />
          Compare
        </button>
      </div>

      {activeTab === 'inventory' && (
        <InventoryTab 
          items={items} 
          loading={invLoading} 
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
        />
      )}

      {activeTab === 'stocks' && (
        <StocksTab 
          stocks={stocks} 
          loading={stocksLoading} 
          setStocks={setStocks}
          deletingId={deletingId}
          setDeletingId={setDeletingId}
        />
      )}

      {activeTab === 'compare' && (
        <CompareTab 
          items={items}
          stocks={stocks}
          loading={invLoading || stocksLoading}
        />
      )}
    </div>
  );
}


function InventoryTab({ items, loading, search, setSearch, statusFilter, setStatusFilter, page, setPage, totalPages }: { items: InventoryItem[], loading: boolean, search: string, setSearch: (s: string) => void, statusFilter: string, setStatusFilter: (s: string) => void, page: number, setPage: (p: number | ((prev: number) => number)) => void, totalPages: number }) {
  if (loading) return <div className="flex items-center justify-center py-20 text-neutral-400">Loading inventory...</div>;

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
      
      <div className="flex-1 min-h-0 relative z-10 w-full overflow-auto no-scrollbar">
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

function StocksTab({ stocks, loading, setStocks, deletingId, setDeletingId }: { stocks: Stock[], loading: boolean, setStocks: (s: Stock[]) => void, deletingId: string | null, setDeletingId: (id: string | null) => void }) {
  if (loading) return <div className="flex items-center justify-center py-20 text-neutral-400">Loading stock...</div>;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
      <div className="flex-none p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 bg-black/50">
        <h2 className="text-xl font-semibold text-white tracking-tight">Stock Log</h2>
      </div>
      
      <div className="flex-1 min-h-0 relative z-10 w-full overflow-auto no-scrollbar">
        <table className="w-full text-sm text-left min-w-[900px]">
          <thead className="sticky top-0 text-xs text-neutral-400 uppercase tracking-wider bg-neutral-950/80 backdrop-blur-md border-b border-white/5 z-20 shadow-sm">
            <tr>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Image</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Product</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Buying Price</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Stock</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Selling Price</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Purchase Amount</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Expected Return</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {stocks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 md:px-8 py-10 md:py-20 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 shadow-inner border border-white/5">
                      <Inbox size={32} className="text-white/50"/>
                    </div>
                    <p className="text-lg font-medium text-white/80">No stock records found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              stocks.map((stock: Stock) => (
                <tr key={stock.id} className="hover:bg-white/[0.03] transition-colors duration-200 group">
                  <td className="px-4 md:px-8 py-4 md:py-5">
                    {stock.productImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={stock.productImage} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-sm" alt="Stock" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xs text-neutral-500 shadow-inner">No Img</div>
                    )}
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-white group-hover:text-neutral-300 transition-colors">
                    {stock.productId || '-'}
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-right font-medium text-white">₹{Number(stock.buyingPrice).toFixed(2)}</td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-right text-neutral-300">{stock.stockCount}</td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-right text-neutral-300">₹{Number(stock.sellingPrice).toFixed(2)}</td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-right text-neutral-400">₹{Number(stock.totalPurchaseAmount).toFixed(2)}</td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-right font-semibold text-green-400">₹{Number(stock.expectedReturn).toFixed(2)}</td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1.5 border border-white/10 bg-white/5 text-white rounded-lg hover:bg-white/10 text-xs font-medium transition-all ">Edit</button>
                      <button 
                        disabled={deletingId === stock.id}
                        onClick={async () => {
                          if (deletingId) return;
                          if(confirm("Delete Stock? This action cannot be undone.")) {
                            setDeletingId(stock.id);
                            try {
                              const res = await fetch(`/api/stocks/${stock.id}`, { method: 'DELETE' });
                              if (res.ok) setStocks(stocks.filter((s: Stock) => s.id !== stock.id));
                              else alert("Failed to delete stock");
                            } finally {
                              setDeletingId(null);
                            }
                          }
                        }} 
                        className="px-3 py-1.5 border border-red-500/20 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function CompareTab({ items, stocks, loading }: { items: InventoryItem[], stocks: Stock[], loading: boolean }) {
  if (loading) return <div className="flex items-center justify-center py-20 text-neutral-400">Loading comparison...</div>;

  const comparisonMap = new Map();
  
  items.forEach((item: InventoryItem) => {
    comparisonMap.set(item.title, {
      title: item.title,
      imageUrl: item.imageUrl,
      liveQuantity: Number(item.inventoryQuantity),
      loggedQuantity: 0
    });
  });

  stocks.forEach((stock: Stock) => {
    const title = stock.productId || 'Unknown';
    if (comparisonMap.has(title)) {
      comparisonMap.get(title).loggedQuantity += Number(stock.stockCount);
    } else {
      comparisonMap.set(title, {
        title,
        imageUrl: stock.productImage,
        liveQuantity: 0,
        loggedQuantity: Number(stock.stockCount)
      });
    }
  });

  const comparisonData = Array.from(comparisonMap.values());

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
      <div className="flex-none p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 bg-black/50">
        <h2 className="text-xl font-semibold text-white tracking-tight">Stock vs Live Inventory Comparison</h2>
      </div>
      
      <div className="flex-1 min-h-0 relative z-10 w-full overflow-auto no-scrollbar">
        <table className="w-full text-sm text-left min-w-[700px]">
          <thead className="sticky top-0 text-xs text-neutral-400 uppercase tracking-wider bg-neutral-950/80 backdrop-blur-md border-b border-white/5 z-20 shadow-sm">
            <tr>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Image</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold">Product</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Logged Stock (History)</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Live Inventory (Shopify)</th>
              <th className="px-4 md:px-8 py-4 md:py-5 font-semibold text-right">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {comparisonData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 md:px-8 py-10 md:py-20 text-center text-neutral-400">
                  No data to compare.
                </td>
              </tr>
            ) : (
              comparisonData.map((row: { imageUrl: string, title: string, loggedQuantity: number, liveQuantity: number }, idx: number) => {
                const difference = row.liveQuantity - row.loggedQuantity;
                let diffColor = 'text-white';
                if (difference > 0) diffColor = 'text-green-400';
                else if (difference < 0) diffColor = 'text-red-400';
                
                return (
                  <tr key={idx} className="hover:bg-white/[0.03] transition-colors duration-200 group">
                    <td className="px-4 md:px-8 py-4 md:py-5">
                      {row.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={row.imageUrl} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-sm" alt="Product" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xs text-neutral-500 shadow-inner">No Img</div>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-white">
                      {row.title}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5 text-right text-neutral-300">
                      {row.loggedQuantity}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-5 text-right font-medium text-white text-lg">
                      {row.liveQuantity}
                    </td>
                    <td className={`px-4 md:px-8 py-4 md:py-5 text-right font-semibold ${diffColor}`}>
                      {difference > 0 ? `+${difference}` : difference}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
