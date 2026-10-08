'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AccessDenied({
  title = "Access Restricted",
  message = "You do not have the required permissions to view this page or perform this action.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="w-14 h-14 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
        <ShieldAlert size={28} />
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">{title}</h2>
      <p className="text-xs sm:text-sm text-neutral-400 max-w-md mb-6 leading-relaxed">
        {message}
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-xs sm:text-sm rounded-lg hover:bg-neutral-200 transition-colors shadow-sm"
      >
        <ArrowLeft size={15} />
        <span>Back to Overview</span>
      </Link>
    </div>
  );
}
