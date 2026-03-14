import { pgTable, text, serial, integer, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  // EMAIL LOGIN
  email: text("email").notNull().unique(),

  password: text("password").notNull(),

  role: text("role").notNull(), // Admin, Lab Assistant, Lab Incharge, Principal, Store Keeper

  name: text("name").notNull(),

  firstName: text("first_name"),
  lastName: text("last_name"),
  age: integer("age"),
  gender: text("gender"),
  employeeId: text("employee_id"),
  contactNumber: text("contact_number"),
  dateOfJoining: date("date_of_joining"),
  profileImage: text("profile_image"),

  department: text("department").default("Department of Computer Engineering"),
  institution: text("institution").default("Jamia Millia Islamia"),
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
  status: text("status").notNull().default("Requested"),
  requestedBy: integer("requested_by").notNull(),
  date: timestamp("date").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const registerUserSchema = createInsertSchema(users).omit({ id: true });
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, date: true });
export const insertRequestSchema = createInsertSchema(requests).omit({ id: true, date: true, status: true });

export const updateProfileSchema = z.object({
  firstName: z.string().regex(/^[A-Za-z]+$/, "Only alphabets allowed").min(1, "Required"),
  lastName: z.string().regex(/^[A-Za-z]+$/, "Only alphabets allowed").min(1, "Required"),
  age: z.coerce.number().min(18).max(70),
  gender: z.enum(["Male", "Female", "Other"]),
  employeeId: z.string().min(1, "Required"),
  contactNumber: z.string().length(10, "Must be 10 digits").regex(/^\d+$/, "Only digits allowed"),
  dateOfJoining: z.string().refine((val) => new Date(val) < new Date(), "Must be a past date"),
  profileImage: z.string().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventorySchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type RequestItem = typeof requests.$inferSelect;
export type InsertRequestItem = z.infer<typeof insertRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;