import { pgTable, text, serial, integer, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // Admin, Lab Assistant, Lab Incharge, Principal, Store Keeper
  name: text("name").notNull(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemCode: text("item_code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  labName: text("lab_name").notNull(),
  purchaseDate: date("purchase_date").notNull(),
  originalCost: numeric("original_cost").notNull(),
  depreciationRate: numeric("depreciation_rate").notNull(),
  usefulLife: integer("useful_life").notNull(),
  functionalStatus: text("functional_status").notNull(), // Working, Non Working
  approvalStatus: text("approval_status").notNull(), // Active, Pending Approval, Approved, Condemned
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull(),
  generatedBy: integer("generated_by").notNull(),
  date: timestamp("date").defaultNow(),
  functionalStatus: text("functional_status").notNull(),
  recommendation: text("recommendation").notNull(), // Continue Use, Repair, Condemn
  notes: text("notes"),
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  equipmentName: text("equipment_name").notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(),
  labName: text("lab_name").notNull(),
  priority: text("priority").notNull(), // Low, Medium, High
  status: text("status").notNull().default('Requested'), // Requested, Approved, Procured, Added to inventory
  requestedBy: integer("requested_by").notNull(),
  date: timestamp("date").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, date: true });
export const insertRequestSchema = createInsertSchema(requests).omit({ id: true, date: true, status: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventorySchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type RequestItem = typeof requests.$inferSelect;
export type InsertRequestItem = z.infer<typeof insertRequestSchema>;
