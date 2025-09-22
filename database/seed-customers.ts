import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seedCustomers() {
  console.log('🌱 Seeding customers...');
  await db.insert(schema.customers).values([
    { stateId: 1, dpdId: 1, borrowerType: 'New', segment: 'Retail', productGroup: 'Lending', productType: 'PL', subProductType: 'PL-Std', productVariant: 'Variant-A', schemeName: 'Festive', schemeCode: 'FSTV25' },
    { stateId: 1, dpdId: 1, borrowerType: 'Old', segment: 'SME', productGroup: 'Cards', productType: 'Credit Card', subProductType: 'Gold', productVariant: 'Visa', schemeName: 'Diwali', schemeCode: 'DIW25' },
    { stateId: 2, dpdId: 3, borrowerType: 'New', segment: 'Corporate', productGroup: 'Lending', productType: 'Home Loan', subProductType: 'HL-Floating', productVariant: 'Variant-B', schemeName: 'New Year', schemeCode: 'NY26' },
    { stateId: 5, dpdId: 10, borrowerType: 'Old', segment: 'Retail', productGroup: 'Lending', productType: 'Auto Loan', subProductType: 'AL-Std', productVariant: 'Variant-C', schemeName: 'Festive-Plus', schemeCode: 'FSTV25P' },
  ]);
  console.log('✅ Customers seeded');
}

seedCustomers()
  .then(() => pool.end())
  .catch((e) => { console.error(e); pool.end(); process.exit(1); });


