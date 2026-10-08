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
      <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${isPending ? 'text-primary' : 'text-muted-foreground'}`} />
      <input 
        type="text" 
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..." 
        className="w-full md:w-64 bg-card border border-input rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors shadow-xs"
      />
    </div>
  );
}

export default function SearchInput({ initialQuery }: { initialQuery: string }) {
  return (
    <Suspense fallback={<div className="w-full md:w-64 h-9 bg-muted border border-border rounded-lg" />}>
      <SearchInputInner initialQuery={initialQuery} />
    </Suspense>
  );
}
