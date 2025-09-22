import { pgTable, serial, text, integer, date, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

// Master tables
export const states = pgTable("states", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
});

export const dpdBuckets = pgTable("dpd_buckets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // e.g., T-6, T+5
});

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // SMS, WhatsApp, IVR
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
});

export const languages = pgTable("languages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
});

// Campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).unique().notNull(),
  stateId: integer("state_id").references(() => states.id).notNull(),
  dpdId: integer("dpd_id").references(() => dpdBuckets.id).notNull(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  templateId: integer("template_id").references(() => templates.id).notNull(),
  languageId: integer("language_id").references(() => languages.id).notNull(),
  retries: integer("retries").default(0).notNull(),
  retryIntervalMinutes: integer("retry_interval_minutes").default(0).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("Draft").notNull(),
  conditionCount: integer("condition_count").default(0).notNull(),
  assignedCount: integer("assigned_count").default(0).notNull(),
  // UC-001 optional filters (nullable)
  borrowerType: varchar("borrower_type", { length: 50 }),
  segment: varchar("segment", { length: 100 }),
  productGroup: varchar("product_group", { length: 100 }),
  productType: varchar("product_type", { length: 100 }),
  subProductType: varchar("sub_product_type", { length: 100 }),
  productVariant: varchar("product_variant", { length: 100 }),
  schemeName: varchar("scheme_name", { length: 150 }),
  schemeCode: varchar("scheme_code", { length: 100 }),
  // UC-4.1.3 approval fields
  submittedForApprovalAt: timestamp("submitted_for_approval_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectedBy: integer("rejected_by").references(() => users.id),
  rejectionRemarks: text("rejection_remarks"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Optional Filters
export const campaignFilters = pgTable("campaign_filters", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
  key: varchar("key", { length: 100 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
});

// UC-4.1.3 Approval Audit
export const approvalAudit = pgTable("approval_audit", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
  action: varchar("action", { length: 20 }).notNull(), // 'SUBMIT', 'APPROVE', 'REJECT'
  performedBy: integer("performed_by").references(() => users.id).notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});
