"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { WifiOff, RefreshCw, LayoutDashboard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNetworkStatus } from "@/components/NetworkStatusIndicator";

export default function OfflinePage() {
  const [isChecking, setIsChecking] = React.useState(false);
  const { isOnline } = useNetworkStatus();

  // Automatically refresh when connection is restored
  React.useEffect(() => {
    if (isOnline) {
      window.location.reload();
    }
  }, [isOnline]);

  const handleRetry = () => {
    setIsChecking(true);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      window.location.reload();
      return;
    }
    // Ping to check connection
    fetch("/api/auth/me", { method: "HEAD", cache: "no-store" })
      .then(() => {
        window.location.reload();
      })
      .catch(() => {
        setIsChecking(false);
      });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background text-foreground select-none">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-card border border-border flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#0066cc]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Logo */}
        <div className="mb-6">
          <Image
            src="/blactify_logo_font.svg"
            alt="Blactify"
            width={140}
            height={24}
            className="h-6 w-auto object-contain hidden dark:block"
            style={{ width: "auto" }}
            priority
          />
          <Image
            src="/blactify_logo_dark.svg"
            alt="Blactify"
            width={140}
            height={24}
            className="h-6 w-auto object-contain block dark:hidden"
            style={{ width: "auto" }}
            priority
          />
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
          <WifiOff className="w-8 h-8" />
        </div>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 text-foreground">
          You are currently offline
        </h1>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Blactify Dashboard requires an active network connection to fetch live orders, Shopify webhooks, and record new financial entries.
        </p>

        {/* Status Chip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground font-mono mb-6">
          {isOnline ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Connection restored</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>Waiting for connection...</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full sm:flex-1 h-10 rounded-full bg-[#0066cc] hover:bg-[#0055b3] text-white gap-2 font-medium active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            <span>{isChecking ? "Checking..." : "Retry Connection"}</span>
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-10 rounded-full border-border text-foreground hover:bg-muted gap-2 active:scale-95 transition-transform"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Cached View</span>
            </Button>
          </Link>
        </div>

        {/* Help footer */}
        <div className="mt-6 pt-4 border-t border-border/60 w-full text-[11px] text-muted-foreground/80 flex items-center justify-between">
          <span>PWA Standalone</span>
          <span>Blactify Enterprise</span>
        </div>
      </div>
    </div>
  );
}
