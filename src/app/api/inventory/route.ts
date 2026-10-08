import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface ProductVariantData {
  id: number;
  productId: number;
  title: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  compareAtPrice: number | null;
  inventoryQuantity: number;
  potentialRevenue: number;
  potentialMRPValue: number;
}

export interface InventoryProduct {
  id: number;
  title: string;
  vendor: string;
  productType: string;
  status: string;
  imageUrl: string | null;
  handle: string;
  shopifyAdminUrl: string;
  totalStock: number;
  potentialRevenue: number;
  potentialMRPValue: number;
  minPrice: number;
  maxPrice: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  variants: ProductVariantData[];
}

export interface InventoryResponse {
  success: boolean;
  storeName: string;
  currency: string;
  summary: {
    totalProducts: number;
    totalActiveProducts: number;
    totalVariants: number;
    totalStockUnits: number;
    totalPotentialRevenue: number;
    totalMRPValuation: number;
    potentialDiscountValue: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    avgUnitSellingPrice: number;
  };
  products: InventoryProduct[];
  fetchedAt: string;
  error?: string;
}

export async function GET() {
  const shop = process.env.SHOPIFY_SHOP_NAME;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shop || !token) {
    return NextResponse.json(
      { error: 'Shopify credentials not configured (SHOPIFY_SHOP_NAME or SHOPIFY_ADMIN_ACCESS_TOKEN)' },
      { status: 500 }
    );
  }

  try {
    // 1. Fetch store info
    let storeName = 'Blactify Store';
    let currency = 'INR';
    const storeShortName = shop.replace('.myshopify.com', '');

    try {
      const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        if (shopData.shop) {
          storeName = shopData.shop.name || storeName;
          currency = shopData.shop.currency || currency;
        }
      }
    } catch (err) {
      console.warn('Could not fetch shop details:', err);
    }

    // 2. Fetch all products (handle link header pagination)
    let url: string | null = `https://${shop}/admin/api/2024-01/products.json?limit=250`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawProducts: any[] = [];

    while (url) {
      const res: Response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Shopify API error (${res.status}): ${errorText}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      if (Array.isArray(data.products)) {
        rawProducts.push(...data.products);
      }

      const linkHeader = res.headers.get('link') || res.headers.get('Link');
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        url = match ? match[1] : null;
      } else {
        url = null;
      }
    }

    // 3. Process products & inventory metrics
    let totalStockUnits = 0;
    let totalPotentialRevenue = 0;
    let totalMRPValuation = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalVariants = 0;
    let totalActiveProducts = 0;

    const products: InventoryProduct[] = rawProducts.map((p) => {
      const isActive = p.status === 'active';
      if (isActive) totalActiveProducts++;

      let productStock = 0;
      let productPotentialRevenue = 0;
      let productPotentialMRP = 0;
      let minPrice = Infinity;
      let maxPrice = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variants: ProductVariantData[] = (p.variants || []).map((v: any) => {
        totalVariants++;
        const qty = typeof v.inventory_quantity === 'number' ? v.inventory_quantity : 0;
        const price = parseFloat(v.price) || 0;
        const compareAtPrice = v.compare_at_price ? parseFloat(v.compare_at_price) : null;
        const effectiveMRP = compareAtPrice !== null && compareAtPrice > price ? compareAtPrice : price;

        const variantPotentialRevenue = qty > 0 ? qty * price : 0;
        const variantPotentialMRP = qty > 0 ? qty * effectiveMRP : 0;

        productStock += qty;
        productPotentialRevenue += variantPotentialRevenue;
        productPotentialMRP += variantPotentialMRP;

        if (price < minPrice) minPrice = price;
        if (price > maxPrice) maxPrice = price;

        return {
          id: v.id,
          productId: p.id,
          title: v.title === 'Default Title' ? 'Standard' : v.title,
          sku: v.sku || null,
          barcode: v.barcode || null,
          price,
          compareAtPrice,
          inventoryQuantity: qty,
          potentialRevenue: variantPotentialRevenue,
          potentialMRPValue: variantPotentialMRP,
        };
      });

      if (minPrice === Infinity) minPrice = 0;

      // Stock status classification
      let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (productStock <= 0) {
        stockStatus = 'OUT_OF_STOCK';
        outOfStockCount++;
      } else if (productStock <= 5) {
        stockStatus = 'LOW_STOCK';
        lowStockCount++;
      } else {
        stockStatus = 'IN_STOCK';
        inStockCount++;
      }

      totalStockUnits += productStock > 0 ? productStock : 0;
      totalPotentialRevenue += productPotentialRevenue;
      totalMRPValuation += productPotentialMRP;

      const imageUrl = p.image?.src || (p.images && p.images.length > 0 ? p.images[0].src : null);
      const shopifyAdminUrl = `https://admin.shopify.com/store/${storeShortName}/products/${p.id}`;

      return {
        id: p.id,
        title: p.title,
        vendor: p.vendor || 'Blactify',
        productType: p.product_type || 'General',
        status: p.status,
        imageUrl,
        handle: p.handle || '',
        shopifyAdminUrl,
        totalStock: productStock,
        potentialRevenue: productPotentialRevenue,
        potentialMRPValue: productPotentialMRP,
        minPrice,
        maxPrice,
        stockStatus,
        variants,
      };
    });

    const avgUnitSellingPrice = totalStockUnits > 0 ? totalPotentialRevenue / totalStockUnits : 0;
    const potentialDiscountValue = Math.max(0, totalMRPValuation - totalPotentialRevenue);

    const response: InventoryResponse = {
      success: true,
      storeName,
      currency,
      summary: {
        totalProducts: products.length,
        totalActiveProducts,
        totalVariants,
        totalStockUnits,
        totalPotentialRevenue,
        totalMRPValuation,
        potentialDiscountValue,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        avgUnitSellingPrice,
      },
      products,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching inventory and valuation from Shopify:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch inventory from Shopify',
      },
      { status: 500 }
    );
  }
}
