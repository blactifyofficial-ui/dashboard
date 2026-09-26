'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, ShoppingBag, CalendarDays, AlertCircle, Settings, Wallet, Package } from 'lucide-react';


const NAV_LINKS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/product-revenue', label: 'Products', icon: ShoppingBag },
  { href: '/revenue', label: 'Monthly', icon: CalendarDays },
  { href: '/order-issues', label: 'Issues', icon: AlertCircle },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/stocks', label: 'Stocks', icon: Package },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function SidebarNav() {
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
            className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap ${
              isActive 
                ? 'bg-white/10 text-white' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={18} className={`md:w-5 md:h-5 ${isActive ? 'text-white' : 'text-white/60'}`} /> 
            <span>{link.label}</span>
          </Link>
        );
      })}
    </>
  );
}
