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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/5 text-neutral-400 border border-white/10">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{month.label} is Locked</h3>
              <p className="text-xs text-neutral-400">Automatic schedule lock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
            <Clock size={28} />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">
              Unlocks on the 30th of the previous month
            </h4>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              To keep your monthly bookkeeping organized, each new month unlocks automatically once the 30th of the current month arrives.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-neutral-300 flex items-center justify-between">
            <span className="text-neutral-400">Automatic Unlock:</span>
            <span className="font-semibold text-white">
              {month.unlockNotice || 'Day 30 of previous month'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              Wait for 30th
            </button>
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-neutral-200 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Unlock size={14} />
              {isUnlocking ? 'Unlocking...' : 'Unlock Early Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
