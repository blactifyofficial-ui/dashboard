"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
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
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
import { useNetworkStatus } from "@/components/NetworkStatusIndicator";
import toast from "react-hot-toast";

  export function TopHeader() {
    const router = useRouter();
    const { user, role } = useAuth();
    const { isOnline } = useNetworkStatus();
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

    const handleManualSync = async () => {
      if (isSyncing) return;
      if (!isOnline) {
        toast.error("You are currently offline. Please reconnect to sync with Shopify.", { id: "shopify-sync" });
        return;
      }
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
        <header className="hidden md:flex h-[52px] shrink-0 border-b border-border bg-card/85 backdrop-blur-md px-3 sm:px-6 items-center justify-between sticky top-0 z-30 transition-colors">
          {/* Right: User Profile Menu */}
          <div className="ml-auto flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="User account menu"
                className="flex items-center gap-2 p-0.5 rounded-full hover:bg-muted transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring border border-border"
              >
                <div className="w-[34px] h-[34px] rounded-full bg-[#0066cc]/10 border border-[#0066cc]/20 text-[#0066cc] dark:text-[#2997ff] font-semibold text-[13px] flex items-center justify-center shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "A"}
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="right" className="w-56 p-1.5">
                <DropdownMenuLabel className="pb-1.5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-[13px] tracking-[-0.12px] truncate">
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
                  className="text-[#ff453a] hover:bg-[#ff453a]/10"
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
