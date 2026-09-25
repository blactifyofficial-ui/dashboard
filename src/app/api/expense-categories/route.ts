import { NextResponse } from 'next/server';
import { db } from '@/db';
import { expenseCategories } from '@/db/schema';
import { requireAuth } from '@/lib/auth-utils';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }


    const data = await db.select().from(expenseCategories);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }


    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newCatId = crypto.randomUUID();
    const [category] = await db.insert(expenseCategories).values({
      id: newCatId,
      code: name.trim().toUpperCase().replace(/\s+/g, '_'),
      name: name.trim(),
      description: description?.trim() || null,
    }).returning();

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'Category with this name or code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
