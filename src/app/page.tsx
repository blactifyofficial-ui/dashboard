import { requireAuth } from '@/lib/auth-utils';
import { getDefaultRouteForUser } from '@/lib/rbac';
import { redirect } from 'next/navigation';

export default async function Home() {
  try {
    const authRes = await requireAuth();
    if (authRes?.user && !authRes.error) {
      const targetRoute = getDefaultRouteForUser(authRes.role, authRes.permissions);
      redirect(targetRoute);
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error && typeof (error as { digest?: unknown }).digest === 'string' && ((error as { digest: string }).digest.startsWith('NEXT_REDIRECT') || (error as { digest: string }).digest.startsWith('NEXT_ROUTER_REDIRECT'))) {
      throw error;
    }
    console.warn("Home session check fallback:", error);
  }

  redirect('/login');
}

