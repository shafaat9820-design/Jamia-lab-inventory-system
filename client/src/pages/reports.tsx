import { useState } from "react";
import { useReports, useCreateReport, useUpdateReportStatus } from "@/hooks/use-reports";
import { useInventory } from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { downloadArticleReport } from "@/lib/pdf-generator";
import { Download, FileText, Plus, Wrench, CheckCircle2, AlertTriangle, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertReportSchema.extend({
  articleId: z.coerce.number().min(1, "Select article"),
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
  const updateStatusMutation = useUpdateReportStatus();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      articleId: 0,
      generatedBy: user?.id || 1,
      functionalStatus: "Non Working",
      recommendation: "Repair",
      notes: "",
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast({ title: "Report filed", description: "Inspection report has been recorded successfully and is pending approval." });
      setOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast({ title: `Report ${status}`, description: `The inspection report has been marked as ${status}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const getArticleName = (id: number) =>
    inventory?.find(i => i.id === id)?.name || `Article #${id}`;

  const canGenerateReport = user?.role === "Lab Incharge";
  const canApprove = user?.role === "Principal";

  const handleDownload = (report: any) => {
    const equip = inventory?.find(i => i.id === report.articleId);
    if (!equip) return;
    downloadArticleReport(report, equip, user);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 py-10">
      <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Inspection Reports</h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm ml-14">Technical evaluation reports for lab articles.</p>
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
                  <Label className="text-sm font-semibold">Article</Label>
                  <Select onValueChange={(v) => form.setValue("articleId", Number(v))}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Select article..." /></SelectTrigger>
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
                      <SelectItem value="Condemn">Condemn Article</SelectItem>
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

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="table-wrapper">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#0d3318]/[0.03] hover:bg-[#0d3318]/[0.03]">
              <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider pl-5">Date</TableHead>
              <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Article</TableHead>
              <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Recommendation</TableHead>
              <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Notes</TableHead>
              <TableHead className="text-right font-bold text-foreground/70 text-[11px] uppercase tracking-wider pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportsLoading || invLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6].map(j => (
                    <TableCell key={j}><div className="h-4 bg-muted/60 rounded-full animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : reports?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-24">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="font-bold text-muted-foreground text-lg">No reports filed yet</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Generate the first inspection report to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports?.map((report, index) => (
                <TableRow key={report.id} className={`hover:bg-primary/[0.02] transition-colors border-b last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/[0.04]'}`}>
                  <TableCell className="text-sm font-semibold whitespace-nowrap text-muted-foreground pl-5">
                    {new Date(report.date!).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-foreground leading-tight">{getArticleName(report.articleId)}</p>
                    <p className={`text-[10px] font-bold mt-1 uppercase ${report.functionalStatus === "Working" ? "text-green-600" : "text-red-600"}`}>
                      {report.functionalStatus}
                    </p>
                  </TableCell>
                  <TableCell>
                    <RecommendationBadge rec={report.recommendation} />
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      report.status === "Approved" ? "bg-green-100 text-green-700 border-green-200" :
                      report.status === "Rejected" ? "bg-red-100 text-red-700 border-red-200" :
                      "bg-blue-100 text-blue-700 border-blue-200"
                    }`}>
                      {report.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={report.notes || ""}>
                    {report.notes || <span className="italic text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-right pr-5">
                    <div className="flex justify-end gap-2 items-center">
                      {canApprove && report.status === "Pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm" variant="outline"
                            className="h-8 rounded-lg text-green-700 border-green-200 hover:bg-green-50 font-bold text-xs gap-1.5"
                            onClick={() => handleStatusUpdate(report.id, "Approved")}
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            className="h-8 rounded-lg text-red-700 border-red-200 hover:bg-red-50 font-bold text-xs gap-1.5"
                            onClick={() => handleStatusUpdate(report.id, "Rejected")}
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-xs px-3 shadow shadow-primary/20"
                        onClick={() => handleDownload(report)}
                        title="Download PDF Report"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
      </div>
    </div>
  );
}
