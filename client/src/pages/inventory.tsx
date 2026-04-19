/**
 * Project: Jamia Lab Inventory Management System
 * Developed by: JMI University Polytechnic Computer Engg 6th Sem Students
 * Team: Shafaat, Farman, Aqdas, Rihan, Farhan
 */

import { useState, useRef } from "react";
import { useInventory, useCreateInventory, useUpdateInventory, useDeleteInventory, useCondemnInventory } from "@/hooks/use-inventory";
import { useReports } from "@/hooks/use-reports";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, calculateCurrentValue } from "@/lib/depreciation";
import { downloadInventoryItemReport, downloadGFR17Report } from "@/lib/pdf-generator";
import { Plus, Edit, Trash2, Search, Package, Filter, FileOutput, Download, FileUp, Receipt, FileStack } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const BUDGET_OPTIONS = [
  { value: "A", label: "A — Non Recurring" },
  { value: "B", label: "B — Recurring" },
  { value: "C", label: "C — Self-Finance" },
  { value: "D", label: "D — Project Under DST" },
  { value: "E", label: "E — Plan" },
  { value: "F", label: "F — Special Grant" },
];

const formSchema = insertInventorySchema.extend({
  originalCost: z.coerce.string(),
  depreciationRate: z.coerce.string(),
  usefulLife: z.coerce.number().min(1),
  purchaseDate: z.coerce.date().transform(d => d.toISOString().split('T')[0]),
  quantity: z.coerce.number().min(1),
  location: z.string().optional(),
  budget: z.string().optional(),
  gemOrderId: z.string().optional().nullable(),
  gemOrderDate: z.string().optional().nullable().transform(v => v === "" ? null : v),
});

type FormValues = z.infer<typeof formSchema>;

export default function Inventory() {
  const { data: inventory, isLoading: inventoryLoading } = useInventory();
  const { data: reports, isLoading: reportsLoading } = useReports();
  const isLoading = inventoryLoading || reportsLoading;
  const { user } = useAuth();
  const totalItems = inventory?.length || 0;
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [labFilter, setLabFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");

  const [writeOffItem, setWriteOffItem] = useState<any>(null);
  const [isWritingOff, setIsWritingOff] = useState(false);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isUploadingBill, setIsUploadingBill] = useState(false);
  const billInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory();
  const deleteMutation = useDeleteInventory();
  const condemnMutation = useCondemnInventory();
  const { toast } = useToast();

  const canEdit = user?.role === "Store Keeper" || user?.role === "Admin";
  const isStoreKeeper = user?.role === "Store Keeper" || user?.role === "Admin";
  const canDownload = true; // Everyone can download individual reports

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemCode: "",
      name: "",
      category: "",
      labName: "",
      purchaseDate: new Date().toISOString().split('T')[0],
      originalCost: "0",
      depreciationRate: "10",
      usefulLife: 5,
      functionalStatus: "Working",
      approvalStatus: "Active",
      quantity: 1,
      location: "",
      budget: "",
      gemOrderId: "",
      gemOrderDate: "",
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      let billUrl: string | undefined = undefined;

      // Upload bill file if selected
      if (billFile) {
        setIsUploadingBill(true);
        const formData = new FormData();
        formData.append('bill', billFile);
        const uploadRes = await fetch('/api/inventory/upload-bill', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.message || 'Bill upload failed');
        }
        const { url } = await uploadRes.json();
        billUrl = url;
        setIsUploadingBill(false);
      }

      const payload = { ...data, ...(billUrl ? { billUrl } : {}) };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        toast({ title: "Asset updated", description: "Article record has been updated successfully." });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Asset registered", description: "New article has been added to inventory." });
      }
      setDialogOpen(false);
      form.reset();
      setEditingId(null);
      setBillFile(null);
      if (billInputRef.current) billInputRef.current.value = '';
    } catch (error: any) {
      setIsUploadingBill(false);
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    form.reset({ 
        ...item, 
        purchaseDate: new Date(item.purchaseDate).toISOString().split('T')[0],
        gemOrderDate: item.gemOrderDate ? new Date(item.gemOrderDate).toISOString().split('T')[0] : "",
        gemOrderId: item.gemOrderId || ""
    });
    setDialogOpen(true);
  };

  const handleArchive = (item: any) => {
    if (!isStoreKeeper) {
      toast({ variant: "destructive", title: "Denied", description: "Only Store Keeper can remove inventory items." });
      return;
    }
    // Set for archival (Correction mode)
    setWriteOffItem({ ...item, removalReason: "Correction" });
  };

  const handleCondemn = (item: any) => {
    const isApprovedByPrincipal = reports?.some(r => 
      r.articleId === item.id && 
      r.recommendation === "Condemn" && 
      r.status === "Approved"
    );

    if (!isApprovedByPrincipal) {
      toast({ 
        variant: "destructive", 
        title: "Condemnation Blocked", 
        description: "You cannot condemn this item because the request is not approved by the Principal." 
      });
      return;
    }

    setWriteOffItem({ ...item, removalReason: "Condemned" });
  };

  const handleWriteOffSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!writeOffItem) return;
    setIsWritingOff(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append('inventoryId', writeOffItem.id.toString());
    formData.append('unitPrice', writeOffItem.originalCost.toString());
    formData.append('removalReason', writeOffItem.removalReason || "Condemned");
    
    try {
      const res = await fetch('/api/write-off', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Something went wrong.");
      }
      toast({ title: "Write-Off Successful", description: "Item moved to dead inventory." });
      setWriteOffItem(null);
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsWritingOff(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const url = labFilter !== 'all' 
        ? `/api/inventory/report?lab=${encodeURIComponent(labFilter)}` 
        : `/api/inventory/report`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      
      const fileName = labFilter !== 'all' 
        ? `${labFilter.replace(/\s+/g, '_')}_Inventory_Report_${new Date().getTime()}.pdf` 
        : `Comprehensive_Inventory_Report_${new Date().getTime()}.pdf`;
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      toast({ variant: "destructive", title: "Download Failed", description: "Could not generate PDF report." });
    }
  };

  const filteredItems = (inventory || []).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.labName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.gemOrderId || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "working" && item.functionalStatus === "Working" && item.approvalStatus !== "Condemned") ||
      (statusFilter === "nonworking" && item.functionalStatus === "Non Working" && item.approvalStatus !== "Condemned") ||
      (statusFilter === "condemned" && item.approvalStatus === "Condemned");
    const matchesLab = labFilter === "all" || item.labName === labFilter;
    const matchesBudget = budgetFilter === "all" || item.budget === budgetFilter;
    return matchesSearch && matchesStatus && matchesLab && matchesBudget;
  });

  const labs = Array.from(new Set((inventory || []).map(item => item.labName)));

  const FormField = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );

  // Group items by name, lab, category, and cost to consolidate existing individual entries
  const groupedItems = filteredItems.reduce((acc: any[], item) => {
    // Generate a grouping key
    const key = `${item.name}-${item.labName}-${item.location}-${item.originalCost}-${item.purchaseDate}-${item.approvalStatus}-${item.functionalStatus}-${item.gemOrderId}`;
    const existing = acc.find(i => `${i.name}-${i.labName}-${i.location}-${i.originalCost}-${i.purchaseDate}-${i.approvalStatus}-${i.functionalStatus}-${i.gemOrderId}` === key);
    
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
      // Keep track of IDs for potential batch actions, though here we just use the group
      if (!existing.ids) existing.ids = [existing.id];
      existing.ids.push(item.id);
      
      // Update itemCode to show it's a batch if it's not already
      if (!existing.itemCode.includes('BATCH') && existing.itemCode !== item.itemCode) {
        if (!existing.itemCode.includes('...')) {
            existing.itemCode = `${existing.itemCode.split('-').slice(0,-1).join('-')}-BATCH`;
        }
      }
    } else {
      acc.push({ ...item, quantity: item.quantity || 1, ids: [item.id] });
    }
    return acc;
  }, []);

  // Compute some summary stats
  const totalAssets = (inventory || []).length;
  const workingCount = (inventory || []).filter(i => i.functionalStatus === 'Working' && i.approvalStatus !== 'Condemned').length;
  const nonWorkingCount = (inventory || []).filter(i => i.functionalStatus === 'Non Working' && i.approvalStatus !== 'Condemned').length;
  const condemnedCount = (inventory || []).filter(i => i.approvalStatus === 'Condemned').length;
  const totalValue = (inventory || []).reduce((sum, i) => sum + Number(i.originalCost) * (i.quantity || 1), 0);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 py-10">
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Asset Inventory</h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm ml-14">
            {isLoading ? "Loading assets..." : `${groupedItems.length} groups · ${totalAssets} total assets registered`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleDownloadPDF} 
            variant="outline"
            className="gap-2 rounded-xl h-11 font-bold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
          >
            <FileOutput className="w-4 h-4" />
            {labFilter !== 'all' ? `Lab Report` : `Full Report`}
          </Button>

          <Button 
            onClick={() => {
              const items = labFilter === 'all' ? (inventory || []) : (inventory || []).filter(i => i.labName === labFilter);
              downloadGFR17Report(items, labFilter === 'all' ? undefined : labFilter);
            }} 
            variant="outline"
            className="gap-2 rounded-xl h-11 font-bold border-amber-500/30 text-amber-600 hover:bg-amber-50 hover:border-amber-500/50 transition-all"
          >
            <FileStack className="w-4 h-4" />
            {labFilter !== 'all' ? `GFR-17 (Lab)` : `GFR-17 (Full)`}
          </Button>

          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { form.reset(); setEditingId(null); setBillFile(null); if (billInputRef.current) billInputRef.current.value = ''; } }}>
              <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-5 h-11 font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Register Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {editingId ? "Edit Article Record" : "Register New Article"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Item / Asset Code">
                    <Input {...form.register("itemCode")} placeholder="e.g. CE-LAB1-001" className="h-10 rounded-lg" />
                  </FormField>
                  <FormField label="Article Name">
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
                  <FormField label="Quantity (Qty)">
                    <Input type="number" {...form.register("quantity")} className="h-10 rounded-lg" />
                  </FormField>
                  <FormField label="Location / Room Number">
                    <Input {...form.register("location")} placeholder="e.g. Room 302 or G-15" className="h-10 rounded-lg" />
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
                    <FormField label="Budget Category">
                      <Select 
                        onValueChange={(v) => form.setValue("budget", v)} 
                        defaultValue={form.getValues("budget") || undefined}
                      >
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue placeholder="Select budget..." />
                        </SelectTrigger>
                        <SelectContent>
                          {BUDGET_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="GeM Order ID (Optional)">
                      <Input {...form.register("gemOrderId")} placeholder="e.g. GEMC-5116..." className="h-10 rounded-lg" />
                    </FormField>
                    <FormField label="GeM Order Date (Optional)">
                      <Input type="date" {...form.register("gemOrderDate")} className="h-10 rounded-lg" />
                    </FormField>
                  </div>
                  <div className="space-y-2 mt-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <FileUp className="w-4 h-4" />
                      Upload Original Bill (Optional)
                    </Label>
                    <p className="text-xs text-muted-foreground">Supported formats: PDF, JPG, PNG (max 10MB)</p>
                    <Input
                      ref={billInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                      className="h-10 rounded-lg file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    {billFile && (
                      <p className="text-xs text-green-600 font-medium">✓ Selected: {billFile.name}</p>
                    )}
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
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Assets</span>
          <span className="text-2xl font-black text-foreground mt-1">{isLoading ? "—" : totalAssets}</span>
        </div>
        <div className="bg-white border rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Working</span>
          <span className="text-2xl font-black text-green-700 mt-1">{isLoading ? "—" : workingCount}</span>
        </div>
        <div className="bg-white border rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Non Working</span>
          <span className="text-2xl font-black text-red-600 mt-1">{isLoading ? "—" : nonWorkingCount}</span>
        </div>
        <div className="bg-white border rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Condemned</span>
          <span className="text-2xl font-black text-orange-600 mt-1">{isLoading ? "—" : condemnedCount}</span>
        </div>
        <div className="bg-white border rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Value</span>
          <span className="text-lg font-black text-[#0d3318] mt-1">{isLoading ? "—" : formatCurrency(totalValue)}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b bg-gradient-to-r from-muted/30 to-muted/10">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or lab..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-white border-muted-foreground/15 focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`h-9 w-36 rounded-full text-xs font-semibold transition-all ${statusFilter !== 'all' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white'}`}>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="working">✅ Working</SelectItem>
                <SelectItem value="nonworking">❌ Non Working</SelectItem>
                <SelectItem value="condemned">⛔ Condemned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={labFilter} onValueChange={setLabFilter}>
              <SelectTrigger className={`h-9 w-40 rounded-full text-xs font-semibold transition-all ${labFilter !== 'all' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white'}`}>
                <SelectValue placeholder="All Laboratories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Laboratories</SelectItem>
                {labs.map(lab => (
                  <SelectItem key={lab} value={lab}>{lab}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
              <SelectTrigger className={`h-9 w-36 rounded-full text-xs font-semibold transition-all ${budgetFilter !== 'all' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white'}`}>
                <SelectValue placeholder="All Budgets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Budgets</SelectItem>
                {BUDGET_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(statusFilter !== 'all' || labFilter !== 'all' || budgetFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatusFilter('all'); setLabFilter('all'); setBudgetFilter('all'); }}
                className="h-9 rounded-full text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#0d3318]/[0.03] hover:bg-[#0d3318]/[0.03]">
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider pl-5">Article Name</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Code</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Category</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Laboratory</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Location</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Budget</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">GeM Info</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider text-center">Qty</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Purchased</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider text-center">Life</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider text-right">Cost</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right font-bold text-foreground/70 text-[11px] uppercase tracking-wider pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 13 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted/60 rounded-full animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-24">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="font-bold text-muted-foreground text-lg">No articles found</p>
                      <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm">
                        {searchTerm ? "Try a different search term or clear filters." : "Register your first asset to get started."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                groupedItems.map((item, index) => {
                  return (
                    <TableRow key={item.id} className={`hover:bg-primary/[0.02] transition-colors border-b last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/[0.04]'}`}>
                      <TableCell className="py-4 pl-5">
                        <div className="flex flex-col">
                          <p className="font-bold text-foreground text-sm leading-tight">{item.name}</p>
                          {item.billUrl && (
                            <span className="text-[9px] font-semibold text-amber-600 mt-0.5 flex items-center gap-0.5">
                              <Receipt className="w-2.5 h-2.5" /> Bill attached
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-mono font-bold bg-muted/50 px-2 py-1 rounded w-fit">{item.itemCode}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-semibold text-foreground/70">{item.labName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-bold text-foreground/60">{item.location || <span className="italic font-normal text-muted-foreground/50 text-center">—</span>}</p>
                      </TableCell>
                      <TableCell>
                        {item.budget ? (
                          <span className="text-[10px] font-black px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-100 uppercase tracking-tighter">
                            {BUDGET_OPTIONS.find(o => o.value === item.budget)?.label.split('—')[0] || item.budget}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.gemOrderId ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono font-semibold text-foreground/60 truncate max-w-[120px]" title={item.gemOrderId}>
                              {item.gemOrderId.length > 16 ? `${item.gemOrderId.slice(0, 8)}...${item.gemOrderId.slice(-5)}` : item.gemOrderId}
                            </span>
                            {item.gemOrderDate && <span className="text-[9px] text-muted-foreground/60">{new Date(item.gemOrderDate).toLocaleDateString('en-IN')}</span>}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">{item.quantity || 1}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground/80">
                        {new Date(item.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                          {item.usefulLife}Y
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-sm text-[#0d3318]">
                        <div className="flex flex-col items-end">
                            <p>{formatCurrency(Number(item.originalCost) * item.quantity)}</p>
                            {item.quantity > 1 && <p className="text-[10px] text-muted-foreground font-normal">unit: {formatCurrency(Number(item.originalCost))}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {item.approvalStatus === "Condemned" ? (
                            <StatusBadge status="Condemned" />
                          ) : (
                            <>
                              <StatusBadge status={item.functionalStatus} />
                              {item.approvalStatus !== "Active" && <StatusBadge status={item.approvalStatus} />}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <div className="flex justify-end gap-0.5">
                          {canEdit && (
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => handleEdit(item)}
                              className="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => downloadInventoryItemReport(item, user)}
                            className="w-8 h-8 rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors"
                            title="Download PDF Record"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => downloadGFR17Report([item])}
                            className="w-8 h-8 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"
                            title="Download GFR-17 Form"
                          >
                            <FileStack className="w-3.5 h-3.5" />
                          </Button>
                          {item.billUrl && (
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => {
                                window.open(`/api/inventory/${item.id}/bill`, '_blank');
                              }}
                              className="w-8 h-8 rounded-lg hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              title="Download Original Bill"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {isStoreKeeper && item.approvalStatus !== "Condemned" && (
                            <Button
                              variant="outline" size="sm"
                              onClick={() => handleCondemn(item)}
                              className="h-8 text-[10px] font-bold uppercase tracking-tighter bg-orange-50/50 hover:bg-orange-100 hover:text-orange-700 border-orange-200/50 text-orange-600 transition-all rounded-lg"
                              title="Condemn Batch"
                            >
                              Condemn
                            </Button>
                          )}
                          {(user?.role === "Store Keeper" || user?.role === "Admin") && (
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => handleArchive(item)}
                              className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Table Footer */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="px-5 py-3 border-t bg-muted/10 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{groupedItems.length}</span> groups from <span className="font-bold text-foreground">{filteredItems.length}</span> filtered assets
            </p>
            <p className="text-xs text-muted-foreground">
              Filtered value: <span className="font-bold text-[#0d3318]">{formatCurrency(filteredItems.reduce((s, i) => s + Number(i.originalCost) * (i.quantity || 1), 0))}</span>
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!writeOffItem} onOpenChange={(open) => { if (!open) setWriteOffItem(null) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Write-Off Asset (Dead Inventory)</DialogTitle>
          </DialogHeader>
          {writeOffItem && (
            <form onSubmit={handleWriteOffSubmit} className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-xl border border-muted-foreground/10 mb-4">
                <p className="text-sm font-semibold text-foreground">
                  Action: {writeOffItem.removalReason === "Correction" ? "Archive for Correction" : "Move to Dead Inventory"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {writeOffItem.removalReason === "Correction" 
                    ? "This item will be archived in the Dead Inventory section for 90 days before permanent deletion."
                    : "This item will be condemned and moved to Dead Inventory for final disposal tracking."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <FormField label="Article Name">
                  <Input disabled value={writeOffItem.name} className="bg-muted/50" />
                </FormField>
                <FormField label="Date of Move">
                  <Input name="dateOfWriteOff" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </FormField>
                <FormField label="Price at time of Removal (₹)">
                  <Input name="priceAtWriteOff" type="number" step="0.01" required defaultValue={writeOffItem.originalCost} />
                </FormField>
                <FormField label="Department Handed Over By">
                  <Input name="handedOverBy" required placeholder="Name/Dept" />
                </FormField>
                <FormField label="Department Taken Over By">
                  <Input name="takenOverBy" required placeholder="Store/Disposal" />
                </FormField>
              </div>
              
              {writeOffItem.removalReason !== "Correction" && (
                <div className="space-y-4 mt-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-primary">Required Audit Uploads (PDF Only)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="GFR-17 Form">
                      <Input name="gfr17" type="file" accept=".pdf" required className="text-xs" />
                    </FormField>
                    <FormField label="Condemnation Report">
                      <Input name="condemnation" type="file" accept=".pdf" required className="text-xs" />
                    </FormField>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setWriteOffItem(null)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isWritingOff} className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-6">
                  {isWritingOff ? 'Processing...' : (writeOffItem.removalReason === "Correction" ? 'Confirm & Archive' : 'Submit Write-Off')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
