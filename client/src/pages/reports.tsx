import { useState } from "react";
import { useReports, useCreateReport } from "@/hooks/use-reports";
import { useInventory } from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertReportSchema.extend({
  equipmentId: z.coerce.number().min(1, "Select equipment"),
  generatedBy: z.coerce.number()
});

type FormValues = z.infer<typeof formSchema>;

export default function Reports() {
  const { data: reports, isLoading: reportsLoading } = useReports();
  const { data: inventory, isLoading: invLoading } = useInventory();
  const { user } = useAuth();
  const createMutation = useCreateReport();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipmentId: 0,
      generatedBy: user?.id || 1, // Fallback to 1 if mock user has no ID
      functionalStatus: "Non Working",
      recommendation: "Repair",
      notes: "",
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast({ title: "Report generated successfully" });
      setOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const getEquipmentName = (id: number) => {
    return inventory?.find(i => i.id === id)?.name || `Unknown ID: ${id}`;
  };

  const canGenerateReport = user?.role === "Admin" || user?.role === "Lab Incharge";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Inspection Reports</h2>
          <p className="text-muted-foreground mt-1">Generate and review technical reports for equipment.</p>
        </div>
        
        {canGenerateReport && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-md hover-elevate">
                <Plus className="w-4 h-4 mr-2" /> Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">New Inspection Report</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Equipment</Label>
                  <Select 
                    onValueChange={(v) => form.setValue("equipmentId", Number(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select equipment..." /></SelectTrigger>
                    <SelectContent>
                      {inventory?.map(i => (
                        <SelectItem key={i.id} value={i.id.toString()}>{i.itemCode} - {i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Functional Status at Inspection</Label>
                  <Select 
                    onValueChange={(v) => form.setValue("functionalStatus", v)} 
                    defaultValue={form.getValues("functionalStatus")}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Working">Working (Sub-optimal)</SelectItem>
                      <SelectItem value="Non Working">Non Working</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expert Recommendation</Label>
                  <Select 
                    onValueChange={(v) => form.setValue("recommendation", v)} 
                    defaultValue={form.getValues("recommendation")}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Continue Use">Continue Use</SelectItem>
                      <SelectItem value="Repair">Requires Repair</SelectItem>
                      <SelectItem value="Condemn">Condemn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Technical Notes</Label>
                  <Textarea {...form.register("notes")} placeholder="Details of inspection..." className="h-24" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>Submit Report</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold text-primary">Date</TableHead>
              <TableHead className="font-semibold text-primary">Equipment</TableHead>
              <TableHead className="font-semibold text-primary">Status</TableHead>
              <TableHead className="font-semibold text-primary">Recommendation</TableHead>
              <TableHead className="font-semibold text-primary">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportsLoading || invLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : reports?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No reports generated yet</TableCell></TableRow>
            ) : (
              reports?.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{new Date(report.date!).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{getEquipmentName(report.equipmentId)}</TableCell>
                  <TableCell>{report.functionalStatus}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${report.recommendation === 'Condemn' ? 'text-red-600' : 'text-blue-600'}`}>
                      {report.recommendation}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
