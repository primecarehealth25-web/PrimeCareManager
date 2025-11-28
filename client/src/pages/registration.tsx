import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserPlus, Users, Phone, Calendar, Search } from "lucide-react";
import { format } from "date-fns";
import type { PatientWithVisits } from "@shared/schema";

const newPatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  complaints: z.string().min(1, "Complaints are required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
});

const followUpSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  complaints: z.string().min(1, "Complaints are required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
});

type NewPatientForm = z.infer<typeof newPatientSchema>;
type FollowUpForm = z.infer<typeof followUpSchema>;

export default function Registration() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("new");

  const { data: patients, isLoading: patientsLoading } = useQuery<PatientWithVisits[]>({
    queryKey: ["/api/patients"],
  });

  const newPatientForm = useForm<NewPatientForm>({
    resolver: zodResolver(newPatientSchema),
    defaultValues: {
      name: "",
      phone: "",
      complaints: "",
      diagnosis: "",
    },
  });

  const followUpForm = useForm<FollowUpForm>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      patientId: "",
      complaints: "",
      diagnosis: "",
      treatment: "",
      prescription: "",
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: NewPatientForm) => {
      return await apiRequest("POST", "/api/patients", data);
    },
    onSuccess: () => {
      toast({
        title: "Patient registered successfully",
        description: "The patient has been added to the system.",
      });
      newPatientForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addVisitMutation = useMutation({
    mutationFn: async (data: FollowUpForm) => {
      return await apiRequest("POST", "/api/visits", {
        patientId: parseInt(data.patientId),
        complaints: data.complaints,
        diagnosis: data.diagnosis,
        treatment: data.treatment || null,
        prescription: data.prescription || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Follow-up recorded",
        description: "The visit has been added to patient's history.",
      });
      followUpForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record visit",
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

  const selectedPatient = patients?.find(
    (p) => p.id.toString() === followUpForm.watch("patientId")
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Patient Registration</h1>
        <p className="text-muted-foreground">Register new patients or add follow-up visits</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="new" data-testid="tab-new-patient">
            <UserPlus className="h-4 w-4 mr-2" />
            New Patient
          </TabsTrigger>
          <TabsTrigger value="followup" data-testid="tab-followup">
            <Users className="h-4 w-4 mr-2" />
            Follow-up Visit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>New Patient Registration</CardTitle>
              <CardDescription>
                Register a new patient with their initial visit details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...newPatientForm}>
                <form
                  onSubmit={newPatientForm.handleSubmit((data) => createPatientMutation.mutate(data))}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={newPatientForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter patient name"
                              {...field}
                              data-testid="input-patient-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newPatientForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter phone number"
                              {...field}
                              data-testid="input-patient-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={newPatientForm.control}
                    name="complaints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complaints *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter patient's complaints"
                            className="min-h-24 resize-none"
                            {...field}
                            data-testid="input-complaints"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newPatientForm.control}
                    name="diagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter diagnosis"
                            className="min-h-24 resize-none"
                            {...field}
                            data-testid="input-diagnosis"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={createPatientMutation.isPending}
                    data-testid="button-register-patient"
                  >
                    {createPatientMutation.isPending ? "Registering..." : "Register Patient"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followup">
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
                    data-testid="input-search-followup"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
                {patientsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredPatients && filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        followUpForm.watch("patientId") === patient.id.toString()
                          ? "border-primary bg-primary/5"
                          : "hover-elevate"
                      }`}
                      onClick={() => followUpForm.setValue("patientId", patient.id.toString())}
                      data-testid={`select-patient-${patient.id}`}
                    >
                      <p className="font-medium">{patient.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No patients found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Add Follow-up Visit</CardTitle>
                {selectedPatient && (
                  <div className="flex items-center gap-4 mt-2 p-3 rounded-md bg-muted/50">
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
                        <Badge variant="secondary" className="text-xs">
                          {selectedPatient.visits?.length || 0} previous visits
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Form {...followUpForm}>
                  <form
                    onSubmit={followUpForm.handleSubmit((data) => addVisitMutation.mutate(data))}
                    className="space-y-6"
                  >
                    <FormField
                      control={followUpForm.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input type="hidden" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={followUpForm.control}
                      name="complaints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Complaints *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter patient's current complaints"
                              className="min-h-24 resize-none"
                              {...field}
                              data-testid="input-followup-complaints"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={followUpForm.control}
                      name="diagnosis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diagnosis *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter diagnosis"
                              className="min-h-24 resize-none"
                              {...field}
                              data-testid="input-followup-diagnosis"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={followUpForm.control}
                      name="treatment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter treatment details (optional)"
                              className="min-h-20 resize-none"
                              {...field}
                              data-testid="input-followup-treatment"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={followUpForm.control}
                      name="prescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prescription</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter prescription details (optional)"
                              className="min-h-20 resize-none"
                              {...field}
                              data-testid="input-followup-prescription"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={!selectedPatient || addVisitMutation.isPending}
                      data-testid="button-add-visit"
                    >
                      {addVisitMutation.isPending ? "Recording..." : "Record Visit"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
