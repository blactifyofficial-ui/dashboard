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
      <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-400 shadow-xl shadow-red-500/5">
        <ShieldAlert size={32} />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">{title}</h2>
      <p className="text-sm text-neutral-400 max-w-md mb-6 leading-relaxed">
        {message}
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-xs sm:text-sm rounded-xl hover:bg-neutral-200 transition-all shadow-md active:scale-95"
      >
        <ArrowLeft size={16} />
        <span>Back to Overview</span>
      </Link>
    </div>
  );
}
