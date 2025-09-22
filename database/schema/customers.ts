import { pgTable, serial, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { states, dpdBuckets } from './campaigns';

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  // minimal profile for matching
  stateId: integer('state_id').references(() => states.id).notNull(),
  dpdId: integer('dpd_id').references(() => dpdBuckets.id).notNull(),
  borrowerType: varchar('borrower_type', { length: 50 }), // New/Old
  segment: varchar('segment', { length: 100 }),
  productGroup: varchar('product_group', { length: 100 }),
  productType: varchar('product_type', { length: 100 }),
  subProductType: varchar('sub_product_type', { length: 100 }),
  productVariant: varchar('product_variant', { length: 100 }),
  schemeName: varchar('scheme_name', { length: 150 }),
  schemeCode: varchar('scheme_code', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const campaignAssignments = pgTable('campaign_assignments', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').notNull(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
});

export const assignmentAudit = pgTable('assignment_audit', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(), // ASSIGN | NO_MATCH | ERROR
  details: varchar('details', { length: 2000 }),
  createdAt: timestamp('created_at').defaultNow(),
});


