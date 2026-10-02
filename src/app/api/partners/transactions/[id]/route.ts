import { NextResponse } from 'next/server';
import { db } from '@/db';
import { partnerTransactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-utils';
import { enqueueSyncJob } from '@/lib/google-sheets';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      type,
      amount,
      transactionDate,
      paymentMethodId,
      status,
      referenceNumber,
      notes,
    } = body;

    const [updated] = await db
      .update(partnerTransactions)
      .set({
        type: type !== undefined ? type : undefined,
        amount: amount !== undefined ? String(amount) : undefined,
        transactionDate: transactionDate ? new Date(transactionDate) : undefined,
        paymentMethodId: paymentMethodId !== undefined ? paymentMethodId : undefined,
        status: status !== undefined ? status : undefined,
        referenceNumber: referenceNumber !== undefined ? (referenceNumber?.trim() || null) : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(partnerTransactions.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Automatically sync partner transaction to Google Sheets
    void enqueueSyncJob({
      entity: 'partner_transactions',
      databaseId: id,
      operation: 'UPDATE',
    });

    if (updated.type === 'PAYOUT') {
      void enqueueSyncJob({
        entity: 'payouts',
        databaseId: id,
        operation: 'UPDATE',
      });
    }

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(partnerTransactions)
      .where(eq(partnerTransactions.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Automatically sync partner transaction deletion to Google Sheets
    void enqueueSyncJob({
      entity: 'partner_transactions',
      databaseId: id,
      operation: 'DELETE',
    });

    if (deleted.type === 'PAYOUT') {
      void enqueueSyncJob({
        entity: 'payouts',
        databaseId: id,
        operation: 'DELETE',
      });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

