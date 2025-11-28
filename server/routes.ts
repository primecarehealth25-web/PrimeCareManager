import type { Express } from "express";
import bcrypt from "bcryptjs";
import { users } from "@shared/schema";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertVisitSchema, insertMedicineSchema, insertTreatmentSchema, insertExpenseSchema } from "@shared/schema";
import { format, subMonths } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Login
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
  
    const user = await db.query.users.findFirst({ where: (u) => u.username === username });
  
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
  
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
  
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
    res.json({ token });
  });
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Patients
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to get patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const data = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(data);
      
      // Create initial visit with complaints and diagnosis
      if (req.body.complaints && req.body.diagnosis) {
        await storage.createVisit({
          patientId: patient.id,
          complaints: req.body.complaints,
          diagnosis: req.body.diagnosis,
          treatment: req.body.treatment || null,
          prescription: req.body.prescription || null,
        });
      }
      
      res.status(201).json(patient);
    } catch (error) {
      console.error("Create patient error:", error);
      res.status(400).json({ message: "Failed to create patient" });
    }
  });

  // Visits
  app.get("/api/patients/:id/visits", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const visits = await storage.getVisits(patientId);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ message: "Failed to get visits" });
    }
  });

  app.post("/api/visits", async (req, res) => {
    try {
      const data = insertVisitSchema.parse(req.body);
      const visit = await storage.createVisit(data);
      res.status(201).json(visit);
    } catch (error) {
      console.error("Create visit error:", error);
      res.status(400).json({ message: "Failed to create visit" });
    }
  });

  // Medicines
  app.get("/api/medicines", async (req, res) => {
    try {
      const medicines = await storage.getMedicines();
      res.json(medicines);
    } catch (error) {
      res.status(500).json({ message: "Failed to get medicines" });
    }
  });

  app.post("/api/medicines", async (req, res) => {
    try {
      const data = insertMedicineSchema.parse(req.body);
      const medicine = await storage.createMedicine(data);
      res.status(201).json(medicine);
    } catch (error) {
      console.error("Create medicine error:", error);
      res.status(400).json({ message: "Failed to create medicine" });
    }
  });

  app.patch("/api/medicines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const medicine = await storage.updateMedicine(id, req.body);
      res.json(medicine);
    } catch (error) {
      res.status(400).json({ message: "Failed to update medicine" });
    }
  });

  app.delete("/api/medicines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMedicine(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete medicine" });
    }
  });

  // Treatments
  app.get("/api/treatments", async (req, res) => {
    try {
      const treatments = await storage.getTreatments();
      res.json(treatments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get treatments" });
    }
  });

  app.post("/api/treatments", async (req, res) => {
    try {
      const data = insertTreatmentSchema.parse(req.body);
      const treatment = await storage.createTreatment(data);
      res.status(201).json(treatment);
    } catch (error) {
      console.error("Create treatment error:", error);
      res.status(400).json({ message: "Failed to create treatment" });
    }
  });

  app.patch("/api/treatments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const treatment = await storage.updateTreatment(id, req.body);
      res.json(treatment);
    } catch (error) {
      res.status(400).json({ message: "Failed to update treatment" });
    }
  });

  app.delete("/api/treatments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTreatment(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete treatment" });
    }
  });

  // Bills
  app.get("/api/bills", async (req, res) => {
    try {
      const bills = await storage.getBills();
      res.json(bills);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bills" });
    }
  });

  app.get("/api/bills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bill = await storage.getBill(id);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      res.json(bill);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bill" });
    }
  });

  app.post("/api/bills", async (req, res) => {
    try {
      const { patientId, treatmentItems, medicineItems, paidAmount } = req.body;
      
      const treatmentItemsData = treatmentItems.map((item: any) => ({
        billId: 0, // Will be set after bill creation
        treatmentId: item.treatmentId,
        treatmentName: item.treatmentName,
        amount: item.amount,
      }));
      
      const medicineItemsData = medicineItems.map((item: any) => ({
        billId: 0, // Will be set after bill creation
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      }));
      
      const bill = await storage.createBill(
        { patientId, paidAmount: paidAmount || "0", totalAmount: "0", pendingAmount: "0", status: "pending" },
        treatmentItemsData,
        medicineItemsData
      );
      
      res.status(201).json(bill);
    } catch (error) {
      console.error("Create bill error:", error);
      res.status(400).json({ message: "Failed to create bill" });
    }
  });

  app.post("/api/bills/:id/settle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount } = req.body;
      const bill = await storage.settlePayment(id, amount);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ message: "Failed to settle payment" });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const month = req.query.month as string | undefined;
      const expenses = await storage.getExpenses(month);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(data);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Create expense error:", error);
      res.status(400).json({ message: "Failed to create expense" });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.updateExpense(id, req.body);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteExpense(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete expense" });
    }
  });

  // Reports
  app.get("/api/reports", async (req, res) => {
    try {
      const selectedMonth = req.query.month as string || format(new Date(), "yyyy-MM");
      const currentMonth = await storage.getMonthlyReport(selectedMonth);
      
      const lastMonthDate = subMonths(new Date(selectedMonth + "-01"), 1);
      const lastMonthStr = format(lastMonthDate, "yyyy-MM");
      const lastMonth = await storage.getMonthlyReport(lastMonthStr);
      
      // Get last 6 months data
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStr = format(date, "yyyy-MM");
        const report = await storage.getMonthlyReport(monthStr);
        last6Months.push({
          month: format(date, "MMM"),
          ...report,
        });
      }
      
      res.json({
        currentMonth: { month: selectedMonth, ...currentMonth },
        lastMonth: { month: lastMonthStr, ...lastMonth },
        last6Months,
      });
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Failed to get reports" });
    }
  });

  return httpServer;
}
