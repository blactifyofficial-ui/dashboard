import { db } from './index';
import { issueCategories } from './schema';

const categories = [
  { code: 'TRACKING', name: 'Tracking Issue', description: 'Issues related to shipment tracking' },
  { code: 'RTO', name: 'RTO', description: 'Return to origin' },
  { code: 'MISSING_ITEM', name: 'Missing Item', description: 'An item is missing from the order' },
  { code: 'DAMAGED_ITEM', name: 'Damaged Item', description: 'An item was damaged upon receipt' },
  { code: 'DELIVERY', name: 'Delivery Issue', description: 'General delivery problems' },
  { code: 'PAYMENT', name: 'Payment Issue', description: 'Issues with payment or refund' },
  { code: 'RETURN', name: 'Return Issue', description: 'Customer wants to return an item' },
  { code: 'CANCELLATION', name: 'Cancellation Issue', description: 'Customer wants to cancel an order' },
  { code: 'CUSTOMER_COMPLAINT', name: 'Customer Complaint', description: 'General customer complaint' },
  { code: 'OTHER', name: 'Other', description: 'Other miscellaneous issues' }
];

async function seed() {
  for (const category of categories) {
    await db.insert(issueCategories).values({
      id: crypto.randomUUID(),
      code: category.code,
      name: category.name,
      description: category.description,
    }).onConflictDoNothing();
  }
  console.log('Categories seeded!');
  process.exit(0);
}
seed().catch(e => {
  console.error(e);
  process.exit(1);
});
