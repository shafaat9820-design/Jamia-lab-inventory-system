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

  //google auth routes
  app.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
  );
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
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
      const user = await db.insert(users).values(input).returning();
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
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      res.json(user);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Users
  app.get(api.users.list.path, async (req, res) => {
    const allUsers = await storage.getUsers();
    res.json(allUsers);
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
      const input = api.inventory.update.input.parse(req.body);
      const item = await storage.updateInventoryItem(Number(req.params.id), input);
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
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
    // In a real app, we'd check session, but here we assume user is passed or mocked
    // For now, return the first user if none found in mock auth
    const user = await storage.getUser(1); 
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
    try {
      const input = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUser(1, input); // Mocking user 1
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
