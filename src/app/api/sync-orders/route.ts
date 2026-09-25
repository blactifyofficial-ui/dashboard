import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';

export async function GET() {
  const shop = process.env.SHOPIFY_SHOP_NAME;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shop || !token) {
    return NextResponse.json({ error: 'Missing Shopify credentials' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/orders.json?status=any&limit=250`, {
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
    const fetchedOrders = data.orders || [];

    for (const order of fetchedOrders) {
      const customerName = order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : null;
      const customerEmail = order.customer ? order.customer.email : null;

      await db.insert(orders).values({
        id: order.id.toString(),
        shopifyOrderId: order.id.toString(),
        orderNumber: order.order_number?.toString() || null,
        customerName: customerName,
        customerEmail: customerEmail,
        totalPrice: order.current_total_price,
        currency: order.currency,
        createdAt: order.created_at ? new Date(order.created_at) : undefined,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
      }).onConflictDoUpdate({
        target: orders.shopifyOrderId,
        set: {
          customerName,
          customerEmail,
          totalPrice: order.current_total_price,
          currency: order.currency,
          createdAt: order.created_at ? new Date(order.created_at) : undefined,
          financialStatus: order.financial_status,
          fulfillmentStatus: order.fulfillment_status,
        }
      });

      if (order.line_items && order.line_items.length > 0) {
        for (const item of order.line_items) {
          await db.insert(orderItems).values({
            id: item.id.toString(),
            orderId: order.id.toString(),
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
        }
      }
    }

    return NextResponse.json({ success: true, count: fetchedOrders.length });
  } catch (error) {
    console.error('Error syncing orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
