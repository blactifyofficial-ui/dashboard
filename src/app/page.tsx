import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { data: session } = await auth.getSession();
  
  if (session?.user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
