"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerSnapshot() {
  return true;
}

export function useNetworkStatus() {
  const isOnline = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Trigger toast notification on transitions (only after initial mount)
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isOnline) {
      toast.custom(
        (t) => (
          <div
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-xl text-foreground text-[13px] font-normal tracking-[-0.12px] transition-all",
              t.visible ? "animate-in fade-in duration-200" : "animate-out fade-out duration-150"
            )}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Internet connection restored</span>
          </div>
        ),
        { id: "offline-status-toast", duration: 3500 }
      );
    } else {
      toast.custom(
        (t) => (
          <div
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-xl text-foreground text-[13px] font-normal tracking-[-0.12px] transition-all",
              t.visible ? "animate-in fade-in duration-200" : "animate-out fade-out duration-150"
            )}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>You are offline. Live sync paused.</span>
          </div>
        ),
        { id: "offline-status-toast", duration: 5000 }
      );
    }
  }, [isOnline]);

  return { isOnline };
}

export function NetworkStatusBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-card/90 backdrop-blur-md text-foreground text-xs font-medium shadow-2xl animate-in slide-in-from-bottom-2 duration-200 select-none border border-amber-500/30"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <span>Offline Mode — Viewing cached data</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        title="Check connection"
        aria-label="Check connection"
        className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
