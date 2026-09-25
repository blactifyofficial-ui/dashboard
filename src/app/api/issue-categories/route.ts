import { NextResponse } from 'next/server';
import { db } from '@/db';
import { issueCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await db.select().from(issueCategories).where(eq(issueCategories.isActive, 'true'));
    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
