import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/campaigns";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // States
await db.insert(schema.states).values([
  { name: "Maharashtra" },
  { name: "Karnataka" },
  { name: "Delhi" },
]);


  // DPD Buckets
  await db.insert(schema.dpdBuckets).values([
    { name: "T-6" },
    { name: "T+5" },
    { name: "T+30" },
    { name: "T+60" },
  ]);

  // Channels
  const [sms] = await db.insert(schema.channels).values({ name: "SMS" }).returning();
  const [whatsapp] = await db.insert(schema.channels).values({ name: "WhatsApp" }).returning();
  const [ivr] = await db.insert(schema.channels).values({ name: "IVR" }).returning();

  // Languages
  const [english] = await db.insert(schema.languages).values({ name: "English" }).returning();
  const [hindi] = await db.insert(schema.languages).values({ name: "Hindi" }).returning();

  // Templates
  await db.insert(schema.templates).values([
    { channelId: sms.id, name: "SMS Default Template" },
    { channelId: whatsapp.id, name: "WhatsApp Default Template" },
    { channelId: ivr.id, name: "IVR Default Template" },
  ]);

  console.log("✅ Seed completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
