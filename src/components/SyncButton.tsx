'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          loading={isSyncing}
          className="w-full sm:w-auto h-[44px] px-7 rounded-full font-normal text-[15px] sm:text-[17px] tracking-[-0.374px] gap-2"
        >
          {!isSyncing && <RefreshCw size={16} className="shrink-0" />}
          <span>{isSyncing ? 'Syncing Orders...' : 'Sync Orders & Products Now'}</span>
        </Button>

          <div className="flex items-center gap-2 text-[12px] text-muted-foreground tracking-[-0.1px]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0066cc] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0066cc]"></span>
            </span>
            <span className="text-foreground font-semibold">Auto-sync active</span>
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock size={12} />
              {timeAgo || 'Checking...'}
            </span>
          </div>
        </div>

          <div className="flex items-center gap-2.5 text-[12px] sm:text-[13px] text-muted-foreground bg-muted/40 border border-border px-4 py-2.5 rounded-full">
            <CheckCircle2 size={15} className="text-[#0066cc] dark:text-[#2997ff] shrink-0" />
            <span>
              Orders automatically sync in the background on page load and every 3 minutes while the dashboard is open.
            </span>
          </div>
        </div>
        );
}
