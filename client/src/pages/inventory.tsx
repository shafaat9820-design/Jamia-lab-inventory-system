import { useState } from "react";
import { useInventory, useCreateInventory, useUpdateInventory, useDeleteInventory } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, calculateCurrentValue } from "@/lib/depreciation";
import { Plus, Edit, Trash2, Search, Package, Filter } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertInventorySchema.extend({
  originalCost: z.coerce.number().min(0),
  depreciationRate: z.coerce.number().min(0).max(100),
  usefulLife: z.coerce.number().min(1),
  purchaseDate: z.coerce.date().transform(d => d.toISOString().split('T')[0]),
});

type FormValues = z.infer<typeof formSchema>;

export default function Inventory() {
  const { data: inventory, isLoading } = useInventory();
  const { user } = useAuth();
  const totalItems = inventory?.length || 0;
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();
  const { toast } = useToast();

  const canEdit = user?.role === "Admin" || user?.role === "Store Keeper";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemCode: "",
      name: "",
      category: "",
      labName: "",
      purchaseDate: new Date().toISOString().split('T')[0],
      originalCost: 0,
      depreciationRate: 10,
      usefulLife: 5,
      functionalStatus: "Working",
      approvalStatus: "Active",
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...(data as any) });
        toast({ title: "Asset updated", description: "Equipment record has been updated successfully." });
      } else {
        await createMutation.mutateAsync(data as any);
        toast({ title: "Asset registered", description: "New equipment has been added to inventory." });
      }
      setDialogOpen(false);
      form.reset();
      setEditingId(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    form.reset({ ...item, purchaseDate: new Date(item.purchaseDate).toISOString().split('T')[0] });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to remove this equipment from inventory? This action cannot be undone.")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: "Asset removed", description: "Equipment has been deregistered from inventory." });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
      }
    }
  };

  const filteredItems = (inventory || []).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.labName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "working" && item.functionalStatus === "Working") ||
      (statusFilter === "nonworking" && item.functionalStatus === "Non Working") ||
      (statusFilter === "condemned" && item.approvalStatus === "Condemned");
    return matchesSearch && matchesStatus;
  });

  const FormField = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Asset Inventory</h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm ml-14">
            {isLoading ? "Loading..." : `${filteredItems.length} of ${(inventory || []).length} assets displayed`}
          </p>
        </div>

        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { form.reset(); setEditingId(null); } }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-5 h-11 font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Register Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {editingId ? "Edit Equipment Record" : "Register New Equipment"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Item / Asset Code">
                    <Input {...form.register("itemCode")} placeholder="e.g. CE-LAB1-001" className="h-10 rounded-lg" />
                  </FormField>
                  <FormField label="Equipment Name">
                    <Input {...form.register("name")} placeholder="e.g. Digital Oscilloscope" className="h-10 rounded-lg" />
                  </FormField>
                  <FormField label="Category">
                    <Input {...form.register("category")} placeholder="e.g. Electronics, Computing" className="h-10 rounded-lg" />
                  </FormField>
                  <FormField label="Laboratory Name">
                    <Input {...form.register("labName")} placeholder="e.g. Hardware Lab" className="h-10 rounded-lg" />
                  </FormField>
                  <FormField label="Purchase Date">
                    <Input type="date" {...form.register("purchaseDate")} className="h-10 rounded-lg" />
                  </FormField>
                  <FormField label="Original Cost (₹)">
                    <Input type="number" step="0.01" {...form.register("originalCost")} className="h-10 rounded-lg" />
                  </FormField>
                  <FormField label="Depreciation Rate (% per year)">
                    <Input type="number" step="0.1" {...form.register("depreciationRate")} className="h-10 rounded-lg" />
                  </FormField>
                  <FormField label="Useful Life (Years)">
                    <Input type="number" {...form.register("usefulLife")} className="h-10 rounded-lg" />
                  </FormField>
                  <FormField label="Functional Status">
                    <Select onValueChange={(v) => form.setValue("functionalStatus", v)} defaultValue={form.getValues("functionalStatus")}>
                      <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Working">✅ Working</SelectItem>
                        <SelectItem value="Non Working">❌ Non Working</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Approval Status">
                    <Select onValueChange={(v) => form.setValue("approvalStatus", v)} defaultValue={form.getValues("approvalStatus")}>
                      <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Condemned">Condemned</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl px-5">Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl px-6 font-bold">
                    {editingId ? "Update Record" : "Register Asset"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or lab..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-44 rounded-xl bg-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="working">Working</SelectItem>
                <SelectItem value="nonworking">Non Working</SelectItem>
                <SelectItem value="condemned">Condemned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-bold text-foreground/70 text-xs uppercase tracking-wider">Asset</TableHead>
                <TableHead className="font-bold text-foreground/70 text-xs uppercase tracking-wider">Laboratory</TableHead>
                <TableHead className="font-bold text-foreground/70 text-xs uppercase tracking-wider text-right">Orig. Cost</TableHead>
                <TableHead className="font-bold text-foreground/70 text-xs uppercase tracking-wider text-right">Current Value</TableHead>
                <TableHead className="font-bold text-foreground/70 text-xs uppercase tracking-wider">Status</TableHead>
                {canEdit && <TableHead className="text-right font-bold text-foreground/70 text-xs uppercase tracking-wider">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: canEdit ? 6 : 5 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted/60 rounded-full animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-20">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground/25 mb-3" />
                    <p className="font-semibold text-muted-foreground">No equipment found</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">
                      {searchTerm ? "Try a different search term." : "Register your first asset to get started."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const currentValue = calculateCurrentValue(item.originalCost, item.depreciationRate, item.purchaseDate);
                  const deprPct = totalItems ? Math.round(((Number(item.originalCost) - currentValue) / (Number(item.originalCost) || 1)) * 100) : 0;
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors border-b last:border-0">
                      <TableCell className="py-4">
                        <div>
                          <p className="font-bold text-foreground">{item.name}</p>
                          <p className="text-xs font-mono text-muted-foreground/70 mt-0.5">{item.itemCode} · {item.category}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-muted-foreground">{item.labName}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-sm">{formatCurrency(Number(item.originalCost))}</TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="tabular-nums font-black text-sm text-primary">{formatCurrency(currentValue)}</p>
                          <p className="text-xs text-red-500/70 font-medium">{deprPct}% loss</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={item.functionalStatus} />
                          {item.approvalStatus !== "Active" && <StatusBadge status={item.approvalStatus} />}
                        </div>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => handleEdit(item)}
                              className="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
