import { NextResponse } from 'next/server';
import { db } from '@/db';
import { expenseDateNotes, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    if (dateParam) {
      const [note] = await db
        .select()
        .from(expenseDateNotes)
        .where(eq(expenseDateNotes.date, dateParam))
        .limit(1);

      return NextResponse.json(note || null);
    }

    const notes = await db.select().from(expenseDateNotes);
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching expense date notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const body = await req.json();
    const { date, note } = body;

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ error: 'Date is required (YYYY-MM-DD)' }, { status: 400 });
    }

    // Ensure user exists in user table for foreign key reference
    await db.insert(users).values({
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        name: session.user.name || '',
        email: session.user.email || '',
      }
    });

    const trimmedNote = (typeof note === 'string' ? note.trim() : '');

    if (!trimmedNote) {
      // If note is cleared, remove the record
      await db.delete(expenseDateNotes).where(eq(expenseDateNotes.date, date));
      return NextResponse.json({ date, note: '' });
    }

    const [savedNote] = await db
      .insert(expenseDateNotes)
      .values({
        id: crypto.randomUUID(),
        date,
        note: trimmedNote,
        createdById: session.user.id,
        updatedById: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: expenseDateNotes.date,
        set: {
          note: trimmedNote,
          updatedById: session.user.id,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(savedNote);
  } catch (error) {
    console.error('Error saving expense date note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
