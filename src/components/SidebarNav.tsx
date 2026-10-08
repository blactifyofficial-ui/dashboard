'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertCircle, Settings, Wallet, BarChart3, Megaphone, Handshake, CalendarCheck, Banknote, Boxes, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROUTE_PERMISSIONS } from '@/lib/rbac';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/revenue', label: 'Revenue', icon: BarChart3 },
  { href: '/inventory', label: 'Inventory & Stock Value', icon: Boxes },
  { href: '/meta-ads', label: 'Meta Ads', icon: Megaphone },
  { href: '/partners', label: 'Partners & Capital', icon: Handshake },
  { href: '/payouts', label: 'Payouts', icon: Banknote },
  { href: '/order-issues', label: 'Issues', icon: AlertCircle },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/monthly-expenses', label: 'Monthly Bills', icon: CalendarCheck },
  { href: '/team', label: 'Team & Roles', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function SidebarNav({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  const allowedNavLinks = NAV_LINKS.filter((link) => {
    const requiredPermission = ROUTE_PERMISSIONS[link.href];
    if (!requiredPermission) return true;
    return hasPermission(requiredPermission);
  });

  return (
    <>
      {allowedNavLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3 py-2 min-h-[38px] text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${isActive
              ? 'bg-neutral-800 text-white font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900 active:bg-neutral-800/60'
              }`}
          >
            <Icon size={17} className={`shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </>
  );
}


