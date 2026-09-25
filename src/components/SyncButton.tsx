'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Syncing orders and products from Shopify...');
    
    try {
      const res = await fetch('/api/sync-orders', { method: 'GET' });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Successfully synced from Shopify!', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to sync.', { id: toastId });
      }
    } catch {
      toast.error('An error occurred during sync.', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
      {isSyncing ? 'Syncing...' : 'Sync Orders & Products Now'}
    </button>
  );
}
