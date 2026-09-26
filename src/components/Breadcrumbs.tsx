'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import React from 'react';

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  if (pathname === '/') return null;

  const paths = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center text-sm text-white/60 mb-6 overflow-x-auto whitespace-nowrap no-scrollbar" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/" className="hover:text-white transition-colors flex items-center">
            <Home size={16} />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        
        {paths.map((path, index) => {
          const href = `/${paths.slice(0, index + 1).join('/')}`;
          const isLast = index === paths.length - 1;
          
          // Format text: replace hyphens with spaces and capitalize
          const formattedPath = path
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          return (
            <React.Fragment key={path}>
              <li>
                <ChevronRight size={16} className="text-white/40" />
              </li>
              <li>
                {isLast ? (
                  <span className="text-white font-medium" aria-current="page">
                    {formattedPath}
                  </span>
                ) : (
                  <Link href={href} className="hover:text-white transition-colors">
                    {formattedPath}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
