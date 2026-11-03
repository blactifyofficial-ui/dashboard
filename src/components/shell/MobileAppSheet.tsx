"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  Boxes,
  FileText,
  Megaphone,
  Banknote,
  Handshake,
  Users,
  Settings,
  X,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canAccessRoute } from "@/lib/rbac";
import { authClient } from "@/lib/auth/client";
import { useNetworkStatus } from "@/components/NetworkStatusIndicator";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import toast from "react-hot-toast";

interface MobileAppSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AppTileDef {
  href: string;
  label: string;
  category: string;
  icon: React.ElementType;
}

const SECONDARY_APP_MODULES: AppTileDef[] = [
  { href: "/monthly-expenses", label: "Monthly Bills", category: "Finance", icon: CalendarCheck },
  { href: "/inventory", label: "Inventory", category: "Operations", icon: Boxes },
  { href: "/reports", label: "Monthly Reports", category: "Finance", icon: FileText },
  { href: "/meta-ads", label: "Meta Ads", category: "Growth", icon: Megaphone },
  { href: "/payouts", label: "Partner Payouts", category: "Finance", icon: Banknote },
  { href: "/partners", label: "Partners & Equity", category: "Finance", icon: Handshake },
  { href: "/team", label: "Team & Roles", category: "Admin", icon: Users },
  { href: "/settings", label: "Settings", category: "Admin", icon: Settings },
];

export function MobileAppSheet({ open, onOpenChange }: MobileAppSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, permissions } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Close when pathname changes
  React.useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  // Handle escape key
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleManualSync = async () => {
    if (isSyncing) return;
    if (!isOnline) {
      toast.error("You are currently offline. Please reconnect to sync with Shopify.", { id: "shopify-sync-mobile" });
      return;
    }
    setIsSyncing(true);
    toast.loading("Initiating live Shopify sync...", { id: "shopify-sync-mobile" });
    try {
      const res = await fetch("/api/sync-orders", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || "Orders synced successfully with Shopify", { id: "shopify-sync-mobile" });
      } else {
        toast.error(data.error || "Sync failed", { id: "shopify-sync-mobile" });
      }
    } catch {
      toast.error("Network error triggering sync", { id: "shopify-sync-mobile" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.replace("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
      router.replace("/login");
      router.refresh();
    }
  };

  if (!open) return null;

  const accessibleModules = SECONDARY_APP_MODULES.filter((item) =>
    canAccessRoute(role, item.href, permissions)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="All Apps and Management"
      className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => onOpenChange(false)}
    >
      {/* Slide-up Container */}
      <div
        className="w-full bg-card dark:bg-[#18181b] border-t border-border/80 rounded-t-[28px] max-h-[85dvh] overflow-y-auto px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4 shrink-0" />

        {/* Sheet Header with User Profile */}
        <div className="flex items-center justify-between pb-3.5 mb-2.5 border-b border-border/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/25 text-[#0066cc] dark:text-[#2997ff] font-semibold text-[14px] flex items-center justify-center shrink-0 shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-foreground tracking-tight truncate">
                  {user?.name || "Blactify Admin"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground uppercase">
                  {role || "VIEWER"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate font-mono">
                {user?.email || "admin@blactify.com"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close apps sheet"
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-2">
          {accessibleModules.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-95 ${
                  isActive
                    ? "bg-[#0066cc]/10 border-[#0066cc]/40 text-[#0066cc] dark:text-[#2997ff]"
                    : "bg-muted/40 hover:bg-muted/70 border-border/50 text-foreground"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-[#0066cc] text-white"
                      : "bg-card text-muted-foreground border border-border/50"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[13px] font-medium truncate leading-tight">
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-muted-foreground truncate uppercase font-mono tracking-wider">
                    {item.category}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Utility Controls */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-3">
          {/* Theme Switcher */}
          <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full border border-border/40">
            <ThemeSwitcher className="h-6 w-6 rounded-full" />
            <span className="text-[12px] text-muted-foreground font-medium">Theme</span>
          </div>

          {/* Shopify Live Sync */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted/40 hover:bg-muted/70 border border-border/40 text-[12px] font-medium text-foreground transition-all active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#0066cc]" : "text-muted-foreground"}`} />
            <span>Sync</span>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[12px] font-medium border border-rose-500/20 transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

