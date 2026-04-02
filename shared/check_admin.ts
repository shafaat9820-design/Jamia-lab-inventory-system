import "dotenv/config";
import { db } from "../server/db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function checkAdmin() {
  const adminEmail = "shafaat9820@gmail.com";
  const existing = await db.select().from(users).where(eq(users.email, adminEmail));
  
  if (existing.length === 0) {
    console.log("No admin found. Attempting manual insert...");
    await db.insert(users).values({
      email: adminEmail,
      password: "admin123",
      role: "Admin",
      name: "Institutional Admin",
      isApproved: "true"
    });
    console.log("Admin inserted successfully.");
  } else {
    console.log("Admin exists:", existing[0]);
    await db.update(users)
      .set({ role: "Admin", isApproved: "true", password: "admin123" })
      .where(eq(users.id, existing[0].id));
    console.log("Admin updated successfully.");
  }
}

checkAdmin().catch(console.error);
