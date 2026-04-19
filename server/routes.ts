/**
 * Project: Jamia Lab Inventory Management System
 * Developed by: JMI University Polytechnic Computer Engg 6th Sem Students
 * Team: Shafaat, Farman, Aqdas, Rihan, Farhan
 */

import express from "express";
import { eq, or, sql } from "drizzle-orm";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { users, inventory, updateProfileSchema } from "@shared/schema";
import path from "path";
import fs from "fs";
import multer from "multer";

import { sendOTP } from "./email";
import { log } from "./index";
import { hashPassword, comparePasswords } from "./auth";


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

const uploadPdf = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = 'server/uploads/pdf/';
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for PDFs
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      return cb(null, true);
    }
    cb(new Error("Only pdf files are allowed"));
  }
});

const uploadBill = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = 'server/uploads/bills/';
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'bill-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for bills
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, JPG, and PNG files are allowed"));
  }
});

// deleting files from server
function deleteFile(url: string | null | undefined) {
  if (!url) return;
  try {
    // url is like /uploads/bills/filename.ext
    const filePath = path.join(process.cwd(), 'server', url.replace('/uploads/', 'uploads/'));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    }
  } catch (e) {
    console.error(`Error deleting file ${url}:`, e);
  }
}

async function seedDatabase() {
  // Database initialized to a clean state.
}

export async function registerRoutes(
  httpServer: Server,
  app: express.Express
): Promise<Server> {
  // Ensure default Admin exists
  const adminEmail = "jmi.lab.inventory@gmail.com";
  const existingAdmin = await storage.getUserByEmail(adminEmail);
  if (!existingAdmin) {
    console.log("Creating default Admin: " + adminEmail);
    await db.insert(users).values({
      email: adminEmail,
      password: await hashPassword("Admin@123"),
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
      await sendOTP(input.email, otp, 'registration');
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
          password: await hashPassword(registrationData.password),
          role: "Lab Assistant",
        isApproved: "true"
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

      const [user] = await db.insert(users).values({
        ...input,
        role: "Lab Assistant",
        isApproved: "true"
      }).returning();

      if (req.session) {
        (req.session as any).userId = user.id;
      }
      res.status(201).json(user);
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
      await sendOTP(email, otp, 'password_reset');

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

      await storage.updateUserPassword(user.id, await hashPassword(password));
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
      console.log(`LOGIN ATTEMPT: Email=[${email}]`);

      

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`LOGIN FAILED: User not found [${email}]`);
        return res.status(401).json({ message: "No account found with this email." });
      }

      const isPasswordCorrect = await comparePasswords(password, user.password);
      if (!isPasswordCorrect) {
        console.log(`LOGIN FAILED: Password mismatch for [${email}].`);
        return res.status(401).json({ message: "Please check your email or password and try again." });
      }

      const isMasterAdmin = user.email === "shafaat9820@gmail.com";
      if (user.isApproved === "false" && !isMasterAdmin) {
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
    // Removed passport check, only session counts

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
    // Removed passport logout
    if (req.session) {
      req.session.destroy(() => {
        res.json({ message: "Logged out" });
      });
    } else {
      res.json({ message: "Logged out" });
    }
  });

  app.get(api.users.list.path, async (req, res) => {
    let currentUser: any = null;

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
    let currentUser: any = null;

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

app.get('/api/dead-inventory/report', async (req, res) => {
    try {
      console.log('Generating dead inventory report...');
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      console.log('Imports done');
      const list = await storage.getDeadInventory();
      console.log('Got list length:', list.length);
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      }); // use landscape for more columns

      // Header Branding
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 51, 24); // #0d3318 Jamia Green
      doc.text("Jamia Millia Islamia", 14, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("University Polytechnic", 14, 26);
      
      // Report Title
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text("Written-Off & Dead Inventory Report", 14, 38);
      
      // Meta Info
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, 14, 44);
      doc.text(`Total Records: ${list.length}`, 14, 49);
      
      const tableData = list.map(item => [
        item.articleName,
        item.writeOffDate ? new Date(item.writeOffDate).toLocaleDateString('en-IN') : "-",
        `Rs. ${Number(item.unitPrice).toFixed(2)}`,
        `Rs. ${Number(item.priceAtWriteOff).toFixed(2)}`,
        item.handedOverBy,
        item.takenOverBy,
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN') : "-"
      ]);

      autoTable(doc, {
        head: [['Article Name', 'Write-off Date', 'Initial Cost', 'Write-off Value', 'Handed By', 'Taken By', 'Eviction Date']],
        body: tableData,
        startY: 55,
        theme: 'grid',
        headStyles: { fillColor: [13, 51, 24], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 8, cellPadding: 3 }
      });

      const pdfOutput = doc.output('arraybuffer');
      res.contentType('application/pdf');
      res.send(Buffer.from(pdfOutput));
    } catch (e: any) {
      console.error("PDF Generate Error", e);
      res.status(500).json({ message: e.message || "Error generating report", stack: e.stack });
    }
  });

  app.get('/api/inventory/report', async (req, res) => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      let list = await storage.getInventory();
      
      const labFilter = req.query.lab as string | undefined;
      if (labFilter && labFilter !== 'all') {
        list = list.filter(item => item.labName === labFilter);
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      }); 

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 51, 24); 
      doc.text("Jamia Millia Islamia", 14, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("University Polytechnic", 14, 26);
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      const title = labFilter && labFilter !== 'all' ? `${labFilter} Asset Inventory Report` : "Comprehensive Asset Inventory Report";
      doc.text(title, 14, 38);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, 14, 44);
      doc.text(`Total Assets: ${list.length}`, 14, 49);
      
      const tableData = list.map(item => [
        item.name,
        item.itemCode,
        item.category,
        item.labName,
        item.gemOrderId ? `${item.gemOrderId}${item.gemOrderDate ? `\n(${new Date(item.gemOrderDate).toLocaleDateString('en-IN')})` : ''}` : "-",
        item.quantity?.toString() || "1",
        new Date(item.purchaseDate).toLocaleDateString('en-IN'),
        `Rs. ${Number(item.originalCost).toFixed(2)}`,
        item.functionalStatus
      ]);

      autoTable(doc, {
        head: [['Article Name', 'Asset Code', 'Category', 'Laboratory', 'GeM Info', 'Qty', 'Purchased', 'Unit Cost', 'Status']],
        body: tableData,
        startY: 55,
        theme: 'grid',
        headStyles: { fillColor: [13, 51, 24], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 8, cellPadding: 3 }
      });

      const pdfOutput = doc.output('arraybuffer');
      res.contentType('application/pdf');
      res.send(Buffer.from(pdfOutput));
    } catch (e: any) {
      console.error("PDF Generate Error", e);
      res.status(500).json({ message: e.message || "Error generating report", stack: e.stack });
    }
  });

  app.get('/api/depreciation/report', async (req, res) => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      let list = await storage.getInventory();
      const labName = req.query.labName as string;

      if (labName && labName !== 'all') {
        list = list.filter(i => i.labName === labName);
      }

      // Only include active depreciation items (not condemned)
      const depList = list.filter(i => i.approvalStatus !== 'Condemned');
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      }); 

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 51, 24); 
      doc.text("Jamia Millia Islamia", 14, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("University Polytechnic", 14, 26);
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      const reportTitle = labName && labName !== 'all' 
        ? `Asset Depreciation Report: ${labName}` 
        : "Comprehensive Asset Depreciation Report";
      doc.text(reportTitle, 14, 38);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, 14, 44);
      doc.text(`Total Active Assets: ${depList.length}`, 14, 49);
      
      const tableData = depList.map(item => {
        const qty = item.quantity || 1;
        const rate = Number(item.depreciationRate) / 100;
        const unitCost = Number(item.originalCost);
        const totalCost = unitCost * qty;
        
        const purchaseYear = new Date(item.purchaseDate).getFullYear();
        const currentYear = new Date().getFullYear();
        const yearsElapsed = Math.max(0, currentYear - purchaseYear);
        
        const unitCurrentValue = unitCost * Math.pow(1 - rate, yearsElapsed);
        const totalCurrentValue = unitCurrentValue * qty;

        return [
          item.name,
          item.itemCode,
          item.labName,
          `${purchaseYear} (${yearsElapsed} Yrs)`,
          qty.toString(),
          `${Number(item.depreciationRate)}%`,
          `Rs. ${totalCost.toFixed(2)}`,
          `Rs. ${totalCurrentValue.toFixed(2)}`
        ];
      });

      autoTable(doc, {
        head: [['Article Name', 'Asset Code', 'Laboratory', 'Year', 'Qty', 'Depr. Rate', 'Total Initial Cost', 'Current WDV Value']],
        body: tableData,
        startY: 55,
        theme: 'grid',
        headStyles: { fillColor: [13, 51, 24], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 8, cellPadding: 3 }
      });

      const pdfOutput = doc.output('arraybuffer');
      res.contentType('application/pdf');
      res.send(Buffer.from(pdfOutput));
    } catch (e: any) {
      console.error("PDF Generate Error", e);
      res.status(500).json({ message: e.message || "Error generating report", stack: e.stack });
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static('server/uploads'));

  // Bill upload endpoint
  app.post('/api/inventory/upload-bill', uploadBill.single('bill'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      // Return the accessible URL path
      const url = `/uploads/bills/${req.file.filename}`;
      res.json({ url });
    } catch (e: any) {
      res.status(500).json({ message: e.message || 'Upload failed' });
    }
  });

  // Bill download endpoint - forces download with correct content type
  app.get('/api/inventory/:id/bill', async (req, res) => {
    try {
      const item = await storage.getInventoryItem(Number(req.params.id));
      if (!item || !item.billUrl) {
        return res.status(404).json({ message: 'No bill found for this item' });
      }
      // billUrl is like /uploads/bills/bill-123456.pdf
      const filePath = path.join('server', item.billUrl.replace('/uploads/', 'uploads/'));
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Bill file not found on server' });
      }
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      const filename = `Bill_${item.itemCode}${ext}`;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (e: any) {
      res.status(500).json({ message: e.message || 'Failed to download bill' });
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
    let currentUser: any = null;

    if (!currentUser && req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }
    if (!currentUser || currentUser.role !== "Store Keeper") {
      return res.status(403).json({ message: "Only Store Keeper can add inventory items." });
    }

    try {
      const input = api.inventory.create.input.parse(req.body);
      const item = await storage.createInventoryItem(input);
      res.status(201).json(item);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      if (e.code === '23505') { // Postgres duplicate key error
        return res.status(400).json({ message: "An item with this Asset Code already exists." });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post("/api/inventory/:id/condemn", async (req, res) => {
    let currentUser: any = null;

    if (!currentUser && req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }
    
    if (!currentUser || currentUser.role !== "Store Keeper") {
      return res.status(403).json({ message: "Only Store Keeper can condemn inventory items." });
    }

    const id = Number(req.params.id);
    const item = await storage.getInventoryItem(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Check for approved condemnation report
    const approvedReport = await storage.getApprovedCondemnationReport(id);
    if (!approvedReport) {
      return res.status(400).json({ 
        message: "You cannot condemn this article because the request is not approved by the Principal." 
      });
    }

    // Update status to Condemned
    await storage.updateInventoryItem(id, { approvalStatus: "Condemned" });
    res.json({ message: "Article successfully condemned" });
  });

  app.put(api.inventory.update.path, async (req, res) => {
    let currentUser: any = null;

    if (!currentUser && req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }
    if (!currentUser || currentUser.role !== "Store Keeper") {
      return res.status(403).json({ message: "Only Store Keeper can update inventory items." });
    }

    try {
      const input = api.inventory.update.input.parse(req.body);
      
      // Strict check for Condemned status
      if (input.approvalStatus === "Condemned") {
        const reports = await storage.getReports();
        const articleid = Number(req.params.id);
        const hasApprovedCondemnationReport = reports.some(r => 
          r.articleId === articleid && 
          r.status === "Approved" && 
          r.recommendation === "Condemn"
        );
        
        if (!hasApprovedCondemnationReport) {
          return res.status(403).json({ message: "Cannot condemn article without Principal approved report" });
        }
      }

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
    let currentUser: any = null;

    if (!currentUser && req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }
    if (!currentUser || currentUser.role !== "Store Keeper") {
      return res.status(403).json({ message: "Only Store Keeper can delete inventory items." });
    }
    const id = Number(req.params.id);
    const item = await storage.getInventoryItem(id);
    if (item && item.billUrl) {
      deleteFile(item.billUrl);
    }
    await storage.deleteInventoryItem(id);
    res.status(204).send();
  });

  // Reports
  app.get(api.reports.list.path, async (req, res) => {
    const allReports = await storage.getReports();
    res.json(allReports);
  });

  app.post(api.reports.create.path, async (req, res) => {
    let currentUser: any = null;

    if (!currentUser && req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }
    if (!currentUser || currentUser.role !== "Lab Incharge") {
      return res.status(403).json({ message: "Only Lab Incharge can file inspection reports." });
    }

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

  app.patch(api.reports.updateStatus.path, async (req, res) => {
    let currentUser: any = null;

    if (!currentUser && req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }
    if (!currentUser || currentUser.role !== "Principal") {
      return res.status(403).json({ message: "Only the Principal can approve or reject inspection reports." });
    }

    try {
      const { status } = api.reports.updateStatus.input.parse(req.body);
      const report = await storage.updateReportStatus(Number(req.params.id), status);
      if (!report) return res.status(404).json({ message: "Report not found" });
      res.json(report);
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
    let currentUser: any = null;

    if (!currentUser && req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }
    if (!currentUser || currentUser.role !== "Lab Incharge") {
      return res.status(403).json({ message: "Only Lab Incharge can create procurement requests." });
    }

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
    let currentUser: any = null;

    if (!currentUser && req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }
    // Only Principal can approve/reject; Store Keeper can mark as Procured
    if (currentUser?.role === "Store Keeper") {
      const { status } = api.requests.updateStatus.input.parse(req.body);
      if (status !== "Procured") {
        return res.status(403).json({ message: "Store Keeper can only mark as Procured." });
      }
    } else if (!currentUser || currentUser.role !== "Principal") {
      return res.status(403).json({ message: "Only the Principal can approve or reject procurement requests." });
    }

    try {
      const { status } = api.requests.updateStatus.input.parse(req.body);
      const requestId = Number(req.params.id);
      
      const currentRequest = await storage.getRequests().then(reqs => reqs.find(r => r.id === requestId));
      if (!currentRequest) return res.status(404).json({ message: "Request not found" });

      // Automation: When marked as Procured, added to inventory
      if (status === "Procured") {
        const updatedRequest = await storage.updateRequestStatus(requestId, "Procured", "Approved");
        if (!updatedRequest) {
          return res.status(400).json({ message: "Request must be Approved and not already Procured" });
        }

        // Check if batch item already exists for this request
        const existingBatch = await storage.getInventory().then(list => 
          list.find(i => i.itemCode === `AUTO-${requestId}-BATCH`)
        );
        if (existingBatch) {
          return res.status(400).json({ message: "This request has already been added to inventory." });
        }

        // Create single consolidated inventory item
        await storage.createInventoryItem({
          name: currentRequest.articleName,
          itemCode: `AUTO-${requestId}-BATCH`,
          category: "Procured Asset",
          labName: currentRequest.labName,
          location: "Not Assigned",
          purchaseDate: new Date().toISOString().split('T')[0],
          originalCost: "0",
          depreciationRate: "10",
          usefulLife: 5,
          functionalStatus: "Working",
          approvalStatus: "Active",
          quantity: currentRequest.quantity
        });
        return res.json(updatedRequest);
      }

      const requestItem = await storage.updateRequestStatus(requestId, status);
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
    let userId = (req.session as any)?.userId;

    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId); 
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // Comprehensive File Serving for Uploads (Accessible to any logged-in user)
  app.get('/uploads/:folder/:filename', (req, res) => {
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).send('Not authenticated');
    }
    
    const { folder, filename } = req.params;
    const allowedFolders = ['bills', 'pdf', 'profile'];
    
    if (!allowedFolders.includes(folder)) {
      return res.status(403).send('Access denied');
    }

    const filePath = path.join(process.cwd(), 'server', 'uploads', folder, path.basename(filename));
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });

  app.put(api.profile.update.path, async (req, res) => {
    let userId = (req.session as any)?.userId;

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

  // Serve PDFs statically
  // Cleaned up redundant PDF serving route. Handled by express.static in index.ts.

  // Write-Off / Dead Inventory Routes
  app.post('/api/write-off', uploadPdf.fields([
    { name: 'gfr17', maxCount: 1 },
    { name: 'condemnation', maxCount: 1 },
    { name: 'depreciation', maxCount: 1 }
  ]), async (req, res) => {
    let currentUser: any = null;
    if (req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }
    if (!currentUser || currentUser.role !== 'Store Keeper') {
      return res.status(403).json({ message: "Only Store Keeper can perform write-offs." });
    }

    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const inventoryId = Number(req.body.inventoryId);
      const { dateOfWriteOff, unitPrice, priceAtWriteOff, handedOverBy, takenOverBy, removalReason } = req.body;
      
      const item = await storage.getInventoryItem(inventoryId);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      // expiryDate is writeOffDate + 3 months
      const wDate = new Date(dateOfWriteOff);
      const exDate = new Date(wDate);
      exDate.setMonth(exDate.getMonth() + 3);

      const deadItem = await storage.createDeadInventoryItem({
        articleName: item.name,
        writeOffDate: wDate.toISOString().split('T')[0],
        unitPrice: unitPrice.toString(),
        priceAtWriteOff: priceAtWriteOff.toString(),
        handedOverBy: handedOverBy,
        takenOverBy: takenOverBy,
        removalReason: removalReason || "Condemned",
        gfr17Url: files['gfr17'] ? `/uploads/pdf/${files['gfr17'][0].filename}` : null,
        condemnationUrl: files['condemnation'] ? `/uploads/pdf/${files['condemnation'][0].filename}` : null,
        depreciationUrl: files['depreciation'] ? `/uploads/pdf/${files['depreciation'][0].filename}` : null,
        billUrl: item.billUrl, // Preserve original purchase bill
        expiryDate: exDate.toISOString().split('T')[0],
        originalData: JSON.stringify(item)
      });

      // Remove from main inventory
      await storage.deleteInventoryItem(inventoryId);

      res.status(200).json(deadItem);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: e.message || "Internal server error" });
    }
  });

  app.get('/api/dead-inventory', async (req, res) => {
    const list = await storage.getDeadInventory();
    res.json(list);
  });

  app.post('/api/dead-inventory/:id/recover', async (req, res) => {
    let currentUser: any = null;
    if (req.session && (req.session as any).userId) {
      currentUser = await storage.getUser((req.session as any).userId);
    }
    if (!currentUser || currentUser.role !== 'Store Keeper') {
      return res.status(403).json({ message: "Only Store Keeper can recover dead inventory items." });
    }

    try {
      const dbId = Number(req.params.id);
      const deadItem = await storage.getDeadInventoryItem(dbId);
      if (!deadItem) {
        return res.status(404).json({ message: "Not found" });
      }
      
      const original = JSON.parse(deadItem.originalData);
      
      // We don't restore with the same ID, just insert without ID
      const { id, ...originalWithoutId } = original;

      // Sanitize: provide safe defaults for any required NOT NULL columns
      // that might be null in old/seeded records
      const sanitized = {
        ...originalWithoutId,
        itemCode: originalWithoutId.itemCode || `RECOVERED-${Date.now()}`,
        name: originalWithoutId.name || deadItem.articleName || 'Recovered Item',
        category: originalWithoutId.category || 'General',
        labName: originalWithoutId.labName || 'Unknown Lab',
        purchaseDate: originalWithoutId.purchaseDate || new Date().toISOString().split('T')[0],
        originalCost: originalWithoutId.originalCost || '0',
        depreciationRate: originalWithoutId.depreciationRate || '10',
        usefulLife: originalWithoutId.usefulLife || 5,
        functionalStatus: originalWithoutId.functionalStatus || 'Working',
        approvalStatus: 'Active', // always reset to Active on recovery
        quantity: originalWithoutId.quantity || 1,
      };

      await storage.createInventoryItem(sanitized);
      await storage.deleteDeadInventoryItem(dbId);
      
      res.json({ message: "Recovered successfully" });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ message: e.message || "Internal error" });
    }
  });

  // Clean up dead inventory every day
  setInterval(async () => {
    try {
      console.log('Running cleanup for dead inventory...');
      const deadItems = await storage.getDeadInventory();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let purgeCount = 0;
      for (const item of deadItems) {
        const expiryDate = new Date(item.expiryDate);
        if (expiryDate < today) {
          console.log(`Purging expired dead inventory: ${item.articleName} (ID: ${item.id})`);
          
          // Delete associated bill from originalData if it exists
          try {
            const original = JSON.parse(item.originalData);
            if (original.billUrl) {
              deleteFile(original.billUrl);
            }
          } catch (pe) {
            console.error("Error parsing originalData during purge:", pe);
          }

          // Delete direct PDFs
          deleteFile(item.gfr17Url);
          deleteFile(item.condemnationUrl);
          deleteFile(item.depreciationUrl);

          // Remove from DB
          await storage.deleteDeadInventoryItem(item.id);
          purgeCount++;
        }
      }
      if (purgeCount > 0) console.log(`Purged ${purgeCount} expired items.`);
    } catch (err) {
      console.error('Error during auto-purge:', err);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours

  return httpServer;
}
