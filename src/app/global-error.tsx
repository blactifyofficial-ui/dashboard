'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col items-center justify-center p-6 font-sans antialiased">
        <div className="max-w-md w-full p-6 sm:p-8 bg-[#141414] border border-[#262626] rounded-2xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center font-semibold text-xl">
            !
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-white">Something went wrong</h1>
            <p className="text-sm text-[#888888] leading-relaxed">
              The service encountered an unexpected error or temporary connection timeout. Please try refreshing.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => reset()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#262626] text-white font-medium text-sm hover:bg-[#333333] transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
