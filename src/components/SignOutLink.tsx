'use client';

import { useState, useRef } from 'react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

export default function SignOutLink() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const lockRef = useRef(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        if (lockRef.current) return;
        lockRef.current = true;
        setLoading(true);
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push('/login');
              router.refresh();
            },
          },
        });
      }}
      className="text-[#0066cc] dark:text-[#2997ff] text-[15px] sm:text-[17px] hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-normal"
    >
      {loading ? 'Signing Out...' : 'Sign Out'}
    </button>
  );
}
