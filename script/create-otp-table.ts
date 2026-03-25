import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createTable() {
  console.log("Creating otp_verifications table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "otp_verifications" (
        "id" SERIAL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "otp" TEXT NOT NULL,
        "registration_data" TEXT NOT NULL,
        "expires_at" TIMESTAMP NOT NULL
      );
    `);
    console.log("Table created successfully!");
  } catch (err) {
    console.error("Failed to create table:", err);
  }
}

createTable();
