'use client';
import { useEffect, useState } from 'react';

type PinModalProps = {
  isOpen: boolean;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
  title?: string;
  description?: string;
};

export default function PinModal({ 
  isOpen, 
  onConfirm, 
  onCancel,
  isLoading = false,
  error,
  title = "Enter PIN",
  description = "Please enter your PIN to view revenue details."
}: PinModalProps) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60  p-4">
      <div 
        className="bg-[#1e1e1e] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
          <p className="text-gray-400 text-sm mb-4">{description}</p>
          
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="w-full bg-black/20 border border-white/10 rounded-lg h-11 px-4 text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pin.trim().length > 0) {
                onConfirm(pin);
              }
            }}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <div className="bg-black/20 p-4 border-t border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="h-11 px-4 flex items-center justify-center rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(pin)}
            disabled={isLoading || pin.trim().length === 0}
            className="h-11 px-4 flex items-center justify-center rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
