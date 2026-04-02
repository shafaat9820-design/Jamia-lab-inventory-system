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
  // Ensure default Admin exists
  const adminEmail = "shafaat9820@gmail.com";
  const existingAdmin = await storage.getUserByEmail(adminEmail);
  if (!existingAdmin) {
    console.log("Creating default Admin: " + adminEmail);
    await db.insert(users).values({
      email: adminEmail,
      password: "admin123", // Default institutional password
      role: "Admin",
      name: "Institutional Admin",
      isApproved: "true"
    });
  } else {
    console.log("Syncing default Admin: " + adminEmail);
    // Force sync Admin credentials to resolve potential password conflicts during setup
    await storage.updateUser(existingAdmin.id, { 
      password: "admin123", 
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

  // Mock Auth
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = api.auth.login.input.parse(req.body);
      console.log(`LOGIN ATTEMPT: Email=[${email}] Password=[${password}]`);

      // Super Admin Override for Institutional Email
      if (email === "shafaat9820@gmail.com" && password === "admin123") {
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
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.isApproved === "false") {
        return res.status(403).json({ message: "Your account is pending approval by an Admin." });
      }
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
