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
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse font-medium">
        Loading institutional data...
      </div>
    );
  }

  const items = inventory || [];
  const reqs = requests || [];

  const totalItems = items.length;
  const workingItems = items.filter(i => i.functionalStatus === "Working").length;
  const nonWorkingItems = items.filter(i => i.functionalStatus === "Non Working").length;
  const condemnedItems = items.filter(i => i.approvalStatus === "Condemned").length;
  const pendingRequests = reqs.filter(
    r => r.status === "Requested" || r.status === "Pending Approval"
  ).length;

  const totalOriginalValue = items.reduce(
    (acc, curr) => acc + Number(curr.originalCost),
    0
  );

  const totalCurrentValue = items.reduce(
    (acc, curr) =>
      acc +
      calculateCurrentValue(
        curr.originalCost,
        curr.depreciationRate,
        curr.purchaseDate
      ),
    0
  );

  const pieData = [
    { name: "Working", value: workingItems, color: "hsl(142 76% 25%)" },
    { name: "Non-Working", value: nonWorkingItems, color: "hsl(45 93% 47%)" },
    { name: "Condemned", value: condemnedItems, color: "hsl(0 84% 45%)" }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">

      {/* JAMIA BUILDING BANNER */}
      <div className="w-full h-[260px] rounded-xl overflow-hidden shadow-lg relative">
        <img
          src="/jamia.png"
          alt="Jamia Millia Islamia"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold tracking-wide">
              Jamia Millia Islamia
            </h1>

            <p className="text-sm mt-2">
              Lab Inventory & Condemnation Management System
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Title */}
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground mt-1">
          High-level view of laboratory assets and their condemnation status.
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Total Assets
            </CardTitle>
            <Package className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Functional
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{workingItems}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Needs Repair
            </CardTitle>
            <Wrench className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{nonWorkingItems}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Pending Reqs
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingRequests}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Condemned
            </CardTitle>
            <Ban className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{condemnedItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* SUMMARY + CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="col-span-1 lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Institutional Value Summary</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col md:flex-row gap-8">

              <div className="flex-1 bg-muted/30 p-6 rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">
                  Total Original Cost
                </p>
                <p className="text-4xl font-bold">
                  {formatCurrency(totalOriginalValue)}
                </p>
              </div>

              <div className="flex-1 bg-primary/5 p-6 rounded-xl">
                <p className="text-sm text-primary/80 mb-2">
                  Est. Depreciated Value
                </p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(totalCurrentValue)}
                </p>
              </div>

            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-md flex flex-col">
          <CardHeader>
            <CardTitle>Equipment Status</CardTitle>
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
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>

                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground">
                No data available to chart.
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}