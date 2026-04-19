import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";
import { Download, RefreshCw, FileText, Clock, Trash2, AlertTriangle, Receipt } from "lucide-react";

export default function DeadInventory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const canRecover = user?.role === "Store Keeper";

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/dead-inventory"],
    queryFn: async () => {
      const res = await fetch("/api/dead-inventory");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    }
  });

  const recoverMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/dead-inventory/${id}/recover`, { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to recover item");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dead-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Item Recovered", description: "The item has been moved back to the main inventory." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch("/api/dead-inventory/report");
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dead-inventory-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      toast({ variant: "destructive", title: "Download Failed", description: "Could not generate PDF report." });
    }
  };

  const getExpiryInfo = (expiryDate: string) => {
    const daysLeft = differenceInDays(new Date(expiryDate), new Date());
    if (daysLeft < 0) return { label: "Expired", color: "text-red-600 bg-red-50 border-red-200", progress: 0, urgent: true };
    if (daysLeft === 0) return { label: "Deletes Today", color: "text-orange-600 bg-orange-50 border-orange-200", progress: 0, urgent: true };
    if (daysLeft <= 14) return { label: `${daysLeft}d left`, color: "text-orange-600 bg-orange-50 border-orange-200", progress: (daysLeft / 90) * 100, urgent: true };
    return { label: `${daysLeft}d left`, color: "text-emerald-600 bg-emerald-50 border-emerald-200", progress: (daysLeft / 90) * 100, urgent: false };
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 py-10">
      <div className="space-y-6 animate-fade-up">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-red-500/15 to-red-500/5 rounded-xl border border-red-200">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Dead Inventory
            </h2>
            <p className="text-muted-foreground font-medium text-sm">
              Written-off assets pending final disposal. Auto-deleted after 90 days.
            </p>
          </div>
        </div>
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          className="gap-2 rounded-xl h-11 font-bold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          PDF Report
        </Button>
      </div>

      {/* ── Warning Banner ── */}
      {items.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-medium">
            Assets in this list will be <strong>permanently deleted</strong> after their expiry date. Store Keepers can recover items before this deadline.
          </p>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="table-wrapper">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#0d3318]/[0.03] hover:bg-[#0d3318]/[0.03]">
                {["Article", "Date Removed", "Reason", "Expiry / Time Left", "Handed/Taken", "Documents", "Actions"].map(h => (
                  <TableHead key={h} className={`font-bold text-foreground/70 text-[11px] uppercase tracking-wider whitespace-nowrap ${h === 'Article' ? 'pl-5' : ''} ${h === 'Actions' ? 'pr-5 text-right' : ''}`}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 skeleton rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !Array.isArray(items) || items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-muted/30 rounded-2xl">
                        <Trash2 className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                      <div>
                        <p className="font-bold text-muted-foreground">No dead inventory items</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">Written-off assets will appear here.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: any, index: number) => {
                  const expiry = getExpiryInfo(item.expiryDate);
                  return (
                    <TableRow key={item.id} className={`hover:bg-primary/[0.02] transition-colors border-b last:border-0 ${expiry.urgent ? 'bg-red-50/30' : index % 2 === 0 ? 'bg-white' : 'bg-muted/[0.04]'}`}>
                      <TableCell className="py-4 pl-5">
                        <p className="font-bold text-foreground text-sm">{item.articleName}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.writeOffDate || new Date()), 'PP')}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${item.removalReason === 'Correction' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {item.removalReason || 'Condemned'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5 min-w-[120px]">
                          <p className="text-sm font-semibold text-foreground">{format(new Date(item.expiryDate), 'PP')}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${expiry.color}`}>
                            <Clock className="w-2.5 h-2.5" />
                            {expiry.label}
                          </span>
                          {expiry.progress > 0 && (
                            <div className="h-1 bg-muted rounded-full overflow-hidden w-24">
                              <div
                                className={`h-full rounded-full ${expiry.urgent ? "bg-orange-400" : "bg-emerald-400"}`}
                                style={{ width: `${Math.min(100, expiry.progress)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground/70">By: {item.handedOverBy}</span>
                          <span className="opacity-70">To: {item.takenOverBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {item.billUrl && (
                            <a href={`/api/inventory/${item.id}/bill`} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 hover:underline font-bold">
                              <Receipt className="w-3 h-3" /> Purchase Bill
                            </a>
                          )}
                          {item.gfr17Url && (
                            <a href={item.gfr17Url} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium">
                              <FileText className="w-3 h-3" /> GFR 17
                            </a>
                          )}
                          {item.condemnationUrl && (
                            <a href={item.condemnationUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium">
                              <FileText className="w-3 h-3" /> Condemnation
                            </a>
                          )}
                          {item.depreciationUrl && (
                            <a href={item.depreciationUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium">
                              <FileText className="w-3 h-3" /> Depreciation
                            </a>
                          )}
                          {!item.gfr17Url && !item.condemnationUrl && !item.depreciationUrl && (
                            <span className="text-xs text-muted-foreground/40 italic">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        {canRecover && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-primary border-primary/20 hover:bg-primary/5 font-bold rounded-xl h-8 text-xs"
                            onClick={() => recoverMutation.mutate(item.id)}
                            disabled={recoverMutation.isPending}
                          >
                            <RefreshCw className={`w-3 h-3 ${recoverMutation.isPending ? "animate-spin" : ""}`} />
                            Recover
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      </div>
    </div>
  );
}
