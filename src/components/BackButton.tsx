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
      className={`inline-flex items-center justify-center transition-colors cursor-pointer text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border shrink-0 shadow-xs ${
        iconOnly 
          ? 'h-9 w-9 rounded-lg' 
          : 'gap-1.5 text-xs sm:text-sm font-medium py-1.5 px-3 rounded-lg'
      } ${className}`}
    >
      <ArrowLeft size={16} className="shrink-0" />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}
