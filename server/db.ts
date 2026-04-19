/**
 * Project: Jamia Lab Inventory Management System
 * Developed by: JMI University Polytechnic Computer Engg 6th Sem Students
 * Team: Shafaat, Farman, Aqdas, Rihan, Farhan
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
