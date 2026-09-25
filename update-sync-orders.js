/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const file = fs.readFileSync('src/app/api/sync-orders/route.ts', 'utf8');

const replacement = `
    const data = await response.json();
    const fetchedOrders = data.orders || [];

    // Extract unique product IDs
    const productIds = new Set();
    fetchedOrders.forEach(order => {
      if (order.line_items) {
        order.line_items.forEach(item => {
          if (item.product_id) productIds.add(item.product_id);
        });
      }
    });

    // Fetch product images
    const productImages = {};
    if (productIds.size > 0) {
      const pIds = Array.from(productIds);
      // Shopify allows up to 250 ids per request, we can just do one chunk if it's less
      const pResponse = await fetch(\`https://\${shop}/admin/api/2024-01/products.json?ids=\${pIds.join(',')}&fields=id,image\`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        }
      });
      if (pResponse.ok) {
        const pData = await pResponse.json();
        if (pData.products) {
          pData.products.forEach(p => {
            if (p.image && p.image.src) {
              productImages[p.id] = p.image.src;
            }
          });
        }
      }
    }

    for (const order of fetchedOrders) {
`;

const updated = file.replace(/const data = await response\.json\(\);\n    const fetchedOrders = data\.orders \|\| \[\];\n\n    for \(const order of fetchedOrders\) \{/, replacement);

const lineItemReplacement = `
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
`;

const updated2 = updated.replace(/          await db\.insert\(orderItems\)\.values\(\{[\s\S]*?\}\);/, lineItemReplacement.trim());

fs.writeFileSync('src/app/api/sync-orders/route.ts', updated2);
