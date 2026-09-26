import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { headers } from "next/headers";

export default async function Home() {
  const { data: session } = await auth.getSession({
    fetchOptions: { headers: await headers() }
  });
  
  if (session?.user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
