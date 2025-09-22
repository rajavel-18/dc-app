CREATE TABLE "assignment_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"action" varchar(50) NOT NULL,
	"details" varchar(2000),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_id" integer NOT NULL,
	"dpd_id" integer NOT NULL,
	"borrower_type" varchar(50),
	"segment" varchar(100),
	"product_group" varchar(100),
	"product_type" varchar(100),
	"sub_product_type" varchar(100),
	"product_variant" varchar(100),
	"scheme_name" varchar(150),
	"scheme_code" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "assigned_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_assignments" ADD CONSTRAINT "campaign_assignments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_dpd_id_dpd_buckets_id_fk" FOREIGN KEY ("dpd_id") REFERENCES "public"."dpd_buckets"("id") ON DELETE no action ON UPDATE no action;