import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  Phone,
  Calendar,
  IndianRupee,
  FileText,
  Check,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { Patient, Medicine, Treatment, BillWithItems } from "@shared/schema";

interface TreatmentItem {
  treatmentId: number;
  treatmentName: string;
  amount: string;
}

interface MedicineItem {
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPrice: string;
  amount: string;
}

export default function Billing() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [treatmentItems, setTreatmentItems] = useState<TreatmentItem[]>([]);
  const [medicineItems, setMedicineItems] = useState<MedicineItem[]>([]);
  const [paidAmount, setPaidAmount] = useState("");
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillWithItems | null>(null);
  const [settleAmount, setSettleAmount] = useState("");

  const { data: patients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: medicines } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  const { data: treatments } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments"],
  });

  const { data: bills, isLoading: billsLoading } = useQuery<BillWithItems[]>({
    queryKey: ["/api/bills"],
  });

  const createBillMutation = useMutation({
    mutationFn: async (data: {
      patientId: number;
      treatmentItems: TreatmentItem[];
      medicineItems: MedicineItem[];
      paidAmount: string;
    }) => {
      return await apiRequest("POST", "/api/bills", data);
    },
    onSuccess: () => {
      toast({
        title: "Bill created successfully",
        description: "The bill has been recorded.",
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create bill",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const settlePaymentMutation = useMutation({
    mutationFn: async ({ billId, amount }: { billId: number; amount: string }) => {
      return await apiRequest("POST", `/api/bills/${billId}/settle`, { amount });
    },
    onSuccess: () => {
      toast({
        title: "Payment recorded",
        description: "The payment has been updated.",
      });
      setSettleDialogOpen(false);
      setSelectedBill(null);
      setSettleAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredPatients = patients?.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery)
  );

  const selectedPatient = patients?.find((p) => p.id === selectedPatientId);

  const pendingBills = bills?.filter((b) => b.status === "pending") || [];

  const addTreatmentItem = () => {
    setTreatmentItems([
      ...treatmentItems,
      { treatmentId: 0, treatmentName: "", amount: "" },
    ]);
  };

  const addMedicineItem = () => {
    setMedicineItems([
      ...medicineItems,
      { medicineId: 0, medicineName: "", quantity: 1, unitPrice: "", amount: "" },
    ]);
  };

  const updateTreatmentItem = (index: number, treatmentId: number) => {
    const treatment = treatments?.find((t) => t.id === treatmentId);
    if (treatment) {
      const updated = [...treatmentItems];
      updated[index] = {
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        amount: treatment.price,
      };
      setTreatmentItems(updated);
    }
  };

  const updateTreatmentAmount = (index: number, amount: string) => {
    const updated = [...treatmentItems];
    updated[index].amount = amount;
    setTreatmentItems(updated);
  };

  const removeTreatmentItem = (index: number) => {
    setTreatmentItems(treatmentItems.filter((_, i) => i !== index));
  };

  const updateMedicineItem = (index: number, medicineId: number) => {
    const medicine = medicines?.find((m) => m.id === medicineId);
    if (medicine) {
      const updated = [...medicineItems];
      const qty = updated[index].quantity || 1;
      updated[index] = {
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity: qty,
        unitPrice: medicine.price,
        amount: (parseFloat(medicine.price) * qty).toFixed(2),
      };
      setMedicineItems(updated);
    }
  };

  const updateMedicineQuantity = (index: number, quantity: number) => {
    const updated = [...medicineItems];
    updated[index].quantity = quantity;
    updated[index].amount = (parseFloat(updated[index].unitPrice || "0") * quantity).toFixed(2);
    setMedicineItems(updated);
  };

  const updateMedicinePrice = (index: number, price: string) => {
    const updated = [...medicineItems];
    updated[index].unitPrice = price;
    updated[index].amount = (parseFloat(price || "0") * updated[index].quantity).toFixed(2);
    setMedicineItems(updated);
  };

  const removeMedicineItem = (index: number) => {
    setMedicineItems(medicineItems.filter((_, i) => i !== index));
  };

  const totalAmount =
    treatmentItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0) +
    medicineItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);

  const pendingAmount = totalAmount - parseFloat(paidAmount || "0");

  const resetForm = () => {
    setSelectedPatientId(null);
    setTreatmentItems([]);
    setMedicineItems([]);
    setPaidAmount("");
    setSearchQuery("");
  };

  const handleCreateBill = () => {
    if (!selectedPatientId) {
      toast({
        title: "Select a patient",
        description: "Please select a patient before creating a bill.",
        variant: "destructive",
      });
      return;
    }

    if (treatmentItems.length === 0 && medicineItems.length === 0) {
      toast({
        title: "Add items",
        description: "Please add at least one treatment or medicine.",
        variant: "destructive",
      });
      return;
    }

    createBillMutation.mutate({
      patientId: selectedPatientId,
      treatmentItems: treatmentItems.filter((t) => t.treatmentId > 0),
      medicineItems: medicineItems.filter((m) => m.medicineId > 0),
      paidAmount: paidAmount || "0",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Medicine / Billing</h1>
        <p className="text-muted-foreground">Create bills and manage payments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create" data-testid="tab-create-bill">
            <Plus className="h-4 w-4 mr-2" />
            Create Bill
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all-bills">
            <FileText className="h-4 w-4 mr-2" />
            All Bills
            {pendingBills.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {pendingBills.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Select Patient</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-billing-patient"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto space-y-2">
                {patientsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : filteredPatients && filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedPatientId === patient.id
                          ? "border-primary bg-primary/5"
                          : "hover-elevate"
                      }`}
                      onClick={() => setSelectedPatientId(patient.id)}
                      data-testid={`billing-select-patient-${patient.id}`}
                    >
                      <p className="font-medium">{patient.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No patients found
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Bill Details</CardTitle>
                {selectedPatient && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 mt-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                      {selectedPatient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{selectedPatient.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedPatient.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(selectedPatient.registrationDate), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Treatments</h3>
                    <Button size="sm" variant="outline" onClick={addTreatmentItem} data-testid="button-add-treatment">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Treatment
                    </Button>
                  </div>
                  {treatmentItems.length > 0 ? (
                    <div className="space-y-2">
                      {treatmentItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select
                            value={item.treatmentId.toString()}
                            onValueChange={(val) => updateTreatmentItem(index, parseInt(val))}
                          >
                            <SelectTrigger className="flex-1" data-testid={`select-treatment-${index}`}>
                              <SelectValue placeholder="Select treatment" />
                            </SelectTrigger>
                            <SelectContent>
                              {treatments?.map((t) => (
                                <SelectItem key={t.id} value={t.id.toString()}>
                                  {t.name} - ₹{t.price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={item.amount}
                            onChange={(e) => updateTreatmentAmount(index, e.target.value)}
                            className="w-28"
                            data-testid={`input-treatment-amount-${index}`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeTreatmentItem(index)}
                            data-testid={`button-remove-treatment-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No treatments added</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Medicines</h3>
                    <Button size="sm" variant="outline" onClick={addMedicineItem} data-testid="button-add-medicine">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Medicine
                    </Button>
                  </div>
                  {medicineItems.length > 0 ? (
                    <div className="space-y-2">
                      {medicineItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 flex-wrap">
                          <Select
                            value={item.medicineId.toString()}
                            onValueChange={(val) => updateMedicineItem(index, parseInt(val))}
                          >
                            <SelectTrigger className="flex-1 min-w-[150px]" data-testid={`select-medicine-${index}`}>
                              <SelectValue placeholder="Select medicine" />
                            </SelectTrigger>
                            <SelectContent>
                              {medicines?.map((m) => (
                                <SelectItem key={m.id} value={m.id.toString()}>
                                  {m.name} - ₹{m.price} (Stock: {m.quantity})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateMedicineQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-20"
                            data-testid={`input-medicine-qty-${index}`}
                          />
                          <Input
                            type="number"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) => updateMedicinePrice(index, e.target.value)}
                            className="w-24"
                            data-testid={`input-medicine-price-${index}`}
                          />
                          <div className="w-24 text-right font-medium">
                            ₹{item.amount || "0"}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeMedicineItem(index)}
                            data-testid={`button-remove-medicine-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No medicines added</p>
                  )}
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold" data-testid="text-total-amount">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">Amount Paid</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          className="pl-9"
                          data-testid="input-paid-amount"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">Pending Amount</label>
                      <div
                        className={`h-10 flex items-center px-3 rounded-md border ${
                          pendingAmount > 0
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-muted"
                        }`}
                        data-testid="text-pending-amount"
                      >
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {pendingAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCreateBill}
                    disabled={createBillMutation.isPending || !selectedPatientId}
                    data-testid="button-generate-bill"
                  >
                    {createBillMutation.isPending ? "Creating..." : "Generate Bill"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Bills</CardTitle>
              <CardDescription>View and manage all bills</CardDescription>
            </CardHeader>
            <CardContent>
              {billsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : bills && bills.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill.id} data-testid={`row-bill-${bill.id}`}>
                        <TableCell className="font-medium">#{bill.id}</TableCell>
                        <TableCell>{bill.patient?.name || "Unknown"}</TableCell>
                        <TableCell>
                          {format(new Date(bill.billDate), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{parseFloat(bill.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{parseFloat(bill.paidAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{parseFloat(bill.pendingAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {bill.status === "paid" ? (
                            <Badge className="bg-chart-2 text-white">
                              <Check className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {bill.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBill(bill);
                                setSettleAmount("");
                                setSettleDialogOpen(true);
                              }}
                              data-testid={`button-settle-${bill.id}`}
                            >
                              Settle Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-1">No bills yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Create your first bill to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle Payment</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-muted/50">
                <p className="font-medium">{selectedBill.patient?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Bill #{selectedBill.id} - {format(new Date(selectedBill.billDate), "dd MMM yyyy")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">₹{parseFloat(selectedBill.totalAmount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Already Paid</p>
                  <p className="font-semibold">₹{parseFloat(selectedBill.paidAmount).toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Pending Amount</p>
                  <p className="font-semibold text-destructive text-lg">
                    ₹{parseFloat(selectedBill.pendingAmount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Amount Received</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="pl-9"
                    data-testid="input-settle-amount"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedBill && settleAmount) {
                  settlePaymentMutation.mutate({
                    billId: selectedBill.id,
                    amount: settleAmount,
                  });
                }
              }}
              disabled={!settleAmount || settlePaymentMutation.isPending}
              data-testid="button-confirm-settle"
            >
              {settlePaymentMutation.isPending ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
