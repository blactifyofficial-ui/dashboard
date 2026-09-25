import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { orders } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('X-Shopify-Hmac-Sha256');
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!secret || !hmacHeader) {
      return NextResponse.json({ error: 'Missing secret or signature' }, { status: 401 });
    }

    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (hash !== hmacHeader) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    
    // Check webhook topic
    const topic = req.headers.get('X-Shopify-Topic');
    if (topic === 'orders/create' || topic === 'orders/updated') {
      const { id, order_number, customer, current_total_price, currency, financial_status, fulfillment_status } = payload;
      
      const customerName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : null;
      const customerEmail = customer ? customer.email : null;

      await db.insert(orders).values({
        id: id.toString(),
        shopifyOrderId: id.toString(),
        orderNumber: order_number?.toString() || null,
        customerName: customerName,
        customerEmail: customerEmail,
        totalPrice: current_total_price,
        currency: currency,
        financialStatus: financial_status,
        fulfillmentStatus: fulfillment_status,
      }).onConflictDoUpdate({
        target: orders.shopifyOrderId,
        set: {
          customerName,
          customerEmail,
          totalPrice: current_total_price,
          currency,
          financialStatus: financial_status,
          fulfillmentStatus: fulfillment_status,
        }
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
