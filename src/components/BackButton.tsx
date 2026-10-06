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
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer text-white bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 shrink-0 ${
        iconOnly 
          ? 'min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] rounded-xl' 
          : 'gap-2 text-sm font-medium py-2 px-3 rounded-xl'
      } ${className}`}
    >
      <ArrowLeft size={18} className="shrink-0" />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}
