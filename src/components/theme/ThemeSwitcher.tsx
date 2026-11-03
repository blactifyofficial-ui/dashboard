'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => { };

interface ThemeSwitcherProps {
  variant?: 'compact' | 'segmented';
  className?: string;
}

export function ThemeSwitcher({ variant = 'compact', className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) {
    if (variant === 'segmented') {
      return (
        <div className={`inline-flex items-center p-1 rounded-full bg-muted border border-border opacity-50 ${className}`}>
          <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-normal rounded-full text-muted-foreground">
            <Sun size={14} /> Light
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-normal rounded-full text-muted-foreground">
            <Moon size={14} /> Dark
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-normal rounded-full text-muted-foreground">
            <Laptop size={14} /> System
          </div>
        </div>
      );
    }

    return (
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted border border-border flex items-center justify-center opacity-50 ${className}`}
        aria-hidden="true"
      >
        <Moon size={16} className="text-muted-foreground" />
      </div>
    );
  }

  if (variant === 'segmented') {
    return (
        <div
          role="radiogroup"
          aria-label="Theme preference"
          className={`inline-flex items-center p-1 rounded-full bg-muted border border-border ${className}`}
        >
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'light'}
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[12px] font-normal rounded-full transition-all active:scale-95 ${theme === 'light'
                ? 'bg-card text-foreground border border-border'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Sun size={14} className={theme === 'light' ? 'text-amber-500' : ''} />
            <span>Light</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={theme === 'dark'}
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[12px] font-normal rounded-full transition-all active:scale-95 ${theme === 'dark'
                ? 'bg-card text-foreground border border-border'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Moon size={14} className={theme === 'dark' ? 'text-[#2997ff]' : ''} />
            <span>Dark</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={theme === 'system'}
            onClick={() => setTheme('system')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[12px] font-normal rounded-full transition-all active:scale-95 ${theme === 'system'
                ? 'bg-card text-foreground border border-border'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Laptop size={14} />
            <span>System</span>
      </button>
      </div >
    );
  }

  // Compact Switcher: Apple circular chip
  const isDark = theme === 'dark' || theme === undefined || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode (current: ${theme || 'dark'})`}
      title={`Theme: ${theme || 'dark'}`}
      className={`h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] rounded-full bg-card border border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 ${className}`}
    >
      {isDark ? (
        <Moon size={16} className="text-[#2997ff]" />
      ) : (
        <Sun size={16} className="text-amber-500" />
      )}
    </button>
  );
}

export default ThemeSwitcher;
