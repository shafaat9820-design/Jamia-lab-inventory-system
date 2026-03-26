import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { users, inventory, updateProfileSchema } from "@shared/schema";
import path from "path";
import fs from "fs";
import multer from "multer";
import passport from "./googleAuth";
import { sendOTP } from "./email";
import { log } from "./index";


const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'server/uploads/profile/';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only jpeg, jpg, png files are allowed"));
  }
});

async function seedDatabase() {
  const existingUsers = await storage.getUsers();
  if (existingUsers.length === 0) {
    // Add dummy users
    await db.insert(users).values([
  { email: 'admin@jamia.com', password: 'password', role: 'Admin', name: 'System Admin' },
  { email: 'assistant@jamia.com', password: 'password', role: 'Lab Assistant', name: 'Ravi Kumar' },
  { email: 'incharge@jamia.com', password: 'password', role: 'Lab Incharge', name: 'Dr. Sameer Khan' },
  { email: 'principal@jamia.com', password: 'password', role: 'Principal', name: 'Dr. Alok Verma' },
  { email: 'storekeeper@jamia.com', password: 'password', role: 'Store Keeper', name: 'Amit Singh' }
]);
  }

  const existingInventory = await storage.getInventory();
  if (existingInventory.length === 0) {
    await db.insert(inventory).values([
      {
        itemCode: 'COMP-001', name: 'Dell Optiplex 7090', category: 'Desktop',
        labName: 'Computer Lab', purchaseDate: '2021-04-10', originalCost: '45000',
        depreciationRate: '10', usefulLife: 5, functionalStatus: 'Working', approvalStatus: 'Active'
      },
      {
        itemCode: 'ELEC-001', name: 'Digital Multimeter', category: 'Instrument',
        labName: 'Electronics Lab', purchaseDate: '2019-08-15', originalCost: '2500',
        depreciationRate: '15', usefulLife: 4, functionalStatus: 'Non Working', approvalStatus: 'Pending Approval'
      },
      {
        itemCode: 'PHYS-001', name: 'Spectrometer', category: 'Instrument',
        labName: 'Physics Lab', purchaseDate: '2015-02-20', originalCost: '15000',
        depreciationRate: '5', usefulLife: 10, functionalStatus: 'Non Working', approvalStatus: 'Condemned'
      }
    ]);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Ensure default Admin exists
  const adminEmail = "jmi.lab.inventory@gmail.com";
  const existingAdmin = await storage.getUserByEmail(adminEmail);
  if (!existingAdmin) {
    console.log("Creating default Admin: " + adminEmail);
    await db.insert(users).values({
      email: adminEmail,
      password: "admin@", // Default institutional password
      role: "Admin",
      name: "Institutional Admin",
      isApproved: "true"
    });
  } else {
    console.log("Checking default Admin: " + adminEmail);
    // Only sync role and approval to ensure access, don't overwrite password
    await storage.updateUser(existingAdmin.id, { 
      isApproved: "true", 
      role: "Admin" 
    });
  }

  //google auth routes
  app.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
  );
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      if (req.session && req.user) {
        (req.session as any).userId = (req.user as any).id;
      }
      res.redirect("/dashboard");
    }
  );

  // Seed DB on start
  seedDatabase().catch(console.error);

  // Temporary diagnostic route for email
  app.get("/api/test-email", async (req, res) => {
    log("Running SMTP diagnostic test...");
    try {
      const { sendOTP } = await import("./email");
      // Use a known test email
      await sendOTP("test@example.com", "123456");
      res.json({ success: true, message: "SMTP connection successful. Check logs for FALLBACK if mail didn't actually arrive." });
    } catch (e: any) {
      log(`SMTP Diagnostic failed: ${e.message}`, "error");
      res.status(500).json({ 
        success: false, 
        message: e.message,
        code: e.code,
        command: e.command,
        response: e.response,
        stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
      });
    }
  });

  app.post(api.auth.requestOTP.path, async (req, res) => {
    const email = req.body?.email;
    log(`OTP request started for ${email}`);
    try {
      const input = api.auth.requestOTP.input.parse(req.body);
      log(`Input parsed for ${input.email}`);
      
      const existingUser = await storage.getUserByEmail(input.email);
      log(`Existing user check completed for ${input.email}`);
      
      if (existingUser) {
        log(`Email already exists: ${input.email}`);
        return res.status(400).json({ message: "Email already exists" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      log(`Attempting to upsert OTP for ${input.email}`);
      await storage.upsertOTP(input.email, otp, JSON.stringify(input), expiresAt);
      log(`OTP upserted successfully for ${input.email}`);
      
      log(`Calling sendOTP for ${input.email}`);
      await sendOTP(input.email, otp);
      log(`sendOTP completed successfully for ${input.email}`);

      res.status(200).json({ message: "OTP sent to your email" });
    } catch (e: any) {
      log(`OTP error for ${email}: ${e.message}`, "error");
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: e.message || "Internal server error" });
    }
  });

  app.post(api.auth.verifyOTP.path, async (req, res) => {
    try {
      const { email, otp } = api.auth.verifyOTP.input.parse(req.body);
      const record = await storage.getOTP(email);

      if (!record || record.otp !== otp || new Date() > record.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      const registrationData = JSON.parse(record.registrationData);
      
      const [user] = await db.insert(users).values({
        ...registrationData,
        role: "Lab Assistant",
        isApproved: "false"
      }).returning();

      await storage.deleteOTP(email);

      res.status(201).json(user);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: e.message || "Internal server error" });
    }
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await db.insert(users).values({
        ...input,
        role: "Lab Assistant",
        isApproved: "false"
      }).returning();

      if (req.session) {
        (req.session as any).userId = user[0].id;
      }
      res.status(201).json(user[0]);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.forgotPassword.path, async (req, res) => {
    try {
      const { email } = api.auth.forgotPassword.input.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "No account found with this email address." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.upsertOTP(email, otp, JSON.stringify({ type: "password_reset" }), expiresAt);
      await sendOTP(email, otp);

      res.json({ message: "OTP sent to your email." });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: e.message || "Internal server error" });
    }
  });

  app.post(api.auth.resetPassword.path, async (req, res) => {
    try {
      const { email, otp, password } = api.auth.resetPassword.input.parse(req.body);
      const record = await storage.getOTP(email);

      if (!record || record.otp !== otp || new Date() > record.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }

      const data = JSON.parse(record.registrationData);
      if (data.type !== "password_reset") {
        return res.status(400).json({ message: "Invalid OTP type." });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      await storage.updateUserPassword(user.id, password);
      await storage.deleteOTP(email);

      res.json({ message: "Password reset successful. Please login with your new password." });
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: e.message || "Internal server error" });
    }
  });

  // Mock Auth
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = api.auth.login.input.parse(req.body);
      console.log(`LOGIN ATTEMPT: Email=[${email}] Password=[${password}]`);

      // Super Admin Override for Institutional Email
      if (email === "jmi.lab.inventory@gmail.com" && password === "admin@") {
        let user = await storage.getUserByEmail(email);
        if (!user) {
          const [newUser] = await db.insert(users).values({
            email,
            password,
            role: "Admin",
            name: "Institutional Admin",
            isApproved: "true"
          }).returning();
          user = newUser;
        } else {
          // Force update to Admin/Approved if it exists but is restricted
          await storage.updateUser(user.id, { role: "Admin", isApproved: "true", password: "admin123" });
        }
        if (req.session) {
          (req.session as any).userId = user.id;
        }
        return res.json(user);
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`LOGIN FAILED: User not found [${email}]`);
        return res.status(401).json({ message: "No account found with this email." });
      }

      if (user.password !== password) {
        console.log(`LOGIN FAILED: Password mismatch for [${email}]. Expected=[${user.password}] Actual=[${password}]`);
        return res.status(401).json({ message: "Please check your email or password and try again." });
      }

      if (user.isApproved === "false") {
        console.log(`LOGIN FAILED: User not approved [${email}]`);
        return res.status(403).json({ message: "Your account is pending approval by an Admin." });
      }

      console.log(`LOGIN SUCCESS: [${email}]`);
      if (req.session) {
        (req.session as any).userId = user.id;
      }
      res.json(user);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return res.json(req.user);
    }
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      if (req.session) {
        req.session.destroy(() => {
          res.json({ message: "Logged out" });
        });
      } else {
        res.json({ message: "Logged out" });
      }
    });
  });

  // Users
  app.get(api.users.list.path, async (req, res) => {
    let currentUser: any = req.user;
    if (!currentUser && req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }

    // Additional check for master email to guarantee access
    const isMasterAdmin = currentUser?.email === "shafaat9820@gmail.com";

    if (!currentUser || (currentUser.role !== "Admin" && !isMasterAdmin)) {
      console.log(`LIST USERS - DENIED: User=[${currentUser?.email}] Role=[${currentUser?.role}] SessionId=[${(req.session as any)?.userId}]`);
      return res.status(401).json({ message: "Admin access required" });
    }
    
    const allUsers = await storage.getUsers();
    res.json(allUsers);
  });

  app.patch(api.users.update.path, async (req, res) => {
    let currentUser: any = req.user;
    if (!currentUser && req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }

    if (!currentUser || currentUser.role !== "Admin") {
      return res.status(401).json({ message: "Admin access required" });
    }
    try {
      const { role, isApproved } = api.users.update.input.parse(req.body);
      
      if (isApproved === "denied") {
        await storage.deleteUser(Number(req.params.id));
        return res.json({ message: "User request denied and removed" });
      }

      const updatedUser = await storage.updateUser(Number(req.params.id), { role, isApproved });
      if (!updatedUser) return res.status(404).json({ message: "User not found" });
      res.json(updatedUser);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: e.message });
    }
  });

  // Inventory
  app.get(api.inventory.list.path, async (req, res) => {
    const items = await storage.getInventory();
    res.json(items);
  });

  app.get(api.inventory.get.path, async (req, res) => {
    const item = await storage.getInventoryItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  });

  app.post(api.inventory.create.path, async (req, res) => {
    try {
      const inputSchema = api.inventory.create.input.extend({
        originalCost: z.coerce.string(),
        depreciationRate: z.coerce.string(),
      });
      const input = inputSchema.parse(req.body);
      const item = await storage.createInventoryItem(input);
      res.status(201).json(item);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.put(api.inventory.update.path, async (req, res) => {
    try {
      const inputSchema = api.inventory.update.input.extend({
        originalCost: z.coerce.string().optional(),
        depreciationRate: z.coerce.string().optional(),
      });
      const input = inputSchema.parse(req.body);
      const item = await storage.updateInventoryItem(Number(req.params.id), input);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete(api.inventory.delete.path, async (req, res) => {
    await storage.deleteInventoryItem(Number(req.params.id));
    res.status(204).send();
  });

  // Reports
  app.get(api.reports.list.path, async (req, res) => {
    const allReports = await storage.getReports();
    res.json(allReports);
  });

  app.post(api.reports.create.path, async (req, res) => {
    try {
      const input = api.reports.create.input.parse(req.body);
      const report = await storage.createReport(input);
      res.status(201).json(report);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Requests
  app.get(api.requests.list.path, async (req, res) => {
    const allRequests = await storage.getRequests();
    res.json(allRequests);
  });

  app.post(api.requests.create.path, async (req, res) => {
    try {
      const input = api.requests.create.input.parse(req.body);
      const requestItem = await storage.createRequest(input);
      res.status(201).json(requestItem);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.requests.updateStatus.path, async (req, res) => {
    try {
      const { status } = api.requests.updateStatus.input.parse(req.body);
      const requestItem = await storage.updateRequestStatus(Number(req.params.id), status);
      if (!requestItem) return res.status(404).json({ message: "Request not found" });
      res.json(requestItem);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Profile Routes
  app.get(api.profile.get.path, async (req, res) => {
    let userId = (req.user as any)?.id || (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId); 
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.get('/uploads/profile/:filename', (req, res) => {
    const filePath = path.join(process.cwd(), 'server/uploads/profile/', req.params.filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });

  app.put(api.profile.update.path, async (req, res) => {
    let userId = (req.user as any)?.id || (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    try {
      const input = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, input);
      if (!updatedUser) return res.status(404).json({ message: "User not found" });
      res.json(updatedUser);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.post(api.profile.upload.path, upload.single('profileImage'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/profile/${req.file.filename}`;
    res.json({ url });
  });

  return httpServer;
}
