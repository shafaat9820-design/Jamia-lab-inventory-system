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
import { Plus, Check, X } from "lucide-react";
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

export default function Requests() {
  const { data: requests, isLoading } = useRequests();
  const { user } = useAuth();
  const createMutation = useCreateRequest();
  const updateStatusMutation = useUpdateRequestStatus();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const canRequest = user?.role === "Admin" || user?.role === "Lab Incharge";
  const canApprove = user?.role === "Admin" || user?.role === "Principal";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipmentName: "",
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
      toast({ title: "Request submitted successfully" });
      setOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast({ title: `Request marked as ${status}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Procurement Requests</h2>
          <p className="text-muted-foreground mt-1">Manage requests for new equipment or replacements.</p>
        </div>
        
        {canRequest && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-md hover-elevate">
                <Plus className="w-4 h-4 mr-2" /> New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Equipment Request Form</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Equipment Name</Label>
                  <Input {...form.register("equipmentName")} placeholder="e.g. 3D Printer" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" {...form.register("quantity")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      onValueChange={(v) => form.setValue("priority", v)} 
                      defaultValue={form.getValues("priority")}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Lab</Label>
                  <Input {...form.register("labName")} placeholder="e.g. Embedded Systems Lab" />
                </div>
                <div className="space-y-2">
                  <Label>Justification</Label>
                  <Textarea {...form.register("reason")} placeholder="Why is this needed?" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>Submit Request</Button>
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
              <TableHead className="font-semibold text-primary">Equipment</TableHead>
              <TableHead className="font-semibold text-primary">Lab</TableHead>
              <TableHead className="font-semibold text-primary">Priority</TableHead>
              <TableHead className="font-semibold text-primary">Status</TableHead>
              {canApprove && <TableHead className="text-right font-semibold text-primary">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : requests?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No requests found</TableCell></TableRow>
            ) : (
              requests?.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-semibold">{req.equipmentName} <span className="text-muted-foreground font-normal">x{req.quantity}</span></div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs" title={req.reason}>{req.reason}</div>
                  </TableCell>
                  <TableCell>{req.labName}</TableCell>
                  <TableCell>
                    <span className={`font-semibold text-xs px-2 py-1 rounded-full ${
                      req.priority === 'High' ? 'bg-red-100 text-red-700' :
                      req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {req.priority}
                    </span>
                  </TableCell>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  {canApprove && (
                    <TableCell className="text-right">
                      {req.status === 'Requested' && (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusUpdate(req.id, "Approved")}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusUpdate(req.id, "Rejected")}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {req.status === 'Approved' && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(req.id, "Procured")}>
                          Mark Procured
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
