'use client';

import { useState } from 'react';
import { X, Lock, Unlock, Clock } from 'lucide-react';
import { MonthMeta } from './types';

interface UnlockMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: MonthMeta | null;
  onUnlockManually: (monthKey: string) => Promise<void>;
}

export default function UnlockMonthModal({
  isOpen,
  onClose,
  month,
  onUnlockManually,
}: UnlockMonthModalProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!isOpen || !month) return null;

  const handleUnlock = async () => {
    try {
      setIsUnlocking(true);
      await onUnlockManually(month.month);
      onClose();
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-card border border-border rounded-[18px] w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden shadow-none">
            {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border bg-muted/10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-muted/60 text-foreground border border-border shrink-0">
                      <Lock size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-[-0.01em]">{month.label} is Locked</h3>
                      <p className="text-xs text-muted-foreground">Automatic schedule lock</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full bg-muted/60 hover:bg-muted transition-all active:scale-95 shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 space-y-4 text-center overflow-y-auto flex-1">
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
                      <Clock size={22} />
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Unlocks on the 30th of the previous month
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        To keep your monthly bookkeeping organized, each new month unlocks automatically once the 30th of the current month arrives.
                      </p>
                    </div>

                      <div className="bg-background border border-border rounded-[11px] p-3 text-xs text-foreground flex items-center justify-between">
                        <span className="text-muted-foreground">Automatic Unlock:</span>
                          <span className="font-semibold text-foreground font-mono">
                            {month.unlockNotice || 'Day 30 of previous month'}
                          </span>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-border">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 min-h-[38px] text-xs font-semibold text-muted-foreground hover:text-foreground rounded-full bg-muted/60 hover:bg-muted border border-border transition-all active:scale-95 flex items-center justify-center"
                        >
                          Wait for 30th
                        </button>
                        <button
                          type="button"
                          onClick={handleUnlock}
                          disabled={isUnlocking}
                          className="px-5 py-2 min-h-[38px] text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-50 rounded-full transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Unlock size={13} />
                          {isUnlocking ? 'Unlocking...' : 'Unlock Early Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
}
