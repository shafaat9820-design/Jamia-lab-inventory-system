import "dotenv/config";
import { db } from "../server/db";
import { users, reports, requests } from "./schema";
import { sql } from "drizzle-orm";

async function clearTables() {
  console.log("Starting database cleanup...");
  
  try {
    // Disable triggers if necessary, but Drizzle should handle normal deletes
    // We clear in order to avoid foreign key violations
    
    console.log("Clearing reports...");
    await db.delete(reports);
    
    console.log("Clearing requests...");
    await db.delete(requests);
    
    console.log("Clearing users...");
    await db.delete(users);
    
    console.log("Database tables cleared successfully (except inventory).");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

clearTables();
