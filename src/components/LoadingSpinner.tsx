import Image from 'next/image';

interface LoadingSpinnerProps {
  size?: 'small' | 'default';
  className?: string;
}

export default function LoadingSpinner({ size = 'default', className = '' }: LoadingSpinnerProps) {
  const isSmall = size === 'small';
  const width = isSmall ? 110 : 160;
  const height = isSmall ? 24 : 36;
  const imgClass = `${isSmall ? 'w-28' : 'w-40'} h-auto animate-pulse opacity-60 relative z-10`;

  return (
    <div className={`w-full h-full flex items-center justify-center relative z-10 ${isSmall ? 'min-h-[20vh]' : 'flex-1 min-h-[50vh]'} ${className}`}>
      <div className="relative flex items-center justify-center">
        <Image 
          src="/blactify_logo_font.svg" 
          alt="Loading..." 
          width={width} 
          height={height} 
          className={`${imgClass} hidden dark:block`} 
          priority
        />
        <Image 
          src="/blactify_logo_dark.svg" 
          alt="Loading..." 
          width={width} 
          height={height} 
          className={`${imgClass} block dark:hidden`} 
          priority
        />
      </div>
    </div>
  );
}

export { LoadingSpinner as LoadingScreen };
