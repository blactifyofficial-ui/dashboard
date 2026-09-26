'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  
  useEffect(() => {
    fetch('/api/stocks')
      .then(res => res.json())
      .then(data => {
        setStocks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Stock Management</h1>
        <Link href="/stocks/new" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium">
          Add Stock
        </Link>
      </div>

      {loading ? (
        <p className="text-neutral-400">Loading stock...</p>
      ) : stocks.length === 0 ? (
        <div className="text-center bg-neutral-800 p-12 rounded-lg border border-neutral-700">
          <p className="text-xl mb-4">No stock records found.</p>
          <Link href="/stocks/new" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium inline-block">
            Add Stock
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-neutral-800 rounded-lg border border-neutral-700">
          <table className="w-full text-left">
            <thead className="bg-neutral-900 border-b border-neutral-700">
              <tr>
                <th className="p-4 font-semibold text-sm">Image</th>
                <th className="p-4 font-semibold text-sm">Product</th>
                <th className="p-4 font-semibold text-sm text-right">Buying Price</th>
                <th className="p-4 font-semibold text-sm text-right">Stock</th>
                <th className="p-4 font-semibold text-sm text-right">Selling Price</th>
                <th className="p-4 font-semibold text-sm text-right">Purchase Amount</th>
                <th className="p-4 font-semibold text-sm text-right">Expected Return</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(stock => (
                <tr key={stock.id} className="border-b border-neutral-700 hover:bg-neutral-800/50">
                  <td className="p-4">
                    {stock.productImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={stock.productImage} className="w-12 h-12 rounded object-cover" alt="Stock" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-neutral-700 flex items-center justify-center text-xs text-neutral-500">No Img</div>
                    )}
                  </td>
                  <td className="p-4">{stock.productId || '-'}</td>
                  <td className="p-4 text-right">₹{Number(stock.buyingPrice).toFixed(2)}</td>
                  <td className="p-4 text-right">{stock.stockCount}</td>
                  <td className="p-4 text-right">₹{Number(stock.sellingPrice).toFixed(2)}</td>
                  <td className="p-4 text-right text-neutral-400">₹{Number(stock.totalPurchaseAmount).toFixed(2)}</td>
                  <td className="p-4 text-right text-green-400">₹{Number(stock.expectedReturn).toFixed(2)}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {/* Placeholder for View/Edit routes */}
                    <button className="bg-neutral-700 hover:bg-neutral-600 px-3 py-1 rounded text-xs font-medium">Edit</button>
                    <button 
                      onClick={async () => {
                        if(confirm("Delete Stock? This action cannot be undone.")) {
                          const res = await fetch(`/api/stocks/${stock.id}`, { method: 'DELETE' });
                          if (res.ok) setStocks(stocks.filter(s => s.id !== stock.id));
                          else alert("Failed to delete stock");
                        }
                      }} 
                      className="bg-red-600/80 hover:bg-red-600 px-3 py-1 rounded text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
