import { useState } from "react";
import { useRequests, useCreateRequest, useUpdateRequestStatus } from "@/hooks/use-requests";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Check, X, ClipboardList } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRequestSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertRequestSchema.extend({
  quantity: z.coerce.number().min(1),
  requestedBy: z.coerce.number()
});

type FormValues = z.infer<typeof formSchema>;

const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles: Record<string, string> = {
    "High": "bg-red-100 text-red-700 border-red-200",
    "Medium": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Low": "bg-green-100 text-green-700 border-green-200",
  };
  const dots: Record<string, string> = {
    "High": "bg-red-500",
    "Medium": "bg-yellow-500",
    "Low": "bg-green-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[priority] || "bg-muted text-muted-foreground border-border"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[priority] || "bg-muted-foreground"}`} />
      {priority}
    </span>
  );
};

export default function Requests() {
  const { data: requests, isLoading } = useRequests();
  const { user } = useAuth();
  const createMutation = useCreateRequest();
  const updateStatusMutation = useUpdateRequestStatus();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const canRequest = user?.role === "Lab Incharge";
  const canApprove = user?.role === "Principal";
  const canProcure = user?.role === "Store Keeper";
  const canViewActions = canApprove || canProcure;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      articleName: "",
      quantity: 1,
      reason: "",
      labName: "",
      priority: "Medium",
      requestedBy: user?.id || 1,
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast({ title: "Article request submitted", description: "Your article procurement request is now pending approval." });
      setOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      const description = status === "Procured" 
        ? "The articles have been marked as procured and automatically added to the inventory."
        : `The article procurement request has been marked as ${status}.`;
      toast({ title: `Request ${status}`, description });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 py-10">
      <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Procurement Requests</h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm ml-14">Manage requests for new or replacement lab articles.</p>
        </div>

        {canRequest && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white rounded-xl px-5 h-11 font-bold shadow-lg shadow-primary/25 transition-all">
                <Plus className="w-4 h-4 mr-2" /> New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Article Request Form
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Article Name</Label>
                  <Input {...form.register("articleName")} placeholder="e.g. 3D Printer, Raspberry Pi Kit" className="h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Quantity</Label>
                    <Input type="number" {...form.register("quantity")} className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Priority</Label>
                    <Select onValueChange={(v) => form.setValue("priority", v)} defaultValue="Medium">
                      <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Target Laboratory</Label>
                  <Input {...form.register("labName")} placeholder="e.g. Embedded Systems Lab" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Justification / Reason</Label>
                  <Textarea {...form.register("reason")} placeholder="Explain why this article is needed..." className="h-24 rounded-lg resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="rounded-xl font-bold">
                    {createMutation.isPending ? "Submitting..." : "Submit Request"}
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
              <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider pl-5">Article</TableHead>
              <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Laboratory</TableHead>
              <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Priority</TableHead>
              <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Status</TableHead>
              {canViewActions && <TableHead className="text-right font-bold text-foreground/70 text-[11px] uppercase tracking-wider pr-5">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, ...(canApprove ? [5] : [])].map(j => (
                    <TableCell key={j}><div className="h-4 bg-muted/60 rounded-full animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : requests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canApprove ? 5 : 4} className="text-center py-24">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                      <ClipboardList className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="font-bold text-muted-foreground text-lg">No procurement requests</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Submit a new request to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              requests?.map((req, index) => (
                <TableRow key={req.id} className={`hover:bg-primary/[0.02] transition-colors border-b last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/[0.04]'}`}>
                  <TableCell className="py-4 pl-5">
                    <p className="font-bold text-foreground">{req.articleName} <span className="text-muted-foreground font-normal">×{req.quantity}</span></p>
                    <p className="text-xs text-muted-foreground/70 truncate max-w-xs mt-0.5" title={req.reason}>{req.reason}</p>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-muted-foreground">{req.labName}</TableCell>
                  <TableCell><PriorityBadge priority={req.priority} /></TableCell>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell className="text-right pr-5">
                    {canViewActions && (
                      <div className="flex justify-end gap-2">
                        {canApprove && req.status === "Requested" && (
                          <>
                            <Button
                              size="sm" variant="outline"
                              className="h-8 rounded-lg text-green-700 border-green-200 hover:bg-green-50 font-bold text-xs gap-1.5"
                              onClick={() => handleStatusUpdate(req.id, "Approved")}
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-8 rounded-lg text-red-700 border-red-200 hover:bg-red-50 font-bold text-xs gap-1.5"
                              onClick={() => handleStatusUpdate(req.id, "Rejected")}
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        {canProcure && req.status === "Approved" && (
                          <Button
                            size="sm" variant="outline"
                            className="h-8 rounded-lg font-bold text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            onClick={() => handleStatusUpdate(req.id, "Procured")}
                          >
                            Mark Procured
                          </Button>
                        )}
                      </div>
                    )}
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
