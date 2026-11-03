'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  iconOnly?: boolean;
  className?: string;
}

export default function BackButton({
  fallbackUrl = '/dashboard',
  label = 'Back',
  iconOnly = false,
  className = ''
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center border border-border bg-muted/60 hover:bg-muted text-foreground transition-all active:scale-95 ${iconOnly
          ? 'h-[36px] w-[36px] sm:h-[44px] sm:w-[44px] rounded-full'
          : 'gap-2 text-[14px] sm:text-[15px] font-normal py-2 px-4 rounded-full'
        } ${className}`}
    >
      <ArrowLeft size={16} className="shrink-0" />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}
