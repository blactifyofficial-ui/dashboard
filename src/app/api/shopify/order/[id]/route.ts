import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await params;
  const shop = process.env.SHOPIFY_SHOP_NAME;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shop || !token) {
    return NextResponse.json({ error: 'Missing Shopify credentials' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/orders/${id}.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API response status:', response.status);
      console.error('Shopify API response body:', errorText);
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data.order);
  } catch (error) {
    console.error('Error fetching order from Shopify:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
