/**
 * Project: Jamia Lab Inventory Management System
 * Developed by: JMI University Polytechnic Computer Engg 6th Sem Students
 * Team: Shafaat, Farman, Aqdas, Rihan, Farhan
 */

import { db } from "./db";
import {
  users, inventory, reports, requests, otpVerifications,
  type User, type InsertUser,
  type InventoryItem, type InsertInventoryItem,
  type Report, type InsertReport,
  type RequestItem, type InsertRequestItem,
  deadInventory, type DeadInventoryItem, type InsertDeadInventoryItem
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;

  getInventory(): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<void>;

  getReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReportStatus(id: number, status: string): Promise<Report | undefined>;

  getRequests(): Promise<RequestItem[]>;
  createRequest(request: InsertRequestItem): Promise<RequestItem>;
  updateRequestStatus(id: number, status: string, fromStatus?: string): Promise<RequestItem | undefined>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: number, password: string): Promise<void>;
  deleteUser(id: number): Promise<void>;
  upsertOTP(email: string, otp: string, registrationData: string, expiresAt: Date): Promise<void>;
  getOTP(email: string): Promise<{ otp: string; registrationData: string; expiresAt: Date } | undefined>;
  deleteOTP(email: string): Promise<void>;
  getApprovedCondemnationReport(articleId: number): Promise<Report | undefined>;

  getDeadInventory(): Promise<DeadInventoryItem[]>;
  getDeadInventoryItem(id: number): Promise<DeadInventoryItem | undefined>;
  createDeadInventoryItem(item: InsertDeadInventoryItem): Promise<DeadInventoryItem>;
  deleteDeadInventoryItem(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getInventory(): Promise<InventoryItem[]> {
    return await db.select().from(inventory).orderBy(desc(inventory.id));
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [newItem] = await db.insert(inventory).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [updated] = await db.update(inventory)
      .set(updates)
      .where(eq(inventory.id, id))
      .returning();
    return updated;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  async getReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.id));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async updateReportStatus(id: number, status: string): Promise<Report | undefined> {
    const [updated] = await db.update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning();
    return updated;
  }

  async getRequests(): Promise<RequestItem[]> {
    return await db.select().from(requests).orderBy(desc(requests.id));
  }

  async createRequest(request: InsertRequestItem): Promise<RequestItem> {
    const [newRequest] = await db.insert(requests).values(request).returning();
    return newRequest;
  }

  async updateRequestStatus(id: number, status: string, fromStatus?: string): Promise<RequestItem | undefined> {
    let query = db.update(requests).set({ status }).where(eq(requests.id, id));
    if (fromStatus) {
      query = db.update(requests).set({ status }).where(and(eq(requests.id, id), eq(requests.status, fromStatus)));
    }
    const [updated] = await query.returning();
    return updated;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    await db.update(users)
      .set({ password })
      .where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async upsertOTP(email: string, otp: string, registrationData: string, expiresAt: Date): Promise<void> {
    // Upsert using onConflictDoUpdate
    await db.insert(otpVerifications)
      .values({ email, otp, registrationData, expiresAt })
      .onConflictDoUpdate({
        target: otpVerifications.email,
        set: { otp, registrationData, expiresAt }
      });
  }

  async getOTP(email: string): Promise<{ otp: string; registrationData: string; expiresAt: Date } | undefined> {
    const [record] = await db.select().from(otpVerifications).where(eq(otpVerifications.email, email));
    return record;
  }

  async deleteOTP(email: string): Promise<void> {
    await db.delete(otpVerifications).where(eq(otpVerifications.email, email));
  }

  async getApprovedCondemnationReport(articleId: number): Promise<Report | undefined> {
    const [report] = await db.select()
      .from(reports)
      .where(
        and(
          eq(reports.articleId, articleId),
          eq(reports.recommendation, "Condemn"),
          eq(reports.status, "Approved")
        )
      );
    return report;
  }

  async getDeadInventory(): Promise<DeadInventoryItem[]> {
    return await db.select().from(deadInventory).orderBy(desc(deadInventory.id));
  }

  async getDeadInventoryItem(id: number): Promise<DeadInventoryItem | undefined> {
    const [item] = await db.select().from(deadInventory).where(eq(deadInventory.id, id));
    return item;
  }

  async createDeadInventoryItem(item: InsertDeadInventoryItem): Promise<DeadInventoryItem> {
    const [newItem] = await db.insert(deadInventory).values(item).returning();
    return newItem;
  }

  async deleteDeadInventoryItem(id: number): Promise<void> {
    await db.delete(deadInventory).where(eq(deadInventory.id, id));
  }
}

export const storage = new DatabaseStorage();
