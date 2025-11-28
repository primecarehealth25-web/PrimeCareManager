import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Pill, AlertTriangle, IndianRupee, Search } from "lucide-react";
import type { Medicine } from "@shared/schema";

const medicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  price: z.string().min(1, "Price is required"),
  quantity: z.coerce.number().min(0, "Quantity must be 0 or more"),
});

type MedicineForm = z.infer<typeof medicineSchema>;

export default function MedicineMaster() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null);

  const { data: medicines, isLoading } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  const form = useForm<MedicineForm>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: "",
      price: "",
      quantity: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MedicineForm) => {
      return await apiRequest("POST", "/api/medicines", data);
    },
    onSuccess: () => {
      toast({
        title: "Medicine added",
        description: "The medicine has been added to inventory.",
      });
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add medicine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MedicineForm }) => {
      return await apiRequest("PATCH", `/api/medicines/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Medicine updated",
        description: "The medicine has been updated.",
      });
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update medicine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/medicines/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Medicine deleted",
        description: "The medicine has been removed from inventory.",
      });
      setDeleteDialogOpen(false);
      setDeletingMedicine(null);
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete medicine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredMedicines = medicines?.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingMedicine(null);
    form.reset({
      name: "",
      price: "",
      quantity: 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    form.reset({
      name: medicine.name,
      price: medicine.price,
      quantity: medicine.quantity,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingMedicine(null);
    form.reset();
  };

  const onSubmit = (data: MedicineForm) => {
    if (editingMedicine) {
      updateMutation.mutate({ id: editingMedicine.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const totalStock = medicines?.reduce((sum, m) => sum + m.quantity, 0) || 0;
  const lowStockCount = medicines?.filter((m) => m.quantity < 10).length || 0;
  const totalEarnings = medicines?.reduce(
    (sum, m) => sum + parseFloat(m.totalEarnings || "0"),
    0
  ) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Medicine Master</h1>
          <p className="text-muted-foreground">Manage medicine inventory</p>
        </div>
        <Button onClick={openAddDialog} data-testid="button-add-medicine">
          <Plus className="h-4 w-4 mr-2" />
          Add Medicine
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock
            </CardTitle>
            <Pill className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-stock">{totalStock}</div>
            <p className="text-xs text-muted-foreground">units in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-low-stock">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">medicines below 10 units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <IndianRupee className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-earnings">
              ₹{totalEarnings.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">from medicine sales</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Medicine Inventory</CardTitle>
            <CardDescription>
              {medicines?.length || 0} medicines in stock
            </CardDescription>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-medicines"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredMedicines && filteredMedicines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine Name</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map((medicine) => (
                  <TableRow key={medicine.id} data-testid={`row-medicine-${medicine.id}`}>
                    <TableCell className="font-medium">{medicine.name}</TableCell>
                    <TableCell className="text-right">
                      ₹{parseFloat(medicine.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {medicine.quantity < 10 ? (
                        <Badge variant="destructive" className="font-mono">
                          {medicine.quantity}
                        </Badge>
                      ) : (
                        <span className="font-mono">{medicine.quantity}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{parseFloat(medicine.totalEarnings || "0").toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(medicine)}
                          data-testid={`button-edit-medicine-${medicine.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setDeletingMedicine(medicine);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`button-delete-medicine-${medicine.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Pill className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-1">No medicines found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Add your first medicine to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicine Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter medicine name"
                        {...field}
                        data-testid="input-medicine-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-medicine-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        data-testid="input-medicine-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-medicine"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingMedicine
                    ? "Update"
                    : "Add Medicine"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingMedicine?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMedicine && deleteMutation.mutate(deletingMedicine.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
