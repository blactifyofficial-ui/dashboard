'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const SYNC_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const MIN_RETRY_INTERVAL_MS = 60 * 1000; // 1 minute throttle between syncs

export default function AutoSyncManager() {
  const router = useRouter();
  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef<number>(0);

  const performAutoSync = useCallback(async (reason: string = 'interval') => {
    const now = Date.now();
    // Prevent overlapping syncs and throttle
    if (isSyncingRef.current) return;
    if (now - lastSyncTimeRef.current < MIN_RETRY_INTERVAL_MS) return;

    isSyncingRef.current = true;
    window.dispatchEvent(new CustomEvent('shopify-sync:start', { detail: { reason } }));

    try {
      const res = await fetch('/api/sync-orders', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        lastSyncTimeRef.current = Date.now();
        localStorage.setItem('shopify_last_sync_time', lastSyncTimeRef.current.toString());
        
        window.dispatchEvent(
          new CustomEvent('shopify-sync:complete', {
            detail: { count: data.count, timestamp: lastSyncTimeRef.current, success: true },
          })
        );

        // Smoothly refresh server components with fresh data
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        window.dispatchEvent(
          new CustomEvent('shopify-sync:error', {
            detail: { error: errorData.error || 'Sync failed', timestamp: Date.now() },
          })
        );
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Background auto-sync failed:', errorMsg);
      window.dispatchEvent(
        new CustomEvent('shopify-sync:error', {
          detail: { error: errorMsg || 'Network error', timestamp: Date.now() },
        })
      );
    } finally {
      isSyncingRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    // Check previous sync time from local storage
    const storedLastSync = localStorage.getItem('shopify_last_sync_time');
    if (storedLastSync) {
      lastSyncTimeRef.current = parseInt(storedLastSync, 10) || 0;
    }

    // Initial background sync on mount if needed (only if more than SYNC_INTERVAL_MS has passed)
    const elapsed = Date.now() - lastSyncTimeRef.current;
    if (elapsed > SYNC_INTERVAL_MS) {
      // Delay on startup to let critical page assets and SSR settle first
      const startTimer = setTimeout(() => {
        performAutoSync('startup');
      }, 10000);

      return () => clearTimeout(startTimer);
    }
  }, [performAutoSync]);

  useEffect(() => {
    // Periodic background sync
    const interval = setInterval(() => {
      performAutoSync('interval');
    }, SYNC_INTERVAL_MS);

    // Sync when tab regains focus if enough time has passed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastSyncTimeRef.current;
        if (elapsed > SYNC_INTERVAL_MS) {
          performAutoSync('tab-focus');
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [performAutoSync]);

  // Headless manager component
  return null;
}
