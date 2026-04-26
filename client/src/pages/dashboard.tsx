import { useState, useCallback, useEffect } from "react";
import { useInventory } from "@/hooks/use-inventory";
import { useRequests } from "@/hooks/use-requests";
import { useReports } from "@/hooks/use-reports";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Package, AlertCircle, Wrench, CheckCircle2, Ban, TrendingDown, Activity, ArrowRight, FileText, ClipboardList, Search, X, IndianRupee, Calendar, Tag, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency, calculateCurrentValue } from "@/lib/depreciation";

export default function Dashboard() {
  const { data: inventory, isLoading: isLoadingInv } = useInventory();
  const { data: requests, isLoading: isLoadingReq } = useRequests();
  const { data: reports, isLoading: isLoadingRep } = useReports();
  const { user } = useAuth();
  const [priceSearch, setPriceSearch] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  
  // ── Carousel Setup ──
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const slides = [
    "/jamia.png",
    "/lab1.png",
    "/lab2.png",
    "/lab3.png",
    "/lab4.png",
    "/lab5.png",
    "/lab6.png",
    "/lab7.png",
    "/lab8.png",
    "/lab9.png",
  ];

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || isPaused) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi, onSelect, isPaused]);

  const isLoading = isLoadingInv || isLoadingReq;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Skeleton Hero */}
        <div className="h-56 sm:h-64 rounded-2xl skeleton" />
        {/* Skeleton KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-32 rounded-2xl skeleton stagger-${i + 1}`} />
          ))}
        </div>
        {/* Skeleton charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-2xl skeleton" />
          <div className="h-72 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  const items = inventory || [];
  const reqs = requests || [];
  const reps = reports || [];

  const totalItems = items.length;
  const workingItems = items.filter(i => i.functionalStatus === "Working").length;
  const nonWorkingItems = items.filter(i => i.functionalStatus === "Non Working").length;
  const condemnedItems = items.filter(i => i.approvalStatus === "Condemned").length;
  const pendingRequests = reqs.filter(r => r.status === "Requested" || r.status === "Pending Approval").length;
  const pendingReports = reps.filter(r => r.status === "Pending").length;

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
    { label: "Total Assets", value: totalItems, icon: Package, color: "jmi-card-gradient", sub: "Registered articles" },
    { label: "Functional", value: workingItems, icon: CheckCircle2, color: "bg-gradient-to-br from-emerald-500 to-green-600", sub: `${totalItems ? Math.round((workingItems / totalItems) * 100) : 0}% operational` },
    { label: "Needs Repair", value: nonWorkingItems, icon: Wrench, color: "bg-gradient-to-br from-amber-500 to-orange-500", sub: "Require maintenance" },
    { label: "Pending", value: pendingRequests + pendingReports, icon: AlertCircle, color: "bg-gradient-to-br from-blue-500 to-indigo-600", sub: "Awaiting approval" },
    { label: "Condemned", value: condemnedItems, icon: Ban, color: "bg-gradient-to-br from-red-500 to-rose-600", sub: "Decommissioned" },
  ];

  return (
    <div className="flex flex-col">

      {/* ── Stylish Welcome Card (Contained) ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 mt-8 animate-fade-up stagger-1 z-20">
        <div className="w-full glass-card rounded-[2.5rem] py-12 px-8 sm:px-16 lg:px-24 shadow-2xl relative overflow-hidden group border border-white/20">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/10 transition-all duration-1000" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-0.5 bg-yellow-500 rounded-full" />
                <p className="text-primary font-black text-[10px] sm:text-xs uppercase tracking-[0.5em]">
                  Jamia Millia Islamia • Laboratory
                </p>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground leading-[1.05] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Welcome to the <br />
                <span className="text-primary">Inventory Dashboard</span>
              </h1>
              
              <p className="text-muted-foreground/80 font-semibold text-base sm:text-lg lg:text-xl max-w-4xl leading-relaxed">
                Managing assets for the <span className="text-foreground font-black">Institutional Digital Records</span>. 
                Organized, digital, and efficient lab management system designed for University Polytechnic, Jamia Millia Islamia.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-8 shrink-0">
              <Link href="/inventory">
                <button className="flex items-center gap-4 px-12 py-5 bg-[#0d3318] hover:bg-[#1a5a28] text-white rounded-2xl font-black text-base shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1.5 hover:shadow-primary/30 group">
                  View Inventory
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                </button>
              </Link>
              
              <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 rounded-full border border-emerald-100/50 shadow-sm">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700">Live Assets System</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ── Hero Carousel Section (Contained Card) ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 mt-8 mb-4">
        <div 
          className="relative group overflow-hidden rounded-[2.5rem] border border-border/50 shadow-2xl animate-fade-up bg-muted"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {slides.map((src, index) => (
                <div className="flex-[0_0_100%] min-w-0 relative" key={index}>
                  <img 
                    src={src} 
                    alt={`Lab Slide ${index + 1}`} 
                    className="w-full h-auto object-contain transition-transform duration-1000 shadow-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Global Banner Overlay */}
          <div className="absolute inset-0 bg-black/5 pointer-events-none" />

          {/* Manual Controls - Hidden by default, reveal on hover */}
          <button 
            onClick={scrollPrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110 z-30"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={scrollNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 hover:scale-110 z-30"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-30">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  selectedIndex === i ? "w-8 bg-yellow-500" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>


      <div className="h-4 sm:h-6" /> {/* Reduced Spacing before main content */}


      {/* ── Main Dashboard Content (Contained) ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 space-y-12 pb-20">

      {/* ── Environment Section Title ── */}
      <div className="pt-8 flex items-center gap-4 animate-fade-up stagger-2">
         <div className="h-8 w-1.5 bg-[#0d3318] rounded-full" />
         <h2 className="text-2xl sm:text-3xl font-black text-foreground">Laboratory Environment</h2>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((stat, idx) => (
          <div key={stat.label} className={`${stat.color} rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-up stagger-${idx + 1}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/65 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-tight">{stat.label}</p>
              <div className="p-1.5 sm:p-2 bg-white/15 rounded-lg shrink-0">
                <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-white">{stat.value}</p>
            <p className="text-white/45 text-[10px] font-medium mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Value Cards + Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

        {/* Asset Valuation */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-7 space-y-5 animate-fade-up stagger-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-foreground">Institutional Asset Valuation</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Original Cost", value: formatCurrency(totalOriginalValue), sub: "At time of purchase", bg: "from-[#0d3318]/5 to-[#1a5a28]/10", border: "border-primary/10", num: "text-foreground" },
              { label: "Current Value", value: formatCurrency(totalCurrentValue), sub: "After depreciation", bg: "from-emerald-500/5 to-green-600/10", border: "border-emerald-200", num: "text-emerald-700" },
              { label: "Depreciation Loss", value: formatCurrency(depreciationLoss), sub: "Total value lost", bg: "from-red-500/5 to-rose-600/10", border: "border-red-200", num: "text-red-600" },
            ].map(card => (
              <div key={card.label} className={`bg-gradient-to-br ${card.bg} border ${card.border} p-4 rounded-xl`}>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">{card.label}</p>
                <p className={`text-xl sm:text-2xl font-black ${card.num}`}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          {categoryData.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Articles by Category</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: "#374151" }} tickLine={false} axisLine={false} width={100} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                    cursor={{ fill: "rgba(13,51,24,0.05)" }}
                  />
                  <Bar dataKey="count" fill="#1a5a28" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-7 flex flex-col animate-fade-up stagger-3">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-foreground">Article Status</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center min-h-[200px] sm:min-h-[240px]">
            {totalItems > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="white"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/25 mb-3" />
                <p className="text-sm font-semibold">No inventory data yet.</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Add articles to see stats.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up stagger-4">
        {[
          { title: "View Inventory", desc: "Browse and manage all lab assets", href: "/inventory", icon: Package, color: "from-[#0d3318] to-[#1a5a28]" },
          { title: "Inspection Reports", desc: `${pendingReports} report${pendingReports !== 1 ? 's' : ''} awaiting approval`, href: "/reports", icon: FileText, color: "from-blue-600 to-indigo-700" },
          { title: "Procurement Requests", desc: `${pendingRequests} request${pendingRequests !== 1 ? 's' : ''} pending`, href: "/requests", icon: ClipboardList, color: "from-purple-600 to-violet-700" },
        ].map(action => (
          <Link key={action.title} href={action.href}>
            <div className={`bg-gradient-to-br ${action.color} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}>
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-white/15 rounded-xl">
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <p className="text-white font-black text-base">{action.title}</p>
                <p className="text-white/55 text-xs font-medium mt-1">{action.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Article Price History Search ── */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden animate-fade-up stagger-5">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b bg-gradient-to-r from-muted/30 to-transparent flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-2 bg-primary/10 rounded-xl">
              <IndianRupee className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-sm sm:text-base">Article Price History Search</h3>
              <p className="text-xs text-muted-foreground font-medium">Search past purchase prices to plan your next procurement</p>
            </div>
          </div>
          {/* Search Input */}
          <div className="relative flex-1 w-full sm:max-w-sm sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={priceSearch}
              onChange={e => setPriceSearch(e.target.value)}
              placeholder='Search article name e.g. "Oscilloscope"...'
              className="w-full pl-9 pr-9 h-10 rounded-xl border border-border bg-white text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
            {priceSearch && (
              <button
                onClick={() => setPriceSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {!priceSearch ? (
          <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
            <div className="p-4 bg-primary/5 rounded-2xl">
              <Search className="w-8 h-8 text-primary/40" />
            </div>
            <div>
              <p className="font-bold text-muted-foreground">Search for an article</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Type an article name above to see all purchase records and historical prices</p>
            </div>
          </div>
        ) : (() => {
          const query = priceSearch.toLowerCase().trim();
          const results = items
            .filter(item =>
              item.name.toLowerCase().includes(query) ||
              item.category?.toLowerCase().includes(query) ||
              item.itemCode?.toLowerCase().includes(query)
            )
            .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

          if (results.length === 0) {
            return (
              <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                <div className="p-4 bg-muted/30 rounded-2xl">
                  <Package className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="font-bold text-muted-foreground">No results found</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">No articles match &ldquo;{priceSearch}&rdquo;. Try a different keyword.</p>
                </div>
              </div>
            );
          }

          // Compute avg unit price for banner
          const avgPrice = results.reduce((sum, i) => sum + Number(i.originalCost), 0) / results.length;
          const minPrice = Math.min(...results.map(i => Number(i.originalCost)));
          const maxPrice = Math.max(...results.map(i => Number(i.originalCost)));

          return (
            <div>
              {/* Summary Bar */}
              <div className="px-5 py-3 bg-primary/5 border-b flex flex-wrap gap-4 sm:gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Records Found</span>
                  <span className="text-sm font-black text-primary">{results.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Avg. Unit Price</span>
                  <span className="text-sm font-black text-foreground">{formatCurrency(avgPrice)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Range</span>
                  <span className="text-sm font-black text-foreground">{formatCurrency(minPrice)} – {formatCurrency(maxPrice)}</span>
                </div>
                <div className="ml-auto">
                  <span className="text-[10px] text-muted-foreground/60 font-medium">Sorted by purchase date (newest first)</span>
                </div>
              </div>

              {/* Results Table — responsive scroll */}
              <div className="table-wrapper">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      {["Article Name", "Asset Code", "Category", "Laboratory", "Budget", "Purchase Date", "Qty", "Unit Price", "Current Value", "Status"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-wider text-foreground/50 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {results.map((item, idx) => {
                      const currentVal = calculateCurrentValue(item.originalCost, item.depreciationRate, item.purchaseDate);
                      const deprPct = Number(item.originalCost) > 0
                        ? Math.round(((Number(item.originalCost) - currentVal) / Number(item.originalCost)) * 100)
                        : 0;
                      const purchaseYear = new Date(item.purchaseDate).getFullYear();
                      const isRecent = new Date(item.purchaseDate) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 2);

                      return (
                        <tr key={item.id} className={`hover:bg-muted/15 transition-colors ${idx === 0 ? 'bg-primary/[0.02]' : ''}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isRecent && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-200 uppercase tracking-wide shrink-0">Recent</span>
                              )}
                              <span className="font-bold text-foreground">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded">{item.itemCode}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                              <Tag className="w-3 h-3" />{item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                              <p className="text-xs font-mono text-muted-foreground/70 mt-0.5">
                                {item.itemCode} · {item.labName} {item.location && <span className="bg-muted px-1 rounded font-bold">Loc: {item.location}</span>}
                              </p>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {item.budget ? (
                              <span className="text-[10px] font-black px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-100 uppercase tracking-tighter">
                                {item.budget}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-primary">{item.quantity || 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="font-black text-foreground text-sm">{formatCurrency(Number(item.originalCost))}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <p className="font-bold text-sm text-emerald-700">{formatCurrency(currentVal)}</p>
                              <p className="text-[10px] text-red-500 font-bold">-{deprPct}% depreciated</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border whitespace-nowrap ${
                              item.functionalStatus === 'Working'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.functionalStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Procurement Tip */}
              <div className="px-5 py-3.5 bg-amber-50 border-t border-amber-100 flex items-start gap-2.5">
                <IndianRupee className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  <strong>Procurement Tip:</strong> The average unit price for &ldquo;{priceSearch}&rdquo; is <strong>{formatCurrency(avgPrice)}</strong>. 
                  The most recent purchase was on <strong>{new Date(results[0].purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong> at <strong>{formatCurrency(Number(results[0].originalCost))}</strong> per unit.
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Institution Leadership ── */}
      <div className="space-y-6 sm:space-y-8 animate-fade-up stagger-5 pb-10">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1.5 bg-[#1a5a28] rounded-full" />
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">Institution Leadership</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              name: "Dr. M.A. Khan",
              title: "PRINCIPAL",
              subtitle: "University Polytechnic, Jamia Millia Islamia",
              image: "/principal.png",
              delay: "stagger-1"
            },
            {
              name: "Ms. Farah Jamal Ansari",
              title: "LAB INCHARGE & PROJECT GUIDE",
              subtitle: "University Polytechnic, Computer Engineering",
              image: "/farah.png",
              delay: "stagger-2"
            },
            {
              name: "Mr. Asad Mirza Baig",
              title: "STORE KEEPER",
              subtitle: "University Polytechnic, Jamia Millia Islamia",
              image: "/asad.jpg",
              delay: "stagger-3"
            }
          ].map((leader) => (
            <div key={leader.name} className={`glass-card rounded-[2.5rem] p-8 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-2xl transition-all duration-500 ${leader.delay}`}>
              {/* Decorative Circle Background */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-secondary/5 rounded-full blur-2xl" />
              
              {/* Profile Image Container */}
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-muted flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-105">
                  <img 
                    src={leader.image} 
                    alt={leader.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const cleanName = leader.name.replace(/^(Dr\.|Ms\.|Mr\.|Mrs\.)\s+/i, '');
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0d3318&color=fff&size=128&bold=true`;
                    }}
                  />
                </div>
                {/* Active Status Dot */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full z-20 shadow-sm" />
              </div>

              {/* Leader Info */}
              <div className="relative z-10 space-y-3">
                <h3 className="text-xl font-black text-foreground tracking-tight">{leader.name}</h3>
                
                <div className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black tracking-widest uppercase border border-emerald-100/50">
                  {leader.title}
                </div>

                <p className="text-sm text-black/50 font-semibold leading-relaxed max-w-[200px] mx-auto">
                  {leader.subtitle}
                </p>
              </div>

              {/* Subtle bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
}