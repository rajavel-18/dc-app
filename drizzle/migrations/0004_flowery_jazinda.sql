CREATE TABLE "approval_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"action" varchar(20) NOT NULL,
	"performed_by" integer NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "submitted_for_approval_at" timestamp;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "approved_by" integer;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "rejected_by" integer;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "rejection_remarks" text;--> statement-breakpoint
ALTER TABLE "approval_audit" ADD CONSTRAINT "approval_audit_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_audit" ADD CONSTRAINT "approval_audit_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;