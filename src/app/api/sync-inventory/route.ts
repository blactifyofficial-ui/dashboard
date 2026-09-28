import { NextResponse } from 'next/server';
import { db } from '@/db';
import { inventory } from '@/db/schema';
import { requireAuth } from '@/lib/auth-utils';

interface ShopifyVariant {
  sku: string;
  inventory_quantity: number;
  price: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  image?: {
    src: string;
  } | null;
  variants?: ShopifyVariant[];
}

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
    const response = await fetch(`https://${shop}/admin/api/2024-01/products.json?limit=250`, {
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
    const products = data.products || [];

    for (const product of products as ShopifyProduct[]) {
      const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
      
      await db.insert(inventory).values({
        id: product.id.toString(),
        shopifyProductId: product.id.toString(),
        title: product.title,
        sku: firstVariant?.sku || null,
        inventoryQuantity: firstVariant?.inventory_quantity?.toString() || '0',
        price: firstVariant?.price || '0',
        imageUrl: product.image?.src || null,
      }).onConflictDoUpdate({
        target: inventory.shopifyProductId,
        set: {
          title: product.title,
          sku: firstVariant?.sku || null,
          inventoryQuantity: firstVariant?.inventory_quantity?.toString() || '0',
          price: firstVariant?.price || '0',
          imageUrl: product.image?.src || null,
          updatedAt: new Date(),
        }
      });
    }

    return NextResponse.json({ success: true, count: products.length });
  } catch (error) {
    console.error('Error syncing inventory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
