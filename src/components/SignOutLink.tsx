'use client';

import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

export default function SignOutLink() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push('/login');
              router.refresh();
            },
          },
        });
      }}
      className="text-blue-500 hover:underline cursor-pointer"
    >
      Sign Out
    </button>
  );
}
