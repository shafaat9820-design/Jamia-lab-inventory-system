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
import { Plus, Edit, Trash2, Search } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();
  const { toast } = useToast();

  const canEdit = user?.role === "Admin" || user?.role === "Store Keeper";
  const canView = true; // All roles can view

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
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast({ title: "Item updated successfully" });
      } else {
        await createMutation.mutateAsync(data as any);
        toast({ title: "Item added successfully" });
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
    form.reset({
      ...item,
      purchaseDate: new Date(item.purchaseDate).toISOString().split('T')[0],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: "Item deleted successfully" });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
      }
    }
  };

  const filteredItems = inventory?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Asset Inventory</h2>
          <p className="text-muted-foreground mt-1">Manage lab equipment and track depreciation.</p>
        </div>
        
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { form.reset(); setEditingId(null); }
          }}>
            <DialogTrigger asChild>
              <Button className="shadow-md hover-elevate">
                <Plus className="w-4 h-4 mr-2" /> Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{editingId ? "Edit Equipment" : "Add New Equipment"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Code</Label>
                    <Input {...form.register("itemCode")} placeholder="e.g. CE-LAB1-001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input {...form.register("name")} placeholder="e.g. Oscilloscope" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input {...form.register("category")} placeholder="e.g. Electronics" />
                  </div>
                  <div className="space-y-2">
                    <Label>Lab Name</Label>
                    <Input {...form.register("labName")} placeholder="e.g. Hardware Lab" />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Date</Label>
                    <Input type="date" {...form.register("purchaseDate")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Original Cost (₹)</Label>
                    <Input type="number" step="0.01" {...form.register("originalCost")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Depreciation Rate (%)</Label>
                    <Input type="number" step="0.1" {...form.register("depreciationRate")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Useful Life (Years)</Label>
                    <Input type="number" {...form.register("usefulLife")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Functional Status</Label>
                    <Select onValueChange={(v) => form.setValue("functionalStatus", v)} defaultValue={form.getValues("functionalStatus")}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Working">Working</SelectItem>
                        <SelectItem value="Non Working">Non Working</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Approval Status</Label>
                    <Select onValueChange={(v) => form.setValue("approvalStatus", v)} defaultValue={form.getValues("approvalStatus")}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Condemned">Condemned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Update" : "Save"} Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by code or name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold text-primary">Item</TableHead>
                <TableHead className="font-semibold text-primary">Lab</TableHead>
                <TableHead className="font-semibold text-primary text-right">Orig. Cost</TableHead>
                <TableHead className="font-semibold text-primary text-right">Depr. Value</TableHead>
                <TableHead className="font-semibold text-primary">Status</TableHead>
                {canEdit && <TableHead className="text-right font-semibold text-primary">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading inventory...</TableCell></TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No items found</TableCell></TableRow>
              ) : (
                filteredItems.map((item) => {
                  const currentValue = calculateCurrentValue(item.originalCost, item.depreciationRate, item.purchaseDate);
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.itemCode}</div>
                      </TableCell>
                      <TableCell>{item.labName}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(Number(item.originalCost))}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-primary">
                        {formatCurrency(currentValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={item.functionalStatus} />
                          {item.approvalStatus !== "Active" && (
                            <StatusBadge status={item.approvalStatus} />
                          )}
                        </div>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
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
