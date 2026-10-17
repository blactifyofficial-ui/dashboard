import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { 
  getCodDashboardData, 
  createCodRemittance, 
  updateCodRemittance, 
  deleteCodRemittance 
} from '@/lib/cod-service';

export async function GET(req: Request) {
  try {
    const authResult = await requirePermission('cod:view');
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || 'all';
    const month = searchParams.get('month') || undefined;
    const courier = searchParams.get('courier') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getCodDashboardData({
      timeRange,
      month,
      courier,
      search,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error fetching COD data:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requirePermission('cod:manage');
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const {
      amount,
      receivedDate,
      courier,
      paymentMethodId,
      referenceNumber,
      ordersCount,
      notes,
    } = body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Please enter a valid amount' }, { status: 400 });
    }

    const result = await createCodRemittance({
      amount: parseFloat(amount),
      receivedDate: receivedDate || new Date(),
      courier: courier || null,
      paymentMethodId: paymentMethodId || null,
      referenceNumber: referenceNumber || null,
      ordersCount: ordersCount ? parseFloat(ordersCount) : null,
      notes: notes || null,
      actorId: authResult.user?.id || null,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error creating COD remittance:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await requirePermission('cod:manage');
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const {
      id,
      amount,
      receivedDate,
      courier,
      paymentMethodId,
      referenceNumber,
      ordersCount,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Remittance ID is required' }, { status: 400 });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Please enter a valid amount' }, { status: 400 });
    }

    const result = await updateCodRemittance(id, {
      amount: parseFloat(amount),
      receivedDate: receivedDate || new Date(),
      courier: courier || null,
      paymentMethodId: paymentMethodId || null,
      referenceNumber: referenceNumber || null,
      ordersCount: ordersCount ? parseFloat(ordersCount) : null,
      notes: notes || null,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error updating COD remittance:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(req: Request) {
  try {
    const authResult = await requirePermission('cod:delete');
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Remittance ID is required' }, { status: 400 });
    }

    const result = await deleteCodRemittance(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error deleting COD remittance:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
