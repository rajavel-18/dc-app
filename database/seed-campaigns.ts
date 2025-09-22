import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seedCampaignData() {
  try {
    console.log('🌱 Seeding campaign data...');

    // Seed States
    console.log('📍 Seeding states...');
    const states = await db.insert(schema.states).values([
      { name: 'Maharashtra' },
      { name: 'Karnataka' },
      { name: 'Tamil Nadu' },
      { name: 'Gujarat' },
      { name: 'Rajasthan' },
      { name: 'Uttar Pradesh' },
      { name: 'West Bengal' },
      { name: 'Kerala' },
    ]).returning();

    // Seed DPD Buckets
    console.log('📅 Seeding DPD buckets...');
    const dpdBuckets = await db.insert(schema.dpdBuckets).values([
      { name: 'T-7' },
      { name: 'T-6' },
      { name: 'T-5' },
      { name: 'T-4' },
      { name: 'T-3' },
      { name: 'T-2' },
      { name: 'T-1' },
      { name: 'T+0' },
      { name: 'T+1' },
      { name: 'T+2' },
      { name: 'T+3' },
      { name: 'T+4' },
      { name: 'T+5' },
      { name: 'T+6' },
      { name: 'T+7' },
    ]).returning();

    // Seed Channels
    console.log('📱 Seeding channels...');
    const channels = await db.insert(schema.channels).values([
      { name: 'SMS' },
      { name: 'WhatsApp' },
      { name: 'IVR' },
      { name: 'Email' },
      { name: 'Push Notification' },
    ]).returning();

    // Seed Languages
    console.log('🗣️ Seeding languages...');
    const languages = await db.insert(schema.languages).values([
      { name: 'English' },
      { name: 'Hindi' },
      { name: 'Marathi' },
      { name: 'Tamil' },
      { name: 'Telugu' },
      { name: 'Gujarati' },
      { name: 'Bengali' },
      { name: 'Kannada' },
    ]).returning();

    // Seed Templates
    console.log('📝 Seeding templates...');
    const templates = await db.insert(schema.templates).values([
      { channelId: channels[0].id, name: 'Payment Reminder SMS' },
      { channelId: channels[0].id, name: 'Overdue Notice SMS' },
      { channelId: channels[1].id, name: 'Payment Reminder WhatsApp' },
      { channelId: channels[1].id, name: 'Overdue Notice WhatsApp' },
      { channelId: channels[2].id, name: 'Payment Reminder IVR' },
      { channelId: channels[2].id, name: 'Overdue Notice IVR' },
      { channelId: channels[3].id, name: 'Payment Reminder Email' },
      { channelId: channels[3].id, name: 'Overdue Notice Email' },
    ]).returning();

    console.log('✅ Campaign data seeded successfully!');
    console.log(`📍 States: ${states.length}`);
    console.log(`📅 DPD Buckets: ${dpdBuckets.length}`);
    console.log(`📱 Channels: ${channels.length}`);
    console.log(`🗣️ Languages: ${languages.length}`);
    console.log(`📝 Templates: ${templates.length}`);

  } catch (error) {
    console.error('❌ Error seeding campaign data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed function
seedCampaignData()
  .then(() => {
    console.log('🎉 Campaign seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Campaign seeding failed:', error);
    process.exit(1);
  });



