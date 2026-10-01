'use client';

import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function LogoutButton() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutLockRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    if (logoutLockRef.current) return;
    logoutLockRef.current = true;
    setIsLoggingOut(true);
    console.log('[LogoutButton] handleLogout fired');
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
        className="flex w-full items-center gap-3 px-3.5 py-2.5 min-h-[44px] text-sm font-medium text-white/80 rounded-xl hover:bg-white/10 hover:text-white active:bg-white/15 transition-all duration-200 whitespace-nowrap text-left"
      >
        <LogOut size={19} className="text-white/60 shrink-0" /> <span>Sign Out</span>
      </button>

      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 p-5 sm:p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-2">Sign Out</h2>
            <p className="text-neutral-400 text-sm mb-6">Are you sure you want to sign out? You will need to sign in again to access the dashboard.</p>
            
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 bg-white hover:bg-neutral-200 active:bg-neutral-300 text-black min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
