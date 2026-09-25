import { db } from '../src/db';
import { orders } from '../src/db/schema';

async function run() {
  console.log('Deleting all orders from the database...');
  await db.delete(orders);
  console.log('All orders deleted successfully.');
}
run();
