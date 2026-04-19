/**
 * Project: Jamia Lab Inventory Management System
 * Developed by: JMI University Polytechnic Computer Engg 6th Sem Students
 * Team: Shafaat, Farman, Aqdas, Rihan, Farhan
 */

import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// hashing passwords
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// comparing passwords
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  if (!stored.includes(".")) {
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
