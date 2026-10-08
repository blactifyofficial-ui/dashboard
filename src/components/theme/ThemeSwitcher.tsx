'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

interface ThemeSwitcherProps {
  variant?: 'compact' | 'segmented' | 'dropdown';
  className?: string;
}

export function ThemeSwitcher({ variant = 'compact', className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) {
    if (variant === 'segmented') {
      return (
        <div className={`inline-flex items-center p-1 rounded-xl bg-muted border border-border opacity-50 ${className}`}>
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground">
            <Sun size={15} /> Light
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground">
            <Moon size={15} /> Dark
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground">
            <Laptop size={15} /> System
          </div>
        </div>
      );
    }

    return (
      <div 
        className={`w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center opacity-50 ${className}`}
        aria-hidden="true"
      >
        <Sun size={17} className="text-muted-foreground" />
      </div>
    );
  }

  if (variant === 'segmented') {
    return (
      <div 
        role="radiogroup" 
        aria-label="Theme preference"
        className={`inline-flex items-center p-1 rounded-xl bg-muted border border-border ${className}`}
      >
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'light'}
          onClick={() => setTheme('light')}
          className={`flex items-center gap-2 px-3.5 py-2 min-h-[36px] text-xs font-medium rounded-lg transition-colors ${
            theme === 'light'
              ? 'bg-card text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sun size={15} className={theme === 'light' ? 'text-amber-500' : ''} />
          <span>Light</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={theme === 'dark'}
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-2 px-3.5 py-2 min-h-[36px] text-xs font-medium rounded-lg transition-colors ${
            theme === 'dark'
              ? 'bg-card text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Moon size={15} className={theme === 'dark' ? 'text-blue-400' : ''} />
          <span>Dark</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={theme === 'system'}
          onClick={() => setTheme('system')}
          className={`flex items-center gap-2 px-3.5 py-2 min-h-[36px] text-xs font-medium rounded-lg transition-colors ${
            theme === 'system'
              ? 'bg-card text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Laptop size={15} className={theme === 'system' ? 'text-emerald-500' : ''} />
          <span>System</span>
        </button>
      </div>
    );
  }

  // Compact Switcher (cycles through light -> dark -> system or toggles)
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode (current: ${theme})`}
      title={`Theme: ${theme}`}
      className={`min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] p-2 rounded-lg bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center focus-visible:ring-1 focus-visible:ring-ring ${className}`}
    >
      {isDark ? (
        <Moon size={17} className="text-blue-400" />
      ) : (
        <Sun size={17} className="text-amber-500" />
      )}
    </button>
  );
}

export default ThemeSwitcher;
