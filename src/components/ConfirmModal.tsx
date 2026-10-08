'use client';
import { useEffect } from 'react';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
};

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}: ConfirmModalProps) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
      >
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">{title}</h2>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{message}</p>
        </div>
        <div className="bg-muted/40 p-4 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={onCancel}
            className="h-9 px-3.5 flex items-center justify-center rounded-lg text-xs font-medium text-foreground bg-muted hover:bg-accent border border-border transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="h-9 px-4 flex items-center justify-center rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
