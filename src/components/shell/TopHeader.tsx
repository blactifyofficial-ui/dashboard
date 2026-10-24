"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  RefreshCw,
  LayoutDashboard,
  BarChart3,
  HandCoins,
  Boxes,
  CalendarCheck,
  Wallet,
  Banknote,
  Handshake,
  Megaphone,
  Users,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import { CommandMenu, type CommandItem } from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth/client";
import toast from "react-hot-toast";

const ROUTE_TITLES: Record<string, { title: string; category: string; icon: React.ElementType }> = {
  "/dashboard": { title: "Overview", category: "Core Operations", icon: LayoutDashboard },
  "/revenue": { title: "Revenue Analytics", category: "Core Operations", icon: BarChart3 },
  "/cod": { title: "COD Collection", category: "Core Operations", icon: HandCoins },
  "/inventory": { title: "Inventory & Stock", category: "Core Operations", icon: Boxes },
  "/monthly-expenses": { title: "Monthly Bills", category: "Finance & Capital", icon: CalendarCheck },
  "/expenses": { title: "Expenses Ledger", category: "Finance & Capital", icon: Wallet },
  "/expenses/add": { title: "Record Expense", category: "Finance & Capital", icon: Wallet },
  "/payouts": { title: "Partner Payouts", category: "Finance & Capital", icon: Banknote },
  "/partners": { title: "Partners & Capital", category: "Finance & Capital", icon: Handshake },
  "/meta-ads": { title: "Meta Ads Planning", category: "Growth & Marketing", icon: Megaphone },
  "/team": { title: "Team & Roles", category: "Administration", icon: Users },
  "/settings": { title: "System Settings", category: "Administration", icon: Settings },
};

export function TopHeader({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobile,
}: {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useAuth();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Global ⌘K hotkey listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute breadcrumbs
  const currentRouteMeta = ROUTE_TITLES[pathname] || {
    title: pathname.split("/").filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ") || "Dashboard",
    category: "ERP Portal",
    icon: LayoutDashboard,
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    toast.loading("Initiating live Shopify sync...", { id: "shopify-sync" });
    try {
      const res = await fetch("/api/sync-orders", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(data.message || "Orders synced successfully with Shopify", { id: "shopify-sync" });
      } else {
        toast.error(data.error || "Sync failed", { id: "shopify-sync" });
      }
    } catch {
      toast.error("Network error triggering sync", { id: "shopify-sync" });
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

  // Build command menu items
  const commandItems: CommandItem[] = [
    {
      id: "cmd-overview",
      title: "Overview",
      description: "Sales command center & real-time KPIs",
      category: "Navigation",
      icon: LayoutDashboard,
      shortcut: "G O",
      onSelect: () => router.push("/dashboard"),
    },
    {
      id: "cmd-revenue",
      title: "Revenue",
      description: "Monthly revenue, net profit & product analytics",
      category: "Navigation",
      icon: BarChart3,
      shortcut: "G R",
      onSelect: () => router.push("/revenue"),
    },
    {
      id: "cmd-cod",
      title: "COD Collection",
      description: "Track cash remittances and outstanding orders",
      category: "Navigation",
      icon: HandCoins,
      shortcut: "G C",
      onSelect: () => router.push("/cod"),
    },
    {
      id: "cmd-inventory",
      title: "Inventory & Stock",
      description: "Live Shopify SKU stock and valuation",
      category: "Navigation",
      icon: Boxes,
      shortcut: "G I",
      onSelect: () => router.push("/inventory"),
    },
    {
      id: "cmd-monthly-bills",
      title: "Monthly Bills",
      description: "Recurring operational commitments and bills",
      category: "Navigation",
      icon: CalendarCheck,
      shortcut: "G M",
      onSelect: () => router.push("/monthly-expenses"),
    },
    {
      id: "cmd-expenses",
      title: "Expenses Ledger",
      description: "Operational expenditure, categories & analytics",
      category: "Navigation",
      icon: Wallet,
      shortcut: "G E",
      onSelect: () => router.push("/expenses"),
    },
    {
      id: "cmd-add-expense",
      title: "Record New Expense",
      description: "Submit a new daily operational expense entry",
      category: "Quick Actions",
      icon: Wallet,
      shortcut: "N E",
      onSelect: () => router.push("/expenses/add"),
    },
    {
      id: "cmd-partners",
      title: "Partners & Equity",
      description: "Cap table, equity distribution & partner transactions",
      category: "Navigation",
      icon: Handshake,
      shortcut: "G P",
      onSelect: () => router.push("/partners"),
    },
    {
      id: "cmd-payouts",
      title: "Partner Payouts",
      description: "Record and review partner profit distributions",
      category: "Navigation",
      icon: Banknote,
      onSelect: () => router.push("/payouts"),
    },
    {
      id: "cmd-meta-ads",
      title: "Meta Ads",
      description: "Daily campaign budget calendar & planner",
      category: "Navigation",
      icon: Megaphone,
      shortcut: "G A",
      onSelect: () => router.push("/meta-ads"),
    },
    {
      id: "cmd-team",
      title: "Team & Roles",
      description: "Manage users, access permissions & partner scoping",
      category: "Navigation",
      icon: Users,
      shortcut: "G T",
      onSelect: () => router.push("/team"),
    },
    {
      id: "cmd-settings",
      title: "System Settings",
      description: "Google Sheets backup, manual sync & preferences",
      category: "Navigation",
      icon: Settings,
      shortcut: "G S",
      onSelect: () => router.push("/settings"),
    },
    {
      id: "cmd-sync",
      title: "Trigger Shopify Sync",
      description: "Pull latest orders, items, and webhooks from Shopify",
      category: "Quick Actions",
      icon: RefreshCw,
      onSelect: handleManualSync,
    },
  ];

  return (
    <>
      <header className="h-13 shrink-0 border-b border-border bg-card/95 backdrop-blur-xs px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
        {/* Left: Sidebar Toggles & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onOpenMobile}
            aria-label="Open sidebar menu"
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Desktop sidebar rail toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors hidden sm:inline"
            >
              Blactify ERP
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 hidden sm:inline shrink-0" />
            <span className="text-muted-foreground/70 hidden sm:inline truncate">
              {currentRouteMeta.category}
            </span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 hidden sm:inline shrink-0" />
            <span className="font-semibold text-foreground truncate">
              {currentRouteMeta.title}
            </span>
          </div>
        </div>

        {/* Right: Search / Actions / Theme / User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Global Search Bar (Trigger ⌘K) */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Search or type a command"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg bg-muted/60 border border-border/80 text-muted-foreground hover:text-foreground hover:border-border transition-colors w-40 md:w-56 justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Search commands...</span>
            </div>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70 bg-card border border-border/70 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search button */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Open command palette"
            className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Shopify Live Sync Status / Trigger */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            title="Click to trigger manual Shopify order sync"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden md:inline">Shopify</span>
            <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-primary" : ""}`} />
          </button>

          {/* Theme Switcher */}
          <ThemeSwitcher className="h-8 w-8 rounded-lg" />

          {/* User Account Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="User account menu"
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring border border-border/60"
            >
              <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="right" className="w-56 p-1.5">
              <DropdownMenuLabel className="pb-1.5">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-xs truncate">
                    {user?.name || "Blactify Admin"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono truncate font-normal">
                    {user?.email || "admin@blactify.com"}
                  </span>
                </div>
                <div className="mt-1.5">
                  <Badge variant="neutral" size="xs">
                    {role || "VIEWER"}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push("/settings")}>
                <Settings className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push("/team")}>
                <Users className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
                <span>Team & Permissions</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="text-destructive hover:bg-destructive/10 dark:text-red-400"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        items={commandItems}
      />
    </>
  );
}
