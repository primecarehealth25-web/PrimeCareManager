import { 
  patients, 
  visits, 
  medicines, 
  treatments, 
  bills, 
  billTreatmentItems, 
  billMedicineItems, 
  expenses,
  type Patient, 
  type InsertPatient,
  type Visit,
  type InsertVisit,
  type Medicine,
  type InsertMedicine,
  type Treatment,
  type InsertTreatment,
  type Bill,
  type InsertBill,
  type BillTreatmentItem,
  type InsertBillTreatmentItem,
  type BillMedicineItem,
  type InsertBillMedicineItem,
  type Expense,
  type InsertExpense,
  type PatientWithVisits,
  type BillWithItems,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Patients
  getPatients(): Promise<PatientWithVisits[]>;
  getPatient(id: number): Promise<PatientWithVisits | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  
  // Visits
  getVisits(patientId: number): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  
  // Medicines
  getMedicines(): Promise<Medicine[]>;
  getMedicine(id: number): Promise<Medicine | undefined>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  updateMedicine(id: number, medicine: Partial<InsertMedicine>): Promise<Medicine>;
  deleteMedicine(id: number): Promise<void>;
  updateMedicineStock(id: number, quantity: number, earnings: number): Promise<void>;
  
  // Treatments
  getTreatments(): Promise<Treatment[]>;
  getTreatment(id: number): Promise<Treatment | undefined>;
  createTreatment(treatment: InsertTreatment): Promise<Treatment>;
  updateTreatment(id: number, treatment: Partial<InsertTreatment>): Promise<Treatment>;
  deleteTreatment(id: number): Promise<void>;
  
  // Bills
  getBills(): Promise<BillWithItems[]>;
  getBill(id: number): Promise<BillWithItems | undefined>;
  createBill(
    bill: InsertBill, 
    treatmentItems: InsertBillTreatmentItem[], 
    medicineItems: InsertBillMedicineItem[]
  ): Promise<Bill>;
  settlePayment(billId: number, amount: string): Promise<Bill>;
  
  // Expenses
  getExpenses(month?: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalPatients: number;
    todayPatients: number;
    pendingPayments: number;
    totalRevenue: string;
  }>;
  
  // Reports
  getMonthlyReport(month: string): Promise<{
    treatmentEarnings: string;
    medicineEarnings: string;
    totalEarnings: string;
    totalExpenses: string;
    profit: string;
    patientCount: number;
    billCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Patients
  async getPatients(): Promise<PatientWithVisits[]> {
    const allPatients = await db.select().from(patients).orderBy(desc(patients.registrationDate));
    const result: PatientWithVisits[] = [];
    
    for (const patient of allPatients) {
      const patientVisits = await db.select().from(visits).where(eq(visits.patientId, patient.id));
      result.push({ ...patient, visits: patientVisits });
    }
    
    return result;
  }

  async getPatient(id: number): Promise<PatientWithVisits | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    if (!patient) return undefined;
    
    const patientVisits = await db.select().from(visits).where(eq(visits.patientId, id));
    return { ...patient, visits: patientVisits };
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [created] = await db.insert(patients).values(patient).returning();
    return created;
  }

  // Visits
  async getVisits(patientId: number): Promise<Visit[]> {
    return await db.select().from(visits).where(eq(visits.patientId, patientId)).orderBy(desc(visits.visitDate));
  }

  async createVisit(visit: InsertVisit): Promise<Visit> {
    const [created] = await db.insert(visits).values(visit).returning();
    return created;
  }

  // Medicines
  async getMedicines(): Promise<Medicine[]> {
    return await db.select().from(medicines).orderBy(medicines.name);
  }

  async getMedicine(id: number): Promise<Medicine | undefined> {
    const [medicine] = await db.select().from(medicines).where(eq(medicines.id, id));
    return medicine;
  }

  async createMedicine(medicine: InsertMedicine): Promise<Medicine> {
    const [created] = await db.insert(medicines).values(medicine).returning();
    return created;
  }

  async updateMedicine(id: number, medicine: Partial<InsertMedicine>): Promise<Medicine> {
    const [updated] = await db.update(medicines).set(medicine).where(eq(medicines.id, id)).returning();
    return updated;
  }

  async deleteMedicine(id: number): Promise<void> {
    await db.delete(medicines).where(eq(medicines.id, id));
  }

  async updateMedicineStock(id: number, quantityUsed: number, earnings: number): Promise<void> {
    const [medicine] = await db.select().from(medicines).where(eq(medicines.id, id));
    if (medicine) {
      await db.update(medicines).set({
        quantity: medicine.quantity - quantityUsed,
        totalEarnings: (parseFloat(medicine.totalEarnings || "0") + earnings).toString(),
      }).where(eq(medicines.id, id));
    }
  }

  // Treatments
  async getTreatments(): Promise<Treatment[]> {
    return await db.select().from(treatments).orderBy(treatments.name);
  }

  async getTreatment(id: number): Promise<Treatment | undefined> {
    const [treatment] = await db.select().from(treatments).where(eq(treatments.id, id));
    return treatment;
  }

  async createTreatment(treatment: InsertTreatment): Promise<Treatment> {
    const [created] = await db.insert(treatments).values(treatment).returning();
    return created;
  }

  async updateTreatment(id: number, treatment: Partial<InsertTreatment>): Promise<Treatment> {
    const [updated] = await db.update(treatments).set(treatment).where(eq(treatments.id, id)).returning();
    return updated;
  }

  async deleteTreatment(id: number): Promise<void> {
    await db.delete(treatments).where(eq(treatments.id, id));
  }

  // Bills
  async getBills(): Promise<BillWithItems[]> {
    const allBills = await db.select().from(bills).orderBy(desc(bills.billDate));
    const result: BillWithItems[] = [];
    
    for (const bill of allBills) {
      const [patient] = await db.select().from(patients).where(eq(patients.id, bill.patientId));
      const treatmentItemsList = await db.select().from(billTreatmentItems).where(eq(billTreatmentItems.billId, bill.id));
      const medicineItemsList = await db.select().from(billMedicineItems).where(eq(billMedicineItems.billId, bill.id));
      
      result.push({
        ...bill,
        patient,
        treatmentItems: treatmentItemsList,
        medicineItems: medicineItemsList,
      });
    }
    
    return result;
  }

  async getBill(id: number): Promise<BillWithItems | undefined> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, id));
    if (!bill) return undefined;
    
    const [patient] = await db.select().from(patients).where(eq(patients.id, bill.patientId));
    const treatmentItemsList = await db.select().from(billTreatmentItems).where(eq(billTreatmentItems.billId, id));
    const medicineItemsList = await db.select().from(billMedicineItems).where(eq(billMedicineItems.billId, id));
    
    return {
      ...bill,
      patient,
      treatmentItems: treatmentItemsList,
      medicineItems: medicineItemsList,
    };
  }

  async createBill(
    billData: InsertBill,
    treatmentItemsData: InsertBillTreatmentItem[],
    medicineItemsData: InsertBillMedicineItem[]
  ): Promise<Bill> {
    // Calculate total
    const treatmentTotal = treatmentItemsData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const medicineTotal = medicineItemsData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const totalAmount = treatmentTotal + medicineTotal;
    const paidAmount = parseFloat(billData.paidAmount);
    const pendingAmount = totalAmount - paidAmount;
    
    const [created] = await db.insert(bills).values({
      ...billData,
      totalAmount: totalAmount.toString(),
      paidAmount: paidAmount.toString(),
      pendingAmount: pendingAmount.toString(),
      status: pendingAmount <= 0 ? "paid" : "pending",
    }).returning();
    
    // Insert treatment items
    for (const item of treatmentItemsData) {
      await db.insert(billTreatmentItems).values({
        ...item,
        billId: created.id,
      });
    }
    
    // Insert medicine items and update stock
    for (const item of medicineItemsData) {
      await db.insert(billMedicineItems).values({
        ...item,
        billId: created.id,
      });
      
      // Update medicine stock and earnings
      await this.updateMedicineStock(item.medicineId, item.quantity, parseFloat(item.amount));
    }
    
    return created;
  }

  async settlePayment(billId: number, amount: string): Promise<Bill> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
    if (!bill) throw new Error("Bill not found");
    
    const newPaidAmount = parseFloat(bill.paidAmount) + parseFloat(amount);
    const newPendingAmount = parseFloat(bill.totalAmount) - newPaidAmount;
    
    const [updated] = await db.update(bills).set({
      paidAmount: newPaidAmount.toString(),
      pendingAmount: newPendingAmount.toString(),
      status: newPendingAmount <= 0 ? "paid" : "pending",
    }).where(eq(bills.id, billId)).returning();
    
    return updated;
  }

  // Expenses
  async getExpenses(month?: string): Promise<Expense[]> {
    if (month) {
      const [year, mon] = month.split("-");
      const startDate = new Date(parseInt(year), parseInt(mon) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(mon), 0, 23, 59, 59);
      
      return await db.select().from(expenses)
        .where(and(
          gte(expenses.date, startDate),
          lte(expenses.date, endDate)
        ))
        .orderBy(desc(expenses.date));
    }
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(expense).returning();
    return created;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense> {
    const [updated] = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return updated;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalPatients: number;
    todayPatients: number;
    pendingPayments: number;
    totalRevenue: string;
  }> {
    const allPatients = await db.select().from(patients);
    const totalPatients = allPatients.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayVisits = await db.select().from(visits)
      .where(and(
        gte(visits.visitDate, today),
        lte(visits.visitDate, tomorrow)
      ));
    const todayPatients = new Set(todayVisits.map(v => v.patientId)).size;
    
    const pendingBills = await db.select().from(bills).where(eq(bills.status, "pending"));
    const pendingPayments = pendingBills.length;
    
    const allBills = await db.select().from(bills);
    const totalRevenue = allBills.reduce((sum, b) => sum + parseFloat(b.paidAmount), 0);
    
    return {
      totalPatients,
      todayPatients,
      pendingPayments,
      totalRevenue: totalRevenue.toString(),
    };
  }

  // Reports
  async getMonthlyReport(month: string): Promise<{
    treatmentEarnings: string;
    medicineEarnings: string;
    totalEarnings: string;
    totalExpenses: string;
    profit: string;
    patientCount: number;
    billCount: number;
  }> {
    const [year, mon] = month.split("-");
    const startDate = new Date(parseInt(year), parseInt(mon) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(mon), 0, 23, 59, 59);
    
    // Get bills for the month
    const monthBills = await db.select().from(bills)
      .where(and(
        gte(bills.billDate, startDate),
        lte(bills.billDate, endDate)
      ));
    
    let treatmentEarnings = 0;
    let medicineEarnings = 0;
    
    for (const bill of monthBills) {
      const treatmentItemsList = await db.select().from(billTreatmentItems).where(eq(billTreatmentItems.billId, bill.id));
      const medicineItemsList = await db.select().from(billMedicineItems).where(eq(billMedicineItems.billId, bill.id));
      
      treatmentEarnings += treatmentItemsList.reduce((sum, i) => sum + parseFloat(i.amount), 0);
      medicineEarnings += medicineItemsList.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    }
    
    const totalEarnings = treatmentEarnings + medicineEarnings;
    
    // Get expenses for the month
    const monthExpenses = await db.select().from(expenses)
      .where(and(
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      ));
    
    const totalExpensesAmount = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const profit = totalEarnings - totalExpensesAmount;
    
    // Get unique patients for the month
    const monthVisits = await db.select().from(visits)
      .where(and(
        gte(visits.visitDate, startDate),
        lte(visits.visitDate, endDate)
      ));
    const patientCount = new Set(monthVisits.map(v => v.patientId)).size;
    
    return {
      treatmentEarnings: treatmentEarnings.toString(),
      medicineEarnings: medicineEarnings.toString(),
      totalEarnings: totalEarnings.toString(),
      totalExpenses: totalExpensesAmount.toString(),
      profit: profit.toString(),
      patientCount,
      billCount: monthBills.length,
    };
  }
}

export const storage = new DatabaseStorage();
