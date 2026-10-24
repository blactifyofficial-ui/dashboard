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
  Wallet,
  Banknote,
  Handshake,
  Megaphone,
  Users,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canAccessRoute } from "@/lib/rbac";
import { TopHeader } from "./TopHeader";
import { Tooltip } from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

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
      { href: "/monthly-expenses", label: "Monthly Bills", icon: CalendarCheck },
      { href: "/expenses", label: "Daily Expenses", icon: Wallet },
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
  const { user, role, permissions } = useAuth();

  // Desktop sidebar collapsed state (stored in localStorage)
  const [collapsed, setCollapsed] = React.useState(false);
  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Load saved preference
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("blactify_erp_sidebar_collapsed");
      if (saved !== null) {
        requestAnimationFrame(() => {
          setCollapsed(saved === "true");
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("blactify_erp_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
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

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-[100dvh] z-50 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 ease-in-out",
          // Mobile responsive slide-in
          mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full md:translate-x-0",
          // Desktop collapsed width
          collapsed ? "md:w-16" : "md:w-60"
        )}
      >
        {/* Sidebar Brand Header */}
        <div className="h-13 shrink-0 px-4 border-b border-sidebar-border flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 overflow-hidden"
          >
            {collapsed ? (
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                B
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
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
            )}
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar menu"
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 p-2 space-y-4 overflow-y-auto overflow-x-hidden">
          {NAV_GROUPS.map((group, gIdx) => {
            const filteredItems = group.items.filter((item) =>
              canAccessRoute(role, item.href, permissions)
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-0.5">
                {!collapsed && (
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-sidebar-muted-foreground uppercase block truncate">
                    {group.title}
                  </span>
                )}

                {filteredItems.map((item) => {
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
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center rounded-lg text-xs font-medium transition-colors select-none",
                        collapsed
                          ? "justify-center p-2 h-9 w-full"
                          : "gap-2.5 px-2.5 py-2 min-h-[36px]",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-muted active:bg-sidebar-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                        strokeWidth={1.75}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[10px] font-mono px-1.5 py-0.25 rounded-full bg-primary/10 text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );

                  if (collapsed) {
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

        {/* User Profile & Sign Out Footer */}
        <div className="p-2 border-t border-sidebar-border bg-sidebar shrink-0">
          {collapsed ? (
            <Tooltip content={`${user?.name || "User"} (${role || "VIEWER"})`} position="right">
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Log out"
                className="w-full h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : (
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-card/60 border border-border/60">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate leading-tight">
                    {user?.name || "Blactify Admin"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate leading-tight">
                    {role || "VIEWER"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                title="Log out"
                aria-label="Log out"
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Frame (Top Header + Dynamic Content) */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <TopHeader
          sidebarCollapsed={collapsed}
          onToggleSidebar={toggleCollapsed}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <main className="flex-1 w-full min-w-0 px-3.5 sm:px-6 lg:px-8 2xl:px-10 pt-4 sm:pt-6 pb-8 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1920px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
