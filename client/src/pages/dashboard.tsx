import { useInventory } from "@/hooks/use-inventory";
import { useRequests } from "@/hooks/use-requests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertCircle, Wrench, CheckCircle2, Ban } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { formatCurrency, calculateCurrentValue } from "@/lib/depreciation";

export default function Dashboard() {
  const { data: inventory, isLoading: isLoadingInv } = useInventory();
  const { data: requests, isLoading: isLoadingReq } = useRequests();

  if (isLoadingInv || isLoadingReq) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-medium">Loading institutional data...</div>;
  }

  const items = inventory || [];
  const reqs = requests || [];

  const totalItems = items.length;
  const workingItems = items.filter(i => i.functionalStatus === "Working").length;
  const nonWorkingItems = items.filter(i => i.functionalStatus === "Non Working").length;
  const condemnedItems = items.filter(i => i.approvalStatus === "Condemned").length;
  const pendingRequests = reqs.filter(r => r.status === "Requested" || r.status === "Pending Approval").length;

  const totalOriginalValue = items.reduce((acc, curr) => acc + Number(curr.originalCost), 0);
  const totalCurrentValue = items.reduce((acc, curr) => 
    acc + calculateCurrentValue(curr.originalCost, curr.depreciationRate, curr.purchaseDate), 0);

  const pieData = [
    { name: 'Working', value: workingItems, color: 'hsl(142 76% 25%)' },
    { name: 'Non-Working', value: nonWorkingItems, color: 'hsl(45 93% 47%)' },
    { name: 'Condemned', value: condemnedItems, color: 'hsl(0 84% 45%)' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">High-level view of laboratory assets and their condemnation status.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Assets</CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Functional</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{workingItems}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Needs Repair</CardTitle>
            <Wrench className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{nonWorkingItems}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Reqs</CardTitle>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingRequests}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Condemned</CardTitle>
            <Ban className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{condemnedItems}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Summary */}
        <Card className="col-span-1 lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Institutional Value Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 bg-muted/30 p-6 rounded-xl border border-border/50">
                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-2">Total Original Cost</p>
                <p className="text-4xl font-bold text-foreground">{formatCurrency(totalOriginalValue)}</p>
              </div>
              <div className="flex-1 bg-primary/5 p-6 rounded-xl border border-primary/20">
                <p className="text-sm text-primary/80 font-semibold uppercase tracking-wider mb-2">Est. Depreciated Value</p>
                <p className="text-4xl font-bold text-primary">{formatCurrency(totalCurrentValue)}</p>
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase">Recent Additions</h4>
              <div className="divide-y border rounded-lg overflow-hidden">
                {items.slice(-3).reverse().map(item => (
                  <div key={item.id} className="p-3 bg-card hover:bg-muted/50 flex justify-between items-center transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.itemCode} • {item.labName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(Number(item.originalCost))}</p>
                      <p className="text-xs text-muted-foreground">{new Date(item.purchaseDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No recent items</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <Card className="col-span-1 shadow-md flex flex-col">
          <CardHeader>
            <CardTitle className="font-display">Equipment Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[300px]">
            {totalItems > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground">No data available to chart.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
