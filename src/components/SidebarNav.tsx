'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertCircle, Settings, Wallet, BarChart3, Megaphone, Handshake, CalendarCheck, Banknote, Boxes } from 'lucide-react';


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
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function SidebarNav({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap ${isActive
              ? 'bg-white/10 text-white'
              : 'text-white/80 hover:bg-white/10 hover:text-white active:bg-white/15'
              }`}
          >
            <Icon size={19} className={`shrink-0 ${isActive ? 'text-white' : 'text-white/60'}`} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </>
  );
}
