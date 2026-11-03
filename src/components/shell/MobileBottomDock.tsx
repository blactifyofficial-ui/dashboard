"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  HandCoins,
  Wallet,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canAccessRoute } from "@/lib/rbac";
import { cn } from "@/lib/utils";

interface MobileBottomDockProps {
  onOpenMore: () => void;
  isMoreOpen?: boolean;
}

interface DockItemDef {
  href: string;
  label: string;
  icon: React.ElementType;
}

const PRIMARY_DOCK_ITEMS: DockItemDef[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/revenue", label: "Revenue", icon: BarChart3 },
  { href: "/cod", label: "COD", icon: HandCoins },
  { href: "/expenses", label: "Expenses", icon: Wallet },
];

export function MobileBottomDock({ onOpenMore, isMoreOpen = false }: MobileBottomDockProps) {
  const pathname = usePathname();
  const { role, permissions } = useAuth();

  const accessibleItems = PRIMARY_DOCK_ITEMS.filter((item) =>
    canAccessRoute(role, item.href, permissions)
  );

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-40 max-w-[390px] mx-auto pointer-events-auto"
    >
      <div className="backdrop-blur-2xl bg-card/90 dark:bg-[#18181b]/92 border border-white/10 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)] rounded-full px-2 py-1.5 flex items-center justify-around">
        {accessibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 active:scale-90 select-none min-w-[52px]",
                isActive
                  ? "text-[#0066cc] dark:text-[#2997ff]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-full transition-colors",
                  isActive && "bg-[#0066cc]/12 dark:bg-[#2997ff]/15"
                )}
              >
                <Icon
                  className="w-4.5 h-4.5"
                  strokeWidth={isActive ? 2.2 : 1.75}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight leading-tight mt-0.5",
                  isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More Hub Button */}
        <button
          type="button"
          onClick={onOpenMore}
          aria-label="Open more apps menu"
          aria-expanded={isMoreOpen}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 active:scale-90 select-none min-w-[52px]",
            isMoreOpen
              ? "text-[#0066cc] dark:text-[#2997ff]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1 rounded-full transition-colors",
              isMoreOpen && "bg-[#0066cc]/12 dark:bg-[#2997ff]/15"
            )}
          >
            <MoreHorizontal
              className="w-4.5 h-4.5"
              strokeWidth={isMoreOpen ? 2.2 : 1.75}
            />
          </div>
          <span
            className={cn(
              "text-[10px] tracking-tight leading-tight mt-0.5",
              isMoreOpen ? "font-semibold text-foreground" : "font-normal text-muted-foreground"
            )}
          >
            More
          </span>
        </button>
      </div>
    </nav>
  );
}

