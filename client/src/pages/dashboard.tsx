import { useInventory } from "@/hooks/use-inventory";
import { useRequests } from "@/hooks/use-requests";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertCircle, Wrench, CheckCircle2, Ban, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency, calculateCurrentValue } from "@/lib/depreciation";

export default function Dashboard() {
  const { data: inventory, isLoading: isLoadingInv } = useInventory();
  const { data: requests, isLoading: isLoadingReq } = useRequests();
  const { user } = useAuth();

  if (isLoadingInv || isLoadingReq) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-semibold text-sm tracking-wide animate-pulse">Loading institutional data...</p>
        </div>
      </div>
    );
  }

  const items = inventory || [];
  const reqs = requests || [];

  const totalItems = items.length;
  const workingItems = items.filter(i => i.functionalStatus === "Working").length;
  const nonWorkingItems = items.filter(i => i.functionalStatus === "Non Working").length;
  const condemnedItems = items.filter(i => i.approvalStatus === "Condemned").length;
  const pendingRequests = reqs.filter(r => r.status === "Requested" || r.status === "Pending Approval").length;

  const totalOriginalValue = items.reduce((acc, curr) => acc + Number(curr.originalCost), 0);
  const totalCurrentValue = items.reduce(
    (acc, curr) => acc + calculateCurrentValue(curr.originalCost, curr.depreciationRate, curr.purchaseDate),
    0
  );
  const depreciationLoss = totalOriginalValue - totalCurrentValue;

  const pieData = [
    { name: "Working", value: workingItems, color: "#16a34a" },
    { name: "Non-Working", value: nonWorkingItems, color: "#d97706" },
    { name: "Condemned", value: condemnedItems, color: "#dc2626" },
  ].filter(d => d.value > 0);

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  items.forEach(item => {
    const cat = item.category || "Uncategorized";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const stats = [
    {
      label: "Total Assets",
      value: totalItems,
      icon: Package,
      color: "from-[#0d3318] to-[#1a5a28]",
      textColor: "text-white",
      sub: "Registered equipment",
    },
    {
      label: "Functional",
      value: workingItems,
      icon: CheckCircle2,
      color: "from-emerald-500 to-green-600",
      textColor: "text-white",
      sub: `${totalItems ? Math.round((workingItems / totalItems) * 100) : 0}% operational`,
    },
    {
      label: "Needs Repair",
      value: nonWorkingItems,
      icon: Wrench,
      color: "from-amber-500 to-orange-500",
      textColor: "text-white",
      sub: "Require maintenance",
    },
    {
      label: "Pending Requests",
      value: pendingRequests,
      icon: AlertCircle,
      color: "from-blue-500 to-indigo-600",
      textColor: "text-white",
      sub: "Awaiting approval",
    },
    {
      label: "Condemned",
      value: condemnedItems,
      icon: Ban,
      color: "from-red-500 to-rose-600",
      textColor: "text-white",
      sub: "Decommissioned",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative w-full h-64 md:h-72 rounded-2xl overflow-hidden shadow-2xl">
        <img
          src="/jamia.png"
          alt="Jamia Millia Islamia"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d2e14]/95 via-[#0d2e14]/70 to-transparent" />
        <div className="absolute inset-0 flex items-center px-10">
          <div>
            <p className="text-yellow-400 text-xs font-black uppercase tracking-[0.3em] mb-3">Lab Management System</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Dashboard<br />
              <span className="text-yellow-400">Overview</span>
            </h1>
            <p className="text-white/60 mt-3 font-medium text-sm max-w-sm">
              Welcome back, {user?.name || "Administrator"}. Here's your lab asset summary.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
              <div className="p-2 bg-white/15 rounded-lg">
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-4xl font-black text-white">{stat.value}</p>
            <p className="text-white/50 text-xs font-medium mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Financial + Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Value Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-7 space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Institutional Asset Valuation</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#0d3318]/5 to-[#1a5a28]/10 border border-primary/10 p-5 rounded-xl">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Original Cost</p>
              <p className="text-3xl font-black text-foreground">{formatCurrency(totalOriginalValue)}</p>
              <p className="text-xs text-muted-foreground/60 mt-1 font-medium">At time of purchase</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/5 to-green-600/10 border border-emerald-200 p-5 rounded-xl">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Current Value</p>
              <p className="text-3xl font-black text-emerald-700">{formatCurrency(totalCurrentValue)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3 text-emerald-600" />
                <p className="text-xs text-emerald-600/70 font-medium">After depreciation</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500/5 to-rose-600/10 border border-red-200 p-5 rounded-xl">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Depreciation Loss</p>
              <p className="text-3xl font-black text-red-600">{formatCurrency(depreciationLoss)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                <p className="text-xs text-red-500/70 font-medium">Total loss in value</p>
              </div>
            </div>
          </div>

          {/* Category Bar Chart */}
          {categoryData.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Equipment by Category</p>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Bar dataKey="count" fill="#1a5a28" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border shadow-sm p-7 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Equipment Status</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center min-h-[260px]">
            {totalItems > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="white"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">No inventory data yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Add equipment to see stats.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}