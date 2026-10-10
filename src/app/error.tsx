'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error caught by root error boundary:', error);
  }, [error]);

  return (
    <div className="flex-1 w-full min-h-[60vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 text-destructive mx-auto flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Unable to load page
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            The page encountered a temporary issue while retrieving data. This is typically due to a database reconnecting after idle sleep.
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
            Refresh page
          </button>
        </div>
      </div>
    </div>
  );
}
