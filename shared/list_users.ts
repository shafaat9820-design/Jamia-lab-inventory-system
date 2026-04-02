import "dotenv/config";
import { db } from "../server/db";
import { users } from "./schema";

async function listAllUsers() {
  const all = await db.select().from(users);
  console.log("ALL USERS IN DB:", all);
}

listAllUsers().catch(console.error);
