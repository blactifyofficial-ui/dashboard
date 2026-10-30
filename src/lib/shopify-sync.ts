import { db } from '@/db';
import { orders, orderItems, codCollectionActivities } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { enqueueSyncJob } from '@/lib/google-sheets';

export interface ShopifyLineItem {
  id: number;
  product_id?: number | string | null;
  title: string;
  quantity: number;
  price: string;
}

export interface ShopifyFulfillment {
  id?: number;
  tracking_number?: string | null;
  tracking_numbers?: string[] | null;
  tracking_company?: string | null;
  tracking_url?: string | null;
  tracking_urls?: string[] | null;
  status?: string | null;
}

export interface ShopifyOrder {
  id: number;
  order_number?: number | string | null;
  customer?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  current_total_price: string;
  total_outstanding?: string | null;
  currency: string;
  created_at?: string | null;
  financial_status: string;
  fulfillment_status: string;
  payment_gateway_names?: string[] | null;
  gateway?: string | null;
  line_items?: ShopifyLineItem[] | null;
  fulfillments?: ShopifyFulfillment[] | null;
}

interface ShopifyProduct {
  id: number;
  image?: {
    src: string;
  } | null;
}

export interface SyncOptions {
  limit?: number;
  status?: string;
  pruneDeleted?: boolean;
}

export interface SyncResult {
  success: boolean;
  count: number;
  deletedCount?: number;
  message?: string;
  syncedAt: string;
  error?: string;
}

/**
 * Deletes an order and its associated records (order items, COD activities)
 * from the local database, and enqueues Google Sheets sync deletion.
 */
export async function deleteLocalOrder(orderIdOrShopifyId: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .where(or(eq(orders.id, orderIdOrShopifyId), eq(orders.shopifyOrderId, orderIdOrShopifyId)))
    .limit(1);

  if (!existing) {
    return false;
  }

  // 1. Fetch line items to enqueue their deletion for Google Sheets
  const items = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.orderId, existing.id));

  for (const item of items) {
    void enqueueSyncJob({
      entity: 'order_items',
      databaseId: item.id,
      operation: 'DELETE',
    });
  }

  // 2. Delete line items from DB
  await db.delete(orderItems).where(eq(orderItems.orderId, existing.id));

  // 3. Delete COD collection activities from DB
  await db.delete(codCollectionActivities).where(eq(codCollectionActivities.orderId, existing.id));

  // 4. Delete the order itself
  await db.delete(orders).where(eq(orders.id, existing.id));

  // 5. Enqueue order deletion for Google Sheets
  void enqueueSyncJob({
    entity: 'orders',
    databaseId: existing.id,
    operation: 'DELETE',
  });

  return true;
}

/**
 * Core function to fetch and sync orders and line items from Shopify Admin API into PostgreSQL.
 * Runs periodically to keep PostgreSQL fresh and consistent with Shopify.
 * If orders are deleted in Shopify, it prunes them from the local database.
 */
export async function syncShopifyOrders(options: SyncOptions = {}): Promise<SyncResult> {
  const shop = process.env.SHOPIFY_SHOP_NAME;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shop || !token) {
    throw new Error('Missing Shopify credentials (SHOPIFY_SHOP_NAME or SHOPIFY_ADMIN_ACCESS_TOKEN)');
  }

  const limit = options.limit || 250;
  const status = options.status || 'any';
  const pruneDeleted = options.pruneDeleted ?? (status === 'any');

  // Fetch all orders from Shopify with pagination support
  const fetchedOrders: ShopifyOrder[] = [];
  let nextUrl: string | null = `https://${shop}/admin/api/2024-01/orders.json?status=${status}&limit=${limit}`;

  while (nextUrl) {
    const response: Response = await fetch(nextUrl, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      // Prevent Next.js from caching Shopify API responses
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API response status:', response.status);
      console.error('Shopify API response body:', errorText);
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.orders && Array.isArray(data.orders)) {
      fetchedOrders.push(...data.orders);
    }

    const linkHeader: string | null = response.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = match ? match[1] : null;
    } else {
      nextUrl = null;
    }
  }

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
    const chunkSize = 250;
    for (let i = 0; i < pIds.length; i += chunkSize) {
      const chunk = pIds.slice(i, i + chunkSize);
      const pResponse = await fetch(`https://${shop}/admin/api/2024-01/products.json?ids=${chunk.join(',')}&fields=id,image`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
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

  for (const order of fetchedOrders) {
    const customerName = order.customer
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
      : null;
    const customerEmail = order.customer ? order.customer.email : null;
    const paymentGateway = order.payment_gateway_names && order.payment_gateway_names.length > 0
      ? order.payment_gateway_names.join(', ')
      : (order.gateway || null);

    const trackingId = order.fulfillments && order.fulfillments.length > 0
      ? order.fulfillments
          .map((f) => f.tracking_number || (f.tracking_numbers && f.tracking_numbers.length > 0 ? f.tracking_numbers.join(', ') : null))
          .filter(Boolean)
          .join(', ') || null
      : null;

    const trackingCompany = order.fulfillments && order.fulfillments.length > 0
      ? order.fulfillments
          .map((f) => f.tracking_company)
          .filter(Boolean)
          .join(', ') || null
      : null;

    const trackingUrl = order.fulfillments && order.fulfillments.length > 0
      ? (order.fulfillments.find((f) => f.tracking_url)?.tracking_url || 
         order.fulfillments.find((f) => f.tracking_urls && f.tracking_urls.length > 0)?.tracking_urls?.[0] || null)
      : null;

    const totalOutstanding = order.total_outstanding !== undefined && order.total_outstanding !== null
      ? order.total_outstanding
      : (order.financial_status === 'paid' ? '0' : order.current_total_price);

    await db.insert(orders).values({
      id: order.id.toString(),
      shopifyOrderId: order.id.toString(),
      orderNumber: order.order_number?.toString() || null,
      customerName: customerName,
      customerEmail: customerEmail,
      totalPrice: order.current_total_price,
      totalOutstanding: totalOutstanding,
      currency: order.currency,
      createdAt: order.created_at ? new Date(order.created_at) : undefined,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      paymentGateway: paymentGateway,
      trackingId: trackingId,
      trackingCompany: trackingCompany,
      trackingUrl: trackingUrl,
    }).onConflictDoUpdate({
      target: orders.shopifyOrderId,
      set: {
        customerName,
        customerEmail,
        totalPrice: order.current_total_price,
        totalOutstanding: totalOutstanding,
        currency: order.currency,
        createdAt: order.created_at ? new Date(order.created_at) : undefined,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
        paymentGateway: paymentGateway,
        trackingId: trackingId,
        trackingCompany: trackingCompany,
        trackingUrl: trackingUrl,
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

  // Prune orders that were deleted in Shopify
  let deletedCount = 0;
  if (pruneDeleted) {
    const activeShopifyOrderIds = new Set(fetchedOrders.map((o) => o.id.toString()));
    const existingOrders = await db
      .select({ id: orders.id, shopifyOrderId: orders.shopifyOrderId, orderNumber: orders.orderNumber })
      .from(orders);

    const ordersToDelete = existingOrders.filter(
      (order) => !activeShopifyOrderIds.has(order.shopifyOrderId)
    );

    if (ordersToDelete.length > 0) {
      console.log(
        `[Shopify Sync] Found ${ordersToDelete.length} deleted order(s) in Shopify. Pruning from DB:`,
        ordersToDelete.map((o) => `#${o.orderNumber || o.id}`)
      );

      for (const order of ordersToDelete) {
        await deleteLocalOrder(order.id);
        deletedCount++;
      }
    }
  }

  const message = deletedCount > 0
    ? `Successfully synced ${fetchedOrders.length} orders (${deletedCount} deleted order${deletedCount > 1 ? 's' : ''} removed to match Shopify).`
    : `Successfully synced ${fetchedOrders.length} orders from Shopify.`;

  return {
    success: true,
    count: fetchedOrders.length,
    deletedCount,
    message,
    syncedAt: new Date().toISOString(),
  };
}
