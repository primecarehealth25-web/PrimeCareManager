import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // hashed
});


// Patients table
export const patients = pgTable("patients", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
});

export const patientsRelations = relations(patients, ({ many }) => ({
  visits: many(visits),
  bills: many(bills),
}));

// Visits table - tracks each patient visit
export const visits = pgTable("visits", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  visitDate: timestamp("visit_date").defaultNow().notNull(),
  complaints: text("complaints").notNull(),
  diagnosis: text("diagnosis").notNull(),
  treatment: text("treatment"),
  prescription: text("prescription"),
});

export const visitsRelations = relations(visits, ({ one }) => ({
  patient: one(patients, {
    fields: [visits.patientId],
    references: [patients.id],
  }),
}));

// Medicines master table
export const medicines = pgTable("medicines", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
});

// Treatments master table
export const treatments = pgTable("treatments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// Bills table
export const bills = pgTable("bills", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  billDate: timestamp("bill_date").defaultNow().notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("pending"), // 'paid' or 'pending'
});

export const billsRelations = relations(bills, ({ one, many }) => ({
  patient: one(patients, {
    fields: [bills.patientId],
    references: [patients.id],
  }),
  treatmentItems: many(billTreatmentItems),
  medicineItems: many(billMedicineItems),
}));

// Bill treatment items
export const billTreatmentItems = pgTable("bill_treatment_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  billId: integer("bill_id").notNull().references(() => bills.id),
  treatmentId: integer("treatment_id").notNull().references(() => treatments.id),
  treatmentName: text("treatment_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

export const billTreatmentItemsRelations = relations(billTreatmentItems, ({ one }) => ({
  bill: one(bills, {
    fields: [billTreatmentItems.billId],
    references: [bills.id],
  }),
  treatment: one(treatments, {
    fields: [billTreatmentItems.treatmentId],
    references: [treatments.id],
  }),
}));

// Bill medicine items
export const billMedicineItems = pgTable("bill_medicine_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  billId: integer("bill_id").notNull().references(() => bills.id),
  medicineId: integer("medicine_id").notNull().references(() => medicines.id),
  medicineName: text("medicine_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

export const billMedicineItemsRelations = relations(billMedicineItems, ({ one }) => ({
  bill: one(bills, {
    fields: [billMedicineItems.billId],
    references: [bills.id],
  }),
  medicine: one(medicines, {
    fields: [billMedicineItems.medicineId],
    references: [medicines.id],
  }),
}));

// Expenses table
export const expenses = pgTable("expenses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  date: timestamp("date").defaultNow().notNull(),
  expenseType: text("expense_type").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

// Insert schemas
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, registrationDate: true });
export const insertVisitSchema = createInsertSchema(visits).omit({ id: true, visitDate: true });
export const insertMedicineSchema = createInsertSchema(medicines).omit({ id: true, totalEarnings: true });
export const insertTreatmentSchema = createInsertSchema(treatments).omit({ id: true });
export const insertBillSchema = createInsertSchema(bills).omit({ id: true, billDate: true });
export const insertBillTreatmentItemSchema = createInsertSchema(billTreatmentItems).omit({ id: true });
export const insertBillMedicineItemSchema = createInsertSchema(billMedicineItems).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, date: true });

// Types
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;

export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;

export type Treatment = typeof treatments.$inferSelect;
export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;

export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type BillTreatmentItem = typeof billTreatmentItems.$inferSelect;
export type InsertBillTreatmentItem = z.infer<typeof insertBillTreatmentItemSchema>;

export type BillMedicineItem = typeof billMedicineItems.$inferSelect;
export type InsertBillMedicineItem = z.infer<typeof insertBillMedicineItemSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// Extended types for frontend with relations
export type PatientWithVisits = Patient & { visits: Visit[] };
export type BillWithItems = Bill & { 
  patient: Patient;
  treatmentItems: BillTreatmentItem[];
  medicineItems: BillMedicineItem[];
};
