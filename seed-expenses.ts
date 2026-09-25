import { db } from './src/db';
import { expenseCategories, paymentMethods } from './src/db/schema';


const categories = [
  { code: 'PURCHASES', name: 'Purchases', description: 'General purchases' },
  { code: 'FUEL', name: 'Fuel', description: 'Fuel expenses' },
  { code: 'RECHARGE', name: 'Recharge', description: 'Mobile and internet recharges' },
  { code: 'RENT', name: 'Rent', description: 'Office or equipment rent' },
  { code: 'MODEL', name: 'Model', description: 'Model payments' },
  { code: 'SHOOT', name: 'Shoot Expense', description: 'Photoshoot expenses' },
  { code: 'OTHER', name: 'Other', description: 'Other expenses' },
];

const methods = [
  { code: 'CASH', name: 'Cash' },
  { code: 'UPI', name: 'UPI' },
  { code: 'BANK_TRANSFER', name: 'Bank Transfer' },
  { code: 'CARD', name: 'Card' },
  { code: 'CREDIT', name: 'Credit' },
  { code: 'WALLET', name: 'Wallet' },
  { code: 'OTHER', name: 'Other' },
];

async function seed() {
  console.log('Seeding expense categories and payment methods...');
  for (const cat of categories) {
    await db.insert(expenseCategories).values({
      id: crypto.randomUUID(),
      code: cat.code,
      name: cat.name,
      description: cat.description,
    }).onConflictDoNothing({ target: expenseCategories.code });
  }

  for (const m of methods) {
    await db.insert(paymentMethods).values({
      id: crypto.randomUUID(),
      code: m.code,
      name: m.name,
    }).onConflictDoNothing({ target: paymentMethods.code });
  }
  console.log('Done seeding.');
}

seed().catch(console.error).finally(() => process.exit(0));
