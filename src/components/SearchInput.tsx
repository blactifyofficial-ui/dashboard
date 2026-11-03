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
      <Search
        size={14}
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${isPending ? 'text-[#0066cc] dark:text-[#2997ff]' : 'text-muted-foreground'
          }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
        className="w-full md:w-64 h-[40px] sm:h-[44px] bg-card border border-border rounded-full pl-10 pr-4 py-2 text-[14px] sm:text-[15px] tracking-[-0.224px] text-foreground placeholder:text-muted-foreground/60 focus:outline-2 focus:outline-[#0071e3] focus:outline-offset-2 transition-all"
      />
    </div>
  );
}

export default function SearchInput({ initialQuery }: { initialQuery: string }) {
  return (
      <Suspense fallback={<div className="w-full md:w-64 h-[40px] sm:h-[44px] bg-muted border border-border rounded-full" />}>
        <SearchInputInner initialQuery={initialQuery} />
      </Suspense>
      );
}
