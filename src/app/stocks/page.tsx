'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Inbox, Plus } from 'lucide-react';

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

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    fetch('/api/stocks')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStocks(data);
        } else {
          console.error("API Error:", data);
          setStocks([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="space-y-12 relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Stock Management</h1>
          <p className="text-neutral-400 text-sm md:text-base">Manage your inventory and stock levels</p>
        </div>
        {isMobile && (
          <Link href="/stocks/new" className="inline-flex items-center justify-center px-6 py-3 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all backdrop-blur-sm gap-2">
            <Plus size={16} />
            <span>Add Stock</span>
          </Link>
        )}
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-neutral-400">Loading stock...</div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
          <div className="p-4 md:px-8 md:py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <h2 className="text-xl font-semibold text-white tracking-tight">Stock Log</h2>
          </div>
          
          <div className="relative z-10 w-full overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="text-xs text-neutral-400 uppercase tracking-wider bg-white/[0.01] border-b border-white/5">
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
                        {isMobile && (
                          <Link href="/stocks/new" className="mt-4 inline-flex items-center justify-center px-5 py-2 border border-white/10 bg-white/5 text-white rounded-xl hover:bg-white/10 text-sm font-medium transition-all backdrop-blur-sm">
                            Add Stock
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  stocks.map(stock => (
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
                          <button className="px-3 py-1.5 border border-white/10 bg-white/5 text-white rounded-lg hover:bg-white/10 text-xs font-medium transition-all backdrop-blur-sm">Edit</button>
                          <button 
                            onClick={async () => {
                              if(confirm("Delete Stock? This action cannot be undone.")) {
                                const res = await fetch(`/api/stocks/${stock.id}`, { method: 'DELETE' });
                                if (res.ok) setStocks(stocks.filter(s => s.id !== stock.id));
                                else alert("Failed to delete stock");
                              }
                            }} 
                            className="px-3 py-1.5 border border-red-500/20 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-xs font-medium transition-all backdrop-blur-sm"
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
      )}
    </div>
  );
}
