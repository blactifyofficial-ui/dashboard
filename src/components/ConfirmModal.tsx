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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60  p-4">
      <div 
        className="bg-[#1e1e1e] border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
          <p className="text-gray-400 text-sm">{message}</p>
        </div>
        <div className="bg-black/20 p-4 border-t border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="h-11 px-4 flex items-center justify-center rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="h-11 px-4 flex items-center justify-center rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
