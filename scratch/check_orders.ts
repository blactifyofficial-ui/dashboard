import { db } from '../src/db';
import { orders } from '../src/db/schema';
import { asc, desc } from 'drizzle-orm';

async function run() {
  const allOrders = await db.select().from(orders).orderBy(asc(orders.orderNumber));
  console.log('Total orders in DB:', allOrders.length);
  console.log('First 10 orders by number:');
  for (let i = 0; i < Math.min(10, allOrders.length); i++) {
    console.log(`Order: ${allOrders[i].orderNumber} (ID: ${allOrders[i].shopifyOrderId})`);
  }
}
run();
