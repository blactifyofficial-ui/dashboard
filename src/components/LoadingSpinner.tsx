import Image from 'next/image';

interface LoadingSpinnerProps {
  size?: 'small' | 'default';
  className?: string;
}

export default function LoadingSpinner({ size = 'default', className = '' }: LoadingSpinnerProps) {
  const isSmall = size === 'small';
  return (
    <div className={`w-full h-full flex items-center justify-center relative z-10 ${isSmall ? 'min-h-[20vh]' : 'flex-1 min-h-[50vh]'} ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Subtle glow effect behind spinner */}
        <div className={`absolute rounded-full bg-white/10 animate-pulse ${isSmall ? '-inset-3 blur-xl' : '-inset-6 blur-2xl'}`} />
        <Image 
          src="/blactify_logo_font.svg" 
          alt="Loading..." 
          width={isSmall ? 128 : 240} 
          height={isSmall ? 32 : 60} 
          className={`${isSmall ? 'w-32' : 'w-60'} h-auto animate-pulse opacity-70 relative z-10`} 
          priority
        />
      </div>
    </div>
  );
}

export { LoadingSpinner as LoadingScreen };
