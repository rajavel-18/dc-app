-- Add missing columns to users to match Drizzle schema
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL, 
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();





