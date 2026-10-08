'use client';

import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const emptySubscribe = () => () => {};

export default function LogoutButton() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutLockRef = useRef(false);

  const handleLogout = async () => {
    if (logoutLockRef.current) return;
    logoutLockRef.current = true;
    setIsLoggingOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login');
          router.refresh();
        },
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex w-full items-center gap-2.5 px-3 py-2 min-h-[38px] text-xs sm:text-sm font-medium text-neutral-400 rounded-lg hover:bg-neutral-900 hover:text-white active:bg-neutral-800 transition-colors whitespace-nowrap text-left"
      >
        <LogOut size={17} className="text-neutral-500 shrink-0" /> <span>Sign Out</span>
      </button>

      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-neutral-900 border border-neutral-800 p-5 sm:p-6 rounded-xl shadow-xl max-w-sm w-full max-h-[90dvh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-2">Sign Out</h2>
            <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
              Are you sure you want to sign out? You will need to sign in again to access the dashboard.
            </p>
            
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 min-h-[40px] py-2 px-4 rounded-lg text-sm font-medium border border-neutral-700/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 bg-white hover:bg-neutral-200 text-black min-h-[40px] py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

