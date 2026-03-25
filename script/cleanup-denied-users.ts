import "dotenv/config";
import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function cleanupDeniedUsers() {
  console.log("Cleaning up denied users...");
  try {
    const result = await db.delete(users).where(eq(users.isApproved, "denied"));
    console.log("Cleanup successful!");
  } catch (err) {
    console.error("Cleanup failed:", err);
  }
}

cleanupDeniedUsers();
