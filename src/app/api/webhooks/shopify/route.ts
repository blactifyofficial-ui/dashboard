import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { enqueueSyncJob } from '@/lib/google-sheets';

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
      const {
        id,
        order_number,
        customer,
        current_total_price,
        currency,
        created_at,
        financial_status,
        fulfillment_status,
        payment_gateway_names,
        gateway,
        line_items,
      } = payload;
      
      const customerName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : null;
      const customerEmail = customer ? customer.email : null;
      const paymentGateway = Array.isArray(payment_gateway_names) && payment_gateway_names.length > 0
        ? payment_gateway_names.join(', ')
        : (gateway || null);

      await db.insert(orders).values({
        id: id.toString(),
        shopifyOrderId: id.toString(),
        orderNumber: order_number?.toString() || null,
        customerName: customerName,
        customerEmail: customerEmail,
        totalPrice: current_total_price,
        currency: currency,
        createdAt: created_at ? new Date(created_at) : undefined,
        financialStatus: financial_status,
        fulfillmentStatus: fulfillment_status,
        paymentGateway: paymentGateway,
      }).onConflictDoUpdate({
        target: orders.shopifyOrderId,
        set: {
          customerName,
          customerEmail,
          totalPrice: current_total_price,
          currency,
          createdAt: created_at ? new Date(created_at) : undefined,
          financialStatus: financial_status,
          fulfillmentStatus: fulfillment_status,
          paymentGateway: paymentGateway,
        }
      });

      // Automatically sync order to Google Sheets
      void enqueueSyncJob({
        entity: 'orders',
        databaseId: id.toString(),
        operation: 'UPDATE',
      });

      // Sync line items if provided in webhook payload
      if (Array.isArray(line_items) && line_items.length > 0) {
        for (const item of line_items) {
          if (!item.id) continue;
          await db.insert(orderItems).values({
            id: item.id.toString(),
            orderId: id.toString(),
            shopifyProductId: item.product_id?.toString() || null,
            title: item.title,
            quantity: item.quantity?.toString() || '0',
            price: item.price,
          }).onConflictDoUpdate({
            target: orderItems.id,
            set: {
              title: item.title,
              quantity: item.quantity?.toString() || '0',
              price: item.price,
            }
          });

          void enqueueSyncJob({
            entity: 'order_items',
            databaseId: item.id.toString(),
            operation: 'UPDATE',
          });
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
