import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { allowedUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function requireAuth() {
  const { data: session } = await auth.getSession();
  
  if (!session?.user?.email || !session.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Check if user is in allowed_users table
  const [allowed] = await db.select().from(allowedUsers).where(eq(allowedUsers.email, session.user.email)).limit(1);
  
  if (!allowed) {
    return { error: 'Forbidden: User is not authorized to access this system', status: 403 };
  }

  return { user: session.user as NonNullable<typeof session.user> };
}

export async function requireAdmin() {
  return requireAuth();
}

