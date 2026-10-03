'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

function formatTimeAgo(timestamp: number | null): string {
  if (!timestamp) {
    return 'Never during this session';
  }
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) {
    return 'Just now';
  } else if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  } else {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
}

export default function SyncButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>('');
  const lastTimeRef = useRef<number | null>(null);

  const refreshTimeDisplay = useCallback(() => {
    setTimeAgo(formatTimeAgo(lastTimeRef.current));
  }, []);

  useEffect(() => {
    // Load last sync time from localStorage
    const stored = localStorage.getItem('shopify_last_sync_time');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        lastTimeRef.current = parsed;
      }
    }

    const timer = setTimeout(() => {
      refreshTimeDisplay();
    }, 0);

    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncComplete = (e: Event) => {
      setIsSyncing(false);
      const customEvent = e as CustomEvent<{ count?: number; timestamp?: number }>;
      const ts = customEvent.detail?.timestamp || Date.now();
      lastTimeRef.current = ts;
      refreshTimeDisplay();
    };
    const handleSyncError = () => setIsSyncing(false);

    window.addEventListener('shopify-sync:start', handleSyncStart);
    window.addEventListener('shopify-sync:complete', handleSyncComplete);
    window.addEventListener('shopify-sync:error', handleSyncError);

    const interval = setInterval(() => {
      refreshTimeDisplay();
    }, 15000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('shopify-sync:start', handleSyncStart);
      window.removeEventListener('shopify-sync:complete', handleSyncComplete);
      window.removeEventListener('shopify-sync:error', handleSyncError);
      clearInterval(interval);
    };
  }, [refreshTimeDisplay]);

  const handleSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading('Syncing orders and products from Shopify...');

    try {
      const res = await fetch('/api/sync-orders', { method: 'GET' });
      const data = await res.json();

      if (res.ok) {
        const now = Date.now();
        lastTimeRef.current = now;
        localStorage.setItem('shopify_last_sync_time', now.toString());
        refreshTimeDisplay();
        toast.success(data.message || `Successfully synced ${data.count ?? ''} orders from Shopify!`, { id: toastId });
        router.refresh();
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
    <div className="space-y-3 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 min-h-[44px] rounded-xl font-semibold text-sm hover:bg-neutral-200 active:bg-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <RefreshCw size={18} className={`shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing Orders...' : 'Sync Orders & Products Now'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-neutral-300 font-medium">Auto-sync active</span>
          <span className="text-neutral-500">•</span>
          <span className="flex items-center gap-1 text-neutral-400">
            <Clock size={12} />
            {timeAgo || 'Checking...'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-400 bg-white/[0.03] border border-white/5 px-3 py-2 rounded-lg">
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
        <span>
          Orders automatically sync in the background on page load and every 3 minutes while the dashboard is open.
        </span>
      </div>
    </div>
  );
}
