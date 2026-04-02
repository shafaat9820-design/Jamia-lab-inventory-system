import { useState } from "react";
import { useReports, useCreateReport } from "@/hooks/use-reports";
import { useInventory } from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { downloadEquipmentReport } from "@/lib/pdf-generator";
import { Download, FileText, Plus, Wrench, CheckCircle2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertReportSchema.extend({
  equipmentId: z.coerce.number().min(1, "Select equipment"),
  generatedBy: z.coerce.number()
});

type FormValues = z.infer<typeof formSchema>;

const RecommendationBadge = ({ rec }: { rec: string }) => {
  const styles: Record<string, string> = {
    "Condemn": "bg-red-100 text-red-700 border-red-200",
    "Repair": "bg-amber-100 text-amber-700 border-amber-200",
    "Continue Use": "bg-green-100 text-green-700 border-green-200",
  };
  const icons: Record<string, any> = {
    "Condemn": AlertTriangle,
    "Repair": Wrench,
    "Continue Use": CheckCircle2,
  };
  const Icon = icons[rec] || FileText;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[rec] || "bg-muted text-muted-foreground border-border"}`}>
      <Icon className="w-3 h-3" />
      {rec}
    </span>
  );
};

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
      generatedBy: user?.id || 1,
      functionalStatus: "Non Working",
      recommendation: "Repair",
      notes: "",
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast({ title: "Report filed", description: "Inspection report has been recorded successfully." });
      setOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const getEquipmentName = (id: number) =>
    inventory?.find(i => i.id === id)?.name || `Equipment #${id}`;

  const canGenerateReport = user?.role === "Admin" || user?.role === "Lab Incharge";

  const handleDownload = (report: any) => {
    const equip = inventory?.find(i => i.id === report.equipmentId);
    if (!equip) return;
    downloadEquipmentReport(report, equip, user);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Inspection Reports</h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm ml-14">Technical evaluation reports for lab equipment.</p>
        </div>

        {canGenerateReport && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white rounded-xl px-5 h-11 font-bold shadow-lg shadow-primary/25 transition-all">
                <Plus className="w-4 h-4 mr-2" /> New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                  File Inspection Report
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Equipment</Label>
                  <Select onValueChange={(v) => form.setValue("equipmentId", Number(v))}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Select equipment..." /></SelectTrigger>
                    <SelectContent>
                      {inventory?.map(i => (
                        <SelectItem key={i.id} value={i.id.toString()}>{i.itemCode} — {i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Functional Status at Inspection</Label>
                  <Select onValueChange={(v) => form.setValue("functionalStatus", v)} defaultValue="Non Working">
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Working">Working (Sub-optimal)</SelectItem>
                      <SelectItem value="Non Working">Non Working</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Expert Recommendation</Label>
                  <Select onValueChange={(v) => form.setValue("recommendation", v)} defaultValue="Repair">
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Continue Use">Continue Use</SelectItem>
                      <SelectItem value="Repair">Requires Repair</SelectItem>
                      <SelectItem value="Condemn">Condemn Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Technical Notes</Label>
                  <Textarea {...form.register("notes")} placeholder="Describe the inspection findings in detail..." className="h-28 rounded-lg resize-none" />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="rounded-xl font-bold">
                    {createMutation.isPending ? "Filing..." : "File Report"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-foreground/70 text-xs uppercase tracking-wider">Date</TableHead>
              <TableHead className="font-bold text-foreground/70 text-xs uppercase tracking-wider">Equipment</TableHead>
              <TableHead className="font-bold text-foreground/70 text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-bold text-foreground/70 text-xs uppercase tracking-wider">Recommendation</TableHead>
              <TableHead className="font-bold text-foreground/70 text-xs uppercase tracking-wider">Notes</TableHead>
              <TableHead className="text-right font-bold text-foreground/70 text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportsLoading || invLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5].map(j => (
                    <TableCell key={j}><div className="h-4 bg-muted/60 rounded-full animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : reports?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/25 mb-3" />
                  <p className="font-semibold text-muted-foreground">No reports filed yet</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Generate the first inspection report to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              reports?.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/20 transition-colors border-b last:border-0">
                  <TableCell className="text-sm font-semibold whitespace-nowrap text-muted-foreground">
                    {new Date(report.date!).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-foreground">{getEquipmentName(report.equipmentId)}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${report.functionalStatus === "Working" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                      {report.functionalStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <RecommendationBadge rec={report.recommendation} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={report.notes || ""}>
                    {report.notes || <span className="italic text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg transition-all"
                      onClick={() => handleDownload(report)}
                      title="Download PDF Report"
                    >
                      <Download className="w-4 h-4" />
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
