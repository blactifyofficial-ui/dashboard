import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const result = await auth.getSession();
  console.log("Home session result:", result);
  const { data: session } = result;
  
  if (session?.user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
