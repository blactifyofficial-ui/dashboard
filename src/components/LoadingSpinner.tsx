import Image from 'next/image';

interface LoadingSpinnerProps {
  size?: 'small' | 'default';
  className?: string;
}

export default function LoadingSpinner({ size = 'default', className = '' }: LoadingSpinnerProps) {
  const isSmall = size === 'small';
  const imgClass = `${isSmall ? 'w-24' : 'w-36'} h-auto animate-pulse opacity-60 relative z-10`;

  return (
    <div className={`w-full h-full flex items-center justify-center relative z-10 ${isSmall ? 'min-h-[20vh]' : 'flex-1 min-h-[50vh]'} ${className}`}>
      <div className="relative flex items-center justify-center">
        <Image 
          src="/blactify_logo_font.svg" 
          alt="Loading..." 
          width={653} 
          height={66} 
          className={`${imgClass} hidden dark:block`} 
          style={{ width: isSmall ? '96px' : '135px', height: 'auto' }}
          priority
        />
        <Image 
          src="/blactify_logo_dark.svg" 
          alt="Loading..." 
          width={653} 
          height={66} 
          className={`${imgClass} block dark:hidden`} 
          style={{ width: isSmall ? '96px' : '135px', height: 'auto' }}
          priority
        />
      </div>
    </div>
  );
}

export { LoadingSpinner as LoadingScreen };
