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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-neutral-800 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0">
              <Lock size={15} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white">{month.label} is Locked</h3>
              <p className="text-xs text-neutral-400">Automatic schedule lock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-center overflow-y-auto flex-1">
          <div className="w-12 h-12 mx-auto rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-400">
            <Clock size={22} />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">
              Unlocks on the 30th of the previous month
            </h4>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              To keep your monthly bookkeeping organized, each new month unlocks automatically once the 30th of the current month arrives.
            </p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-300 flex items-center justify-between">
            <span className="text-neutral-400">Automatic Unlock:</span>
            <span className="font-semibold text-white">
              {month.unlockNotice || 'Day 30 of previous month'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 min-h-[38px] text-xs font-medium text-neutral-300 hover:text-white rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors flex items-center justify-center"
            >
              Wait for 30th
            </button>
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="px-4 py-2 min-h-[38px] text-xs font-semibold text-black bg-white hover:bg-neutral-200 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
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
