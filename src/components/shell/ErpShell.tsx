"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  HandCoins,
  Boxes,
  CalendarCheck,
  FileText,
  Wallet,
  Banknote,
  Handshake,
  ArrowLeftRight,
  Megaphone,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canAccessRoute } from "@/lib/rbac";
import { TopHeader } from "./TopHeader";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomDock } from "./MobileBottomDock";
import { MobileAppSheet } from "./MobileAppSheet";
import { Tooltip } from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { NetworkStatusBanner } from "@/components/NetworkStatusIndicator";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";

interface NavItemDef {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    title: "Core Operations",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/revenue", label: "Revenue", icon: BarChart3 },
      { href: "/cod", label: "COD Collection", icon: HandCoins },
      { href: "/inventory", label: "Inventory & Stock", icon: Boxes },
    ],
  },
  {
    title: "Finance & Capital",
    items: [
      { href: "/reports", label: "Monthly Reports", icon: FileText },
      { href: "/monthly-expenses", label: "Monthly Bills", icon: CalendarCheck },
      { href: "/expenses", label: "Daily Expenses", icon: Wallet },
      { href: "/debts", label: "Borrow & Lend", icon: ArrowLeftRight },
      { href: "/payouts", label: "Partner Payouts", icon: Banknote },
      { href: "/partners", label: "Partners & Equity", icon: Handshake },
    ],
  },
  {
    title: "Growth",
    items: [
      { href: "/meta-ads", label: "Meta Ads", icon: Megaphone },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/team", label: "Team & Roles", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function ErpShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, permissions } = useAuth();

  // Desktop hover-to-expand state (Desktop Only)
  const [isHovered, setIsHovered] = React.useState(false);
  // Mobile slide-up app sheet state (Mobile Only)
  const [isAppSheetOpen, setIsAppSheetOpen] = React.useState(false);

  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 120);
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

  const isExpanded = isHovered;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {/* Desktop Layout Rail Spacer (reserves space for sidebar so page content never jumps) */}
      <div className="hidden md:block w-16 shrink-0" />

      {/* Desktop Sidebar Navigation (100% Unchanged for Big Screens, hidden on mobile) */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "hidden md:flex fixed top-0 left-0 h-[100dvh] z-50 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out",
          isExpanded ? "md:w-60 sidebar-float-shadow" : "md:w-16"
        )}
      >
        {/* Sidebar Brand Header */}
        <div className="h-13 shrink-0 px-3.5 border-b border-sidebar-border flex items-center justify-between overflow-hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden min-w-0"
          >
            {isExpanded ? (
              <div className="flex items-center gap-2 min-w-0 animate-in fade-in duration-200">
                <Image
                  src="/blactify_logo_font.svg"
                  alt="Blactify"
                  width={210}
                  height={22}
                  className="h-5.5 w-auto object-contain hidden dark:block"
                  style={{ width: "auto" }}
                  priority
                />
                <Image
                  src="/blactify_logo_dark.svg"
                  alt="Blactify"
                  width={210}
                  height={22}
                  className="h-5.5 w-auto object-contain block dark:hidden"
                  style={{ width: "auto" }}
                  priority
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 mx-auto">
                <Image
                  src="/icon.png"
                  alt="Blactify"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-lg object-contain"
                  priority
                />
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 p-2 space-y-3 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_GROUPS.map((group, gIdx) => {
            const filteredItems = group.items.filter((item) =>
              canAccessRoute(role, item.href, permissions)
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-0.5">
                {isExpanded ? (
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-sidebar-muted-foreground uppercase block truncate animate-in fade-in duration-150">
                    {group.title}
                  </span>
                ) : (
                  gIdx > 0 && <div className="my-2 mx-auto w-6 border-t border-sidebar-border/60" />
                )}

                {
                  filteredItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        item.href !== "/" &&
                        pathname.startsWith(item.href + "/"));
                    const Icon = item.icon;

                    const navContent = (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center rounded-full text-[13px] sm:text-[14px] font-normal transition-all duration-150 select-none active:scale-95 tracking-[-0.224px]",
                          isExpanded
                            ? "gap-2.5 px-3 py-2 min-h-[36px] w-full"
                            : "justify-center p-2 h-9 w-9 mx-auto",
                          isActive
                            ? "bg-[#0066cc] text-white font-normal"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isActive
                              ? "text-white"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                          strokeWidth={1.75}
                        />
                        {isExpanded && (
                          <span className="truncate whitespace-nowrap animate-in fade-in duration-150">
                            {item.label}
                          </span>
                        )}
                        {isExpanded && item.badge && (
                          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );

                    if (!isExpanded) {
                      return (
                        <Tooltip
                          key={item.href}
                          content={item.label}
                          position="right"
                        >
                          {navContent}
                        </Tooltip>
                      );
                    }

                    return navContent;
                  })}
              </div>
            );
          })}
        </nav>

        {/* Footer Actions: Theme & Sign Out */}
        <div className="p-2 border-t border-sidebar-border bg-sidebar shrink-0 overflow-hidden">
          {!isExpanded ? (
            <div className="flex flex-col items-center gap-1.5">
              <ThemeSwitcher className="h-8 w-8 rounded-full" />
              <Tooltip content="Log out" position="right">
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Log out"
                  className="w-9 h-9 mx-auto flex items-center justify-center rounded-full text-muted-foreground hover:text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center justify-between p-1.5 px-3 rounded-full bg-card/70 border border-border animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <ThemeSwitcher className="h-7 w-7 rounded-full" />
                <span className="text-[12px] text-muted-foreground font-normal">Theme</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                title="Log out"
                aria-label="Log out"
                className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[12px] text-muted-foreground hover:text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors active:scale-95"
              >
                <span>Log out</span>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

        {/* Main Workspace Frame */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
          {/* Mobile Gradient Top Header (Floating, unboxed, seamless scroll) */}
          <MobileHeader />

          {/* Desktop Top Header (100% Unchanged on Desktop, hidden on mobile) */}
          <TopHeader />

          {/* Dynamic Page Content */}
            <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 2xl:px-10 pt-[max(4.25rem,calc(env(safe-area-inset-top)+2.75rem))] md:pt-6 pb-28 md:pb-8 overflow-y-auto overflow-x-hidden">
              <div className="mx-auto w-full max-w-[1920px]">
                {children}
              </div>
            </main>
        </div>

        {/* Mobile Floating Bottom Navigation Dock */}
        <MobileBottomDock
          onOpenMore={() => setIsAppSheetOpen(true)}
          isMoreOpen={isAppSheetOpen}
        />

        {/* Mobile Slide-up App Sheet for Secondary Modules */}
        <MobileAppSheet
          open={isAppSheetOpen}
          onOpenChange={setIsAppSheetOpen}
        />

        {/* Floating Offline Notification Banner */}
        <NetworkStatusBanner />
      </div >
      );
}
