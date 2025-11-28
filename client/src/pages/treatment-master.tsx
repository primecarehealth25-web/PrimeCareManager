import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Stethoscope, Search } from "lucide-react";
import type { Treatment } from "@shared/schema";

const treatmentSchema = z.object({
  name: z.string().min(1, "Treatment name is required"),
  price: z.string().min(1, "Price is required"),
});

type TreatmentForm = z.infer<typeof treatmentSchema>;

export default function TreatmentMaster() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [deletingTreatment, setDeletingTreatment] = useState<Treatment | null>(null);

  const { data: treatments, isLoading } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments"],
  });

  const form = useForm<TreatmentForm>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      name: "",
      price: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TreatmentForm) => {
      return await apiRequest("POST", "/api/treatments", data);
    },
    onSuccess: () => {
      toast({
        title: "Treatment added",
        description: "The treatment has been added.",
      });
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add treatment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TreatmentForm }) => {
      return await apiRequest("PATCH", `/api/treatments/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Treatment updated",
        description: "The treatment has been updated.",
      });
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update treatment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/treatments/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Treatment deleted",
        description: "The treatment has been removed.",
      });
      setDeleteDialogOpen(false);
      setDeletingTreatment(null);
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete treatment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredTreatments = treatments?.filter((treatment) =>
    treatment.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingTreatment(null);
    form.reset({
      name: "",
      price: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    form.reset({
      name: treatment.name,
      price: treatment.price,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTreatment(null);
    form.reset();
  };

  const onSubmit = (data: TreatmentForm) => {
    if (editingTreatment) {
      updateMutation.mutate({ id: editingTreatment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Treatment Master</h1>
          <p className="text-muted-foreground">Manage available treatments</p>
        </div>
        <Button onClick={openAddDialog} data-testid="button-add-treatment">
          <Plus className="h-4 w-4 mr-2" />
          Add Treatment
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Treatment List</CardTitle>
            <CardDescription>
              {treatments?.length || 0} treatments available
            </CardDescription>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search treatments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-treatments"
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
          ) : filteredTreatments && filteredTreatments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Treatment Name</TableHead>
                  <TableHead className="text-right">Default Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatments.map((treatment) => (
                  <TableRow key={treatment.id} data-testid={`row-treatment-${treatment.id}`}>
                    <TableCell className="font-medium">{treatment.name}</TableCell>
                    <TableCell className="text-right">
                      ₹{parseFloat(treatment.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(treatment)}
                          data-testid={`button-edit-treatment-${treatment.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setDeletingTreatment(treatment);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`button-delete-treatment-${treatment.id}`}
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
              <Stethoscope className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-1">No treatments found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Add your first treatment to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTreatment ? "Edit Treatment" : "Add New Treatment"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter treatment name"
                        {...field}
                        data-testid="input-treatment-name"
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
                    <FormLabel>Default Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-treatment-price"
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
                  data-testid="button-save-treatment"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingTreatment
                    ? "Update"
                    : "Add Treatment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Treatment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTreatment?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTreatment && deleteMutation.mutate(deletingTreatment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-treatment"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
