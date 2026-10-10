import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  try {
    const result = await auth.getSession();
    const session = result?.data;
    
    if (session?.user) {
      redirect('/dashboard');
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error && typeof (error as { digest?: unknown }).digest === 'string' && ((error as { digest: string }).digest.startsWith('NEXT_REDIRECT') || (error as { digest: string }).digest.startsWith('NEXT_ROUTER_REDIRECT'))) {
      throw error;
    }
    console.warn("Home session check fallback:", error);
  }

  redirect('/login');
}
