import { NextResponse } from 'next/server';
import { db } from '@/db';
import { debtContacts, debts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { hasPermission } from '@/lib/rbac';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to edit contacts' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(debtContacts)
      .where(eq(debtContacts.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const updateData: {
      name?: string;
      phone?: string | null;
      email?: string | null;
      category?: string;
      notes?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ error: 'Contact name cannot be empty' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone ? body.phone.trim() : null;
    }

    if (body.email !== undefined) {
      updateData.email = body.email ? body.email.trim() : null;
    }

    if (body.category !== undefined) {
      updateData.category = (body.category.trim() || 'GENERAL').toUpperCase();
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes ? body.notes.trim() : null;
    }

    const [updated] = await db
      .update(debtContacts)
      .set(updateData)
      .where(eq(debtContacts.id, id))
      .returning();

    // Optionally update associated debts' contactName/contactPhone if name changed
    if (updateData.name || updateData.phone !== undefined) {
      await db
        .update(debts)
        .set({
          ...(updateData.name ? { contactName: updateData.name } : {}),
          ...(updateData.phone !== undefined ? { contactPhone: updateData.phone } : {}),
          updatedAt: new Date(),
        })
        .where(eq(debts.contactId, id));
    }

    return NextResponse.json({ contact: updated });
  } catch (error) {
    console.error('Error in PATCH /api/debts/contacts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!hasPermission(authResult.role, 'debts:manage', authResult.permissions)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete contacts' }, { status: 403 });
    }

    const { id } = await params;

    const [existing] = await db
      .select()
      .from(debtContacts)
      .where(eq(debtContacts.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Unlink any debts linked to this contact to prevent foreign key errors
    await db
      .update(debts)
      .set({ contactId: null })
      .where(eq(debts.contactId, id));

    await db.delete(debtContacts).where(eq(debtContacts.id, id));

    return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/debts/contacts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

