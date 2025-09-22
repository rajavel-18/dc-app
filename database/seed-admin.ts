import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/users";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seedAdmin() {
  console.log("🌱 Seeding roles and admin user...");

  // Roles
  const rolesToInsert = ["Admin", "Checker", "Executor", "System"];
  for (const r of rolesToInsert) {
    const existing = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.name, r));
    if (!existing.length) {
      await db.insert(schema.roles).values({ name: r });
      console.log(`✅ Role added: ${r}`);
    }
  }

  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  const existingUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail));

  if (!existingUsers.length) {
    const hashed = await bcrypt.hash(adminPassword, 10);

    const [user] = await db
      .insert(schema.users)
      .values({
        email: adminEmail,
        password: hashed,
        fullName: "System Admin",
      })
      .returning();

    const [adminRole] = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.name, "Admin"));

    if (adminRole) {
      await db.insert(schema.userRoles).values({
        userId: user.id,
        roleId: adminRole.id,
      });
    }

    console.log(
      `✅ Admin user created: ${adminEmail} (password: ${adminPassword})`
    );
  } else {
    console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
  }

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
