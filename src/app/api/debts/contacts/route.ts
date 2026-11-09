import { NextResponse } from 'next/server';
import { db } from '@/db';
import { debtContacts, debts, users } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:view', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view debt contacts' }, { status: 403 });
    }

    // Fetch all contacts
    const contacts = await db
      .select({
        id: debtContacts.id,
        name: debtContacts.name,
        phone: debtContacts.phone,
        email: debtContacts.email,
        category: debtContacts.category,
        notes: debtContacts.notes,
        createdById: debtContacts.createdById,
        createdAt: debtContacts.createdAt,
        updatedAt: debtContacts.updatedAt,
      })
      .from(debtContacts)
      .orderBy(asc(debtContacts.name));

    // Fetch active debts to calculate real-time net balances per contact
    const allDebts = await db
      .select({
        id: debts.id,
        contactId: debts.contactId,
        contactName: debts.contactName,
        type: debts.type,
        remainingAmount: debts.remainingAmount,
        status: debts.status,
      })
      .from(debts);

    // Group debts by contactId and lowercased contactName for robust matching
    const contactStats: Record<string, { activeLent: number; activeBorrowed: number; openDebtCount: number }> = {};

    for (const d of allDebts) {
      if (d.status === 'SETTLED' || d.status === 'CANCELLED') continue;

      const rem = Number(d.remainingAmount) || 0;
      const isLent = d.type === 'LENT';

      // Match keys: by contactId or by contactName
      const keysToUpdate: string[] = [];
      if (d.contactId) keysToUpdate.push(d.contactId);
      if (d.contactName) keysToUpdate.push(`name:${d.contactName.trim().toLowerCase()}`);

      for (const k of keysToUpdate) {
        if (!contactStats[k]) {
          contactStats[k] = { activeLent: 0, activeBorrowed: 0, openDebtCount: 0 };
        }
        if (isLent) {
          contactStats[k].activeLent += rem;
        } else {
          contactStats[k].activeBorrowed += rem;
        }
        contactStats[k].openDebtCount += 1;
      }
    }

    const enrichedContacts = contacts.map((c) => {
      const byId = contactStats[c.id];
      const byName = contactStats[`name:${c.name.trim().toLowerCase()}`];

      // Prefer stats by ID if present, else by Name
      const stats = byId || byName || { activeLent: 0, activeBorrowed: 0, openDebtCount: 0 };
      const netBalance = stats.activeLent - stats.activeBorrowed;

      return {
        ...c,
        activeLent: stats.activeLent,
        activeBorrowed: stats.activeBorrowed,
        netBalance,
        openDebtCount: stats.openDebtCount,
      };
    });

    return NextResponse.json({ contacts: enrichedContacts });
  } catch (error) {
    console.error('Error in GET /api/debts/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create contacts' }, { status: 403 });
    }

    const sessionUser = authResult.user!;
    const body = await req.json();

    const { name, phone, email, category, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Person / contact name is required' }, { status: 400 });
    }

    // Ensure session user exists in users table
    await db
      .insert(users)
      .values({
        id: sessionUser.id,
        name: sessionUser.name || '',
        email: sessionUser.email || '',
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: sessionUser.name || '',
          email: sessionUser.email || '',
        },
      });

    const contactId = `dc_${crypto.randomUUID()}`;

    const [newContact] = await db
      .insert(debtContacts)
      .values({
        id: contactId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        category: (category?.trim() || 'GENERAL').toUpperCase(),
        notes: notes?.trim() || null,
        createdById: sessionUser.id,
      })
      .returning();

    return NextResponse.json({
      contact: {
        ...newContact,
        activeLent: 0,
        activeBorrowed: 0,
        netBalance: 0,
        openDebtCount: 0,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/debts/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

