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
    if (topic === 'orders/create' || topic === 'orders/updated' || topic === 'orders/fulfilled' || topic === 'orders/partially_fulfilled' || topic === 'orders/paid') {
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
        fulfillments,
      } = payload;
      
      const customerName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : null;
      const customerEmail = customer ? customer.email : null;
      const paymentGateway = Array.isArray(payment_gateway_names) && payment_gateway_names.length > 0
        ? payment_gateway_names.join(', ')
        : (gateway || null);

      let trackingId: string | null = null;
      let trackingCompany: string | null = null;
      let trackingUrl: string | null = null;

      if (Array.isArray(fulfillments) && fulfillments.length > 0) {
        const trackingNumbers = fulfillments
          .map((f: { tracking_number?: string | null; tracking_numbers?: string[] | null }) => 
            f.tracking_number || (Array.isArray(f.tracking_numbers) && f.tracking_numbers.length > 0 ? f.tracking_numbers.join(', ') : null)
          )
          .filter(Boolean);
        if (trackingNumbers.length > 0) {
          trackingId = trackingNumbers.join(', ');
        }

        const companies = fulfillments
          .map((f: { tracking_company?: string | null }) => f.tracking_company)
          .filter(Boolean);
        if (companies.length > 0) {
          trackingCompany = companies.join(', ');
        }

        const urlObj = fulfillments.find((f: { tracking_url?: string | null; tracking_urls?: string[] | null }) => 
          f.tracking_url || (Array.isArray(f.tracking_urls) && f.tracking_urls.length > 0)
        );
        if (urlObj) {
          trackingUrl = urlObj.tracking_url || urlObj.tracking_urls?.[0] || null;
        }
      }

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
        trackingId: trackingId,
        trackingCompany: trackingCompany,
        trackingUrl: trackingUrl,
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
          trackingId: trackingId,
          trackingCompany: trackingCompany,
          trackingUrl: trackingUrl,
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
