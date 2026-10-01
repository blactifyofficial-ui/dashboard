'use client';

import { Search } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition, useState, Suspense, useRef } from 'react';

function SearchInputInner({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(initialQuery);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (newValue: string) => {
    setValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newValue) {
        params.set('q', newValue);
      } else {
        params.delete('q');
      }
      params.delete('page'); // Reset to page 1 on new search
      
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);
  };

  return (
    <div className="relative w-full md:w-auto">
      <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${isPending ? 'text-white/80 animate-pulse' : 'text-neutral-500'}`} />
      <input 
        type="text" 
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search orders..." 
        className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-base md:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition-colors"
      />
    </div>
  );
}

export default function SearchInput({ initialQuery }: { initialQuery: string }) {
  return (
    <Suspense fallback={<div className="w-full md:w-64 min-h-[44px] bg-white/5 border border-white/10 rounded-xl animate-pulse" />}>
      <SearchInputInner initialQuery={initialQuery} />
    </Suspense>
  );
}
