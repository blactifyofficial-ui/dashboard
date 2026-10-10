'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="w-full py-12 flex flex-col items-center justify-center text-center">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 text-destructive mx-auto flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Sales Overview Unavailable
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            We couldn&apos;t load the latest sales metrics right now. If the database was suspended, it is currently waking up.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            <RotateCcw size={16} />
            Try again
          </button>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-muted text-foreground border border-border font-medium text-sm hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
