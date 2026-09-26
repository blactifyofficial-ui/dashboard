'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import SidebarNav from './SidebarNav';
import LogoutButton from './LogoutButton';

export default function ResponsiveSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center p-4 border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50 relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white/80 hover:text-white p-2 rounded-lg bg-white/5 z-10 relative"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Link href="/" className="pointer-events-auto">
            <Image src="/blactify_logo_font.svg" alt="Blactify" width={120} height={24} className="h-6 object-contain" style={{ width: 'auto', height: 'auto' }} priority />
          </Link>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content (Desktop & Mobile Slide-in) */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50
        w-64 shrink-0 flex flex-col
        border-r border-white/10 bg-black md:bg-white/[0.02] backdrop-blur-xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 md:p-8 border-b border-white/5 hidden md:block">
          <Link href="/">
            <Image src="/blactify_logo_font.svg" alt="Blactify" width={150} height={32} className="h-8 object-contain" style={{ width: 'auto', height: 'auto' }} priority />
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar flex flex-col">
          <SidebarNav />
          <div className="mt-auto pt-4 border-t border-white/5 w-full block">
            <LogoutButton />
          </div>
        </nav>
      </aside>
    </>
  );
}
