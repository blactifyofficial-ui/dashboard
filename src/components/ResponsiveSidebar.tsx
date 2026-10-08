'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import SidebarNav from './SidebarNav';
import LogoutButton from './LogoutButton';

export default function ResponsiveSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-neutral-800 bg-black sticky top-0 z-50 relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          className="text-neutral-300 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 z-10 relative transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-[env(safe-area-inset-top)]">
          <Link href="/" className="pointer-events-auto flex items-center min-h-[44px] px-2">
            <Image src="/blactify_logo_font.svg" alt="Blactify" width={110} height={22} className="h-5.5 object-contain" priority />
          </Link>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 z-40 transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content (Desktop & Mobile Slide-in) */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-[100dvh] z-50
        w-60 shrink-0 flex flex-col
        border-r border-neutral-800 bg-neutral-950
        transition-transform duration-200 ease-out
        pt-[env(safe-area-inset-top)] pb-[max(1rem,env(safe-area-inset-bottom))]
        ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 md:px-5 md:py-6 border-b border-neutral-800/80 hidden md:block">
          <Link href="/" className="block">
            <Image src="/blactify_logo_font.svg" alt="Blactify" width={128} height={26} className="h-6.5 object-contain" priority />
          </Link>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto flex flex-col">
          <SidebarNav onClose={() => setIsOpen(false)} />
          <div className="mt-auto pt-3 border-t border-neutral-800/80 w-full block">
            <LogoutButton />
          </div>
        </nav>
      </aside>
    </>
  );
}

