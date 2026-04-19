import { useState } from "react";
import { useInventory } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, TrendingDown, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadDepreciationReport } from "@/lib/pdf-generator";

import { useToast } from "@/hooks/use-toast";
import { calculateCurrentValue, formatCurrency } from "@/lib/depreciation";

// Helper for total depreciation and percent
const getDepreciationInfo = (item: any) => {
  const qty = item.quantity || 1;
  const unitCost = Number(item.originalCost);
  const totalCost = unitCost * qty;
  
  const unitCurrentValue = calculateCurrentValue(unitCost, item.depreciationRate, item.purchaseDate);
  const currentValue = unitCurrentValue * qty;
  
  const totalDepreciation = totalCost - currentValue;
  const purchaseYear = new Date(item.purchaseDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const years = Math.max(0, currentYear - purchaseYear);
  
  const deprPercent = totalCost > 0 ? (totalDepreciation / totalCost) * 100 : 0;
  const valueRatio = totalCost > 0 ? (currentValue / totalCost) : 1;

  let calculatedStatus = "Active";
  let statusColor = "text-green-600 bg-green-50 border-green-100";
  
  if (valueRatio < 0.1) {
    calculatedStatus = "Recommend Condemnation";
    statusColor = "text-red-600 bg-red-50 border-red-100";
  } else if (valueRatio < 0.3) {
    calculatedStatus = "Old";
    statusColor = "text-amber-600 bg-amber-50 border-amber-100";
  }

  return {
    years,
    totalCost,
    currentValue,
    totalDepreciation,
    deprPercent,
    calculatedStatus,
    statusColor
  };
};

export default function Depreciation() {
  const { toast } = useToast();
  const { data: inventory, isLoading } = useInventory();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [labFilter, setLabFilter] = useState("all");

  const handleDownloadFullReport = async () => {
    try {
      const urlWithFilter = labFilter !== "all" 
        ? `/api/depreciation/report?labName=${encodeURIComponent(labFilter)}` 
        : "/api/depreciation/report";
        
      const res = await fetch(urlWithFilter);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Comprehensive_Depreciation_Report_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      toast({ variant: "destructive", title: "Download Failed", description: "Could not generate PDF report." });
    }
  };

  const labs = Array.from(new Set((inventory || []).map(item => item.labName)));

  const filteredItems = (inventory || []).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLab = labFilter === "all" || item.labName === labFilter;
    return matchesSearch && matchesLab;
  });

  const groupedItems = filteredItems.reduce((acc: any[], item) => {
    const key = `${item.name}-${item.labName}-${item.originalCost}-${item.purchaseDate}-${item.depreciationRate}`;
    const existing = acc.find(i => `${i.name}-${i.labName}-${i.originalCost}-${i.purchaseDate}-${i.depreciationRate}` === key);
    
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
      if (!existing.itemCode.includes('BATCH') && existing.itemCode !== item.itemCode) {
        existing.itemCode = `${existing.itemCode.split('-').slice(0,-1).join('-')}-BATCH`;
      }
    } else {
      acc.push({ ...item, quantity: item.quantity || 1 });
    }
    return acc;
  }, []);

  // Summary stats
  const totalCostAll = groupedItems.reduce((s, i) => s + getDepreciationInfo(i).totalCost, 0);
  const currentValueAll = groupedItems.reduce((s, i) => s + getDepreciationInfo(i).currentValue, 0);
  const totalDepreciationAll = totalCostAll - currentValueAll;
  const condemnCount = groupedItems.filter(i => getDepreciationInfo(i).calculatedStatus === 'Recommend Condemnation').length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 py-10">
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10">
              <TrendingDown className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Asset Depreciation</h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm ml-14">
            {isLoading ? "Loading..." : `Tracking depreciation for ${groupedItems.length} groups · ${filteredItems.length} assets`}
          </p>
        </div>
        <Button 
          onClick={handleDownloadFullReport} 
          variant="outline" 
          className="gap-2 rounded-xl h-11 font-bold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          {labFilter !== 'all' ? `Lab Report` : `Full Report`}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original Value</span>
          <span className="text-lg font-black text-foreground mt-1">{isLoading ? "—" : formatCurrency(totalCostAll)}</span>
        </div>
        <div className="bg-white border rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Current WDV</span>
          <span className="text-lg font-black text-green-700 mt-1">{isLoading ? "—" : formatCurrency(currentValueAll)}</span>
        </div>
        <div className="bg-white border rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Total Depreciation</span>
          <span className="text-lg font-black text-red-600 mt-1">{isLoading ? "—" : formatCurrency(totalDepreciationAll)}</span>
        </div>
        <div className="bg-white border rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Condemn Recommended</span>
          <span className="text-2xl font-black text-orange-600 mt-1">{isLoading ? "—" : condemnCount}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b bg-gradient-to-r from-muted/30 to-muted/10">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search article or asset code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-white border-muted-foreground/15 focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={labFilter} onValueChange={setLabFilter}>
              <SelectTrigger className={`h-9 w-44 rounded-full text-xs font-semibold transition-all ${labFilter !== 'all' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white'}`}>
                <SelectValue placeholder="All Laboratories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Laboratories</SelectItem>
                {labs.map(lab => (
                  <SelectItem key={lab} value={lab}>{lab}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {labFilter !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setLabFilter('all')} className="h-9 rounded-full text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50">Clear</Button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#0d3318]/[0.03] hover:bg-[#0d3318]/[0.03]">
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider pl-5">Article Details</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider">Purchase</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider text-center">Qty</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider text-right">Total Cost</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider text-center">Depr. Rate</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider text-right">Current Value</TableHead>
                <TableHead className="font-bold text-foreground/70 text-[11px] uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="text-right font-bold text-foreground/70 text-[11px] uppercase tracking-wider pr-5">Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted/60 rounded-full animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : groupedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-muted/30 rounded-2xl">
                        <TrendingDown className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                      <div>
                        <p className="font-bold text-muted-foreground">No assets matching your criteria</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filter.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                groupedItems.map((item, index) => {
                  const depr = getDepreciationInfo(item);
                  return (
                    <TableRow key={item.id} className={`hover:bg-primary/[0.02] transition-colors border-b last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/[0.04]'}`}>
                      <TableCell className="py-4 pl-5">
                        <div>
                          <p className="font-bold text-foreground text-sm">{item.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground/70 mt-0.5">
                            {item.itemCode} · {item.labName} {item.location && <span className="bg-muted px-1 rounded font-bold">Loc: {item.location}</span>}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-bold text-foreground/80">{new Date(item.purchaseDate).getFullYear()}</p>
                          <p className="text-muted-foreground/60 mt-0.5">{depr.years} years ago</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">{item.quantity || 1}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="flex flex-col items-end">
                          <p className="font-bold text-sm text-foreground">{formatCurrency(depr.totalCost)}</p>
                          <p className="text-[10px] text-muted-foreground">unit: {formatCurrency(Number(item.originalCost))}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold border border-blue-100">
                          {item.depreciationRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <p className="tabular-nums font-black text-sm text-primary">{formatCurrency(depr.currentValue)}</p>
                          <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter mt-0.5">-{Math.round(depr.deprPercent)}% Depreciated</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${depr.statusColor}`}>
                          {depr.calculatedStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => downloadDepreciationReport(item, user)}
                          className="h-8 rounded-lg hover:bg-green-50 hover:text-green-700 font-bold text-xs gap-1.5 px-3"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {/* Table Footer */}
        {!isLoading && groupedItems.length > 0 && (
          <div className="px-5 py-3 border-t bg-muted/10 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{groupedItems.length}</span> asset groups
            </p>
            <p className="text-xs text-muted-foreground">
              Net depreciation: <span className="font-bold text-red-600">{formatCurrency(totalDepreciationAll)}</span>
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
