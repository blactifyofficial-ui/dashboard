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
        console.log('[SignOutLink] signOut fired');
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push('/login');
              router.refresh();
            },
          },
        });
      }}
      className="text-blue-500 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Signing Out...' : 'Sign Out'}
    </button>
  );
}
