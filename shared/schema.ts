import { pgTable, text, serial, integer, timestamp, numeric, date, json, varchar } from "drizzle-orm/pg-core";
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

  department: text("department").default("University Polytechnic"),
  institution: text("institution").default("Jamia Millia Islamia"),
  isApproved: text("is_approved").notNull().default("true"), // "true" or "false" string to stay consistent with other text fields if needed, or just boolean. Let's use text for consistency with role.
});

export const session = pgTable("session", {
  sid: varchar("sid").notNull().primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  otp: text("otp").notNull(),
  registrationData: text("registration_data").notNull(), // JSON stringized registration info
  expiresAt: timestamp("expires_at").notNull(),
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
  quantity: integer("quantity").notNull().default(1),
  location: text("room_number"), // Lab Room Number
  budget: text("budget"), // A-Non recurring, B-Recurring, C-Self-Finance, D-Project Under DST, E-Plan, F-Special Grant
  gemOrderId: text("gem_order_id"),
  gemOrderDate: date("gem_order_date"),
  billUrl: text("bill_url"),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  generatedBy: integer("generated_by").notNull(),
  date: timestamp("date").defaultNow(),
  functionalStatus: text("functional_status").notNull(),
  recommendation: text("recommendation").notNull(), // Continue Use, Repair, Condemn
  notes: text("notes"),
  status: text("status").notNull().default("Pending"), // Pending, Approved, Rejected
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  articleName: text("article_name").notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(),
  labName: text("lab_name").notNull(),
  priority: text("priority").notNull(), // Low, Medium, High
  status: text("status").notNull().default("Requested"),
  requestedBy: integer("requested_by").notNull(),
  date: timestamp("date").defaultNow(),
});

export const deadInventory = pgTable("dead_inventory", {
  id: serial("id").primaryKey(),
  articleName: text("article_name").notNull(),
  writeOffDate: date("write_off_date").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  priceAtWriteOff: numeric("price_at_write_off").notNull(),
  handedOverBy: text("handed_over_by").notNull(),
  takenOverBy: text("taken_over_by").notNull(),
  gfr17Url: text("gfr17_url"),
  condemnationUrl: text("condemnation_url"),
  depreciationUrl: text("depreciation_url"),
  billUrl: text("bill_url"),
  removalReason: text("removal_reason").default("Condemned"), // "Condemned" or "Correction"
  expiryDate: date("expiry_date").notNull(),
  originalData: text("original_data").notNull(), // JSON stringized original inventory record
});

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const registerUserSchema = createInsertSchema(users)
  .omit({ id: true, role: true, isApproved: true })
  .extend({
    password: passwordSchema,
  });
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true }).extend({
  originalCost: z.coerce.string(),
  depreciationRate: z.coerce.string(),
});
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, date: true, status: true });
export const insertRequestSchema = createInsertSchema(requests).omit({ id: true, date: true, status: true });
export const insertDeadInventorySchema = createInsertSchema(deadInventory).omit({ id: true }).extend({
  unitPrice: z.coerce.string(),
  priceAtWriteOff: z.coerce.string(),
});

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
export type DeadInventoryItem = typeof deadInventory.$inferSelect;
export type InsertDeadInventoryItem = z.infer<typeof insertDeadInventorySchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;