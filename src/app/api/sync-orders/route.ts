import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';

interface ShopifyLineItem {
  id: number;
  product_id?: number | string | null;
  title: string;
  quantity: number;
  price: string;
}

interface ShopifyOrder {
  id: number;
  order_number?: number | string | null;
  customer?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  current_total_price: string;
  currency: string;
  created_at?: string | null;
  financial_status: string;
  fulfillment_status: string;
  line_items?: ShopifyLineItem[] | null;
}

interface ShopifyProduct {
  id: number;
  image?: {
    src: string;
  } | null;
}

import { requireAuth } from '@/lib/auth-utils';

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

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

    // Extract unique product IDs
    const productIds = new Set<string>();
    fetchedOrders.forEach((order: ShopifyOrder) => {
      if (order.line_items) {
        order.line_items.forEach((item: ShopifyLineItem) => {
          if (item.product_id) productIds.add(item.product_id.toString());
        });
      }
    });

    // Fetch product images
    const productImages: Record<string, string> = {};
    if (productIds.size > 0) {
      const pIds = Array.from(productIds);
      // Shopify allows up to 250 ids per request
      const chunkSize = 250;
      for (let i = 0; i < pIds.length; i += chunkSize) {
        const chunk = pIds.slice(i, i + chunkSize);
        const pResponse = await fetch(`https://${shop}/admin/api/2024-01/products.json?ids=${chunk.join(',')}&fields=id,image`, {
          headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json',
          }
        });
        if (pResponse.ok) {
          const pData = await pResponse.json();
          if (pData.products) {
            pData.products.forEach((p: ShopifyProduct) => {
              if (p.image && p.image.src) {
                productImages[p.id.toString()] = p.image.src;
              }
            });
          }
        }
      }
    }

    for (const order of fetchedOrders as ShopifyOrder[]) {

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
            imageUrl: item.product_id ? productImages[item.product_id] || null : null,
          }).onConflictDoUpdate({
            target: orderItems.id,
            set: {
              title: item.title,
              quantity: item.quantity?.toString() || '0',
              price: item.price,
              imageUrl: item.product_id ? productImages[item.product_id] || null : null,
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
