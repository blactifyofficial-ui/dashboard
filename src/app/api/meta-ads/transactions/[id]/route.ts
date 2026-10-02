import { NextResponse } from 'next/server';
import { db } from '@/db';
import { metaAdsTransactions, expenses, expenseActivities, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { enqueueSyncJob } from '@/lib/google-sheets';

export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const { id } = await params;

    const [existing] = await db
      .select()
      .from(metaAdsTransactions)
      .where(eq(metaAdsTransactions.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Ensure session user exists in "user" table
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

    // If an expense is linked, soft-delete it so expenses stay in sync!
    if (existing.expenseId) {
      await db.update(expenses).set({
        deletedAt: new Date(),
        deletedById: session.user.id,
        updatedAt: new Date(),
      }).where(eq(expenses.id, existing.expenseId));

      await db.insert(expenseActivities).values({
        id: crypto.randomUUID(),
        expenseId: existing.expenseId,
        actorId: session.user.id,
        activityType: 'DELETED',
        remark: 'Auto-deleted when Meta Ads payment transaction was removed',
      });
    }

    // Delete transaction
    await db.delete(metaAdsTransactions).where(eq(metaAdsTransactions.id, id));

    // Automatically sync deletions to Google Sheets
    void enqueueSyncJob({
      entity: 'meta_ads',
      databaseId: id,
      operation: 'DELETE',
    });

    if (existing.expenseId) {
      void enqueueSyncJob({
        entity: 'expenses',
        databaseId: existing.expenseId,
        operation: 'DELETE',
      });
    }

    return NextResponse.json({ success: true, message: 'Transaction and linked expense removed' });
  } catch (error) {
    console.error('Error deleting meta ads transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const session = { user: authResult.user! };

    const { id } = await params;
    const body = await req.json();
    const { amountPaid, paymentDate, paymentMethodId, referenceNumber, notes } = body;

    const [existing] = await db
      .select()
      .from(metaAdsTransactions)
      .where(eq(metaAdsTransactions.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const updates: Partial<typeof metaAdsTransactions.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (amountPaid !== undefined) {
      if (isNaN(Number(amountPaid)) || Number(amountPaid) <= 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
      }
      updates.amountPaid = String(amountPaid);
    }

    if (paymentDate) updates.paymentDate = new Date(paymentDate);
    if (paymentMethodId) updates.paymentMethodId = paymentMethodId;
    if (referenceNumber !== undefined) updates.referenceNumber = referenceNumber?.trim() || null;
    if (notes !== undefined) updates.notes = notes?.trim() || null;

    const [updatedTx] = await db
      .update(metaAdsTransactions)
      .set(updates)
      .where(eq(metaAdsTransactions.id, id))
      .returning();

    // If an expense is linked, update it too
    if (existing.expenseId) {
      const expenseUpdates: Partial<typeof expenses.$inferInsert> = {
        updatedAt: new Date(),
        updatedById: session.user.id,
      };

      if (amountPaid !== undefined) expenseUpdates.amount = Number(amountPaid).toFixed(2);
      if (paymentDate) expenseUpdates.expenseDate = new Date(paymentDate);
      if (paymentMethodId) expenseUpdates.paymentMethodId = paymentMethodId;
      if (referenceNumber !== undefined) expenseUpdates.referenceNumber = referenceNumber?.trim() || null;

      await db
        .update(expenses)
        .set(expenseUpdates)
        .where(eq(expenses.id, existing.expenseId));

      await db.insert(expenseActivities).values({
        id: crypto.randomUUID(),
        expenseId: existing.expenseId,
        actorId: session.user.id,
        activityType: 'UPDATED',
        oldValue: existing.amountPaid,
        newValue: amountPaid ? String(amountPaid) : existing.amountPaid,
        remark: 'Synchronized from Meta Ads transaction update',
      });

      void enqueueSyncJob({
        entity: 'expenses',
        databaseId: existing.expenseId,
        operation: 'UPDATE',
      });
    }

    // Automatically sync updated Meta Ads transaction to Google Sheets
    void enqueueSyncJob({
      entity: 'meta_ads',
      databaseId: id,
      operation: 'UPDATE',
    });

    return NextResponse.json({ success: true, transaction: updatedTx });
  } catch (error) {
    console.error('Error updating meta ads transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

