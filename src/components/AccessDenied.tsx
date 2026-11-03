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
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-6 text-center text-foreground">
        <div className="w-14 h-14 rounded-full bg-[#ff453a]/15 border border-[#ff453a]/30 flex items-center justify-center mb-4 text-[#ff453a]">
          <ShieldAlert size={28} />
        </div>
          <h2 className="text-[21px] font-semibold text-foreground mb-2 tracking-[-0.224px]">{title}</h2>
          <p className="text-[14px] sm:text-[17px] text-muted-foreground max-w-md mb-6 leading-relaxed tracking-[-0.374px]">
            {message}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-[44px] px-6 bg-[#0066cc] hover:bg-[#0071e3] text-white font-normal text-[15px] sm:text-[17px] tracking-[-0.374px] rounded-full transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Back to Overview</span>
          </Link>
      </div>
      );
}
