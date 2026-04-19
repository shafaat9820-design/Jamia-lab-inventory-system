import { BookOpen, ShieldCheck, AlertCircle, CheckCircle2, Info, ArrowRight, FileText, Package, TrendingDown, ClipboardList, Trash2, Lock } from "lucide-react";
import { downloadPolicyPDF } from "@/lib/pdf-generator";

export default function Guidelines() {
  const sections = [
    {
      title: "Inventory Management",
      icon: Package,
      accent: "from-[#0d3318]/10 to-[#1a5a28]/5",
      border: "border-l-[#1a5a28]",
      iconBg: "bg-[#0d3318]/10 text-[#1a5a28]",
      desc: "How to properly catalog and track laboratory assets.",
      items: [
        "All new articles must be registered in the system within 48 hours of receipt by the Store Keeper.",
        "Item codes must follow a consistent naming convention (e.g., DEPT-LAB-XXX) for easy tracking.",
        "Original cost, purchase date, quantity, and laboratory room number must be accurately filled for depreciation calculations.",
        "Any movement of articles between labs or rooms must be updated immediately in the registry.",
        "Articles procured via the Procurement Request workflow are automatically added to the Inventory once marked Procured by the Store Keeper.",
      ],
    },
    {
      title: "Condemnation & Write-Off Process",
      icon: AlertCircle,
      accent: "from-red-500/5 to-rose-600/5",
      border: "border-l-red-500",
      iconBg: "bg-red-100 text-red-700",
      desc: "Protocol for retiring non-functional or obsolete articles.",
      items: [
        "Mark items as 'Non Working' in the inventory before initiating the condemnation process.",
        "Lab Incharge must file a formal Inspection Report with expert recommendation (Condemn / Repair / Continue Use).",
        "The Principal must review and approve the Inspection Report before condemnation eligibility is granted.",
        "Only after Principal approval can the Store Keeper or Admin mark the article as 'Condemned' in the inventory.",
        "Condemned articles eligible for disposal must go through a formal Write-Off process with GFR-17, Condemnation Certificate, and optional Depreciation Report uploaded.",
        "Written-off assets are moved to Dead Inventory and are automatically deleted after 3 months. Admins can recover them within this window.",
      ],
    },
    {
      title: "Procurement Requests",
      icon: ClipboardList,
      accent: "from-purple-500/5 to-violet-600/5",
      border: "border-l-purple-500",
      iconBg: "bg-purple-100 text-purple-700",
      desc: "Workflow for requesting new or replacement lab articles.",
      items: [
        "Lab Incharge submits a Procurement Request specifying article name, quantity, lab name, and justification.",
        "The Principal reviews and either Approves or Rejects the request — Admin has no role in this decision.",
        "Once Approved, the Store Keeper marks the request as 'Procured', which automatically adds the article to the Inventory.",
        "Only High priority requests should be used for critical lab equipment that is immediately needed.",
      ],
    },
    {
      title: "Depreciation Tracking",
      icon: TrendingDown,
      accent: "from-amber-500/5 to-orange-600/5",
      border: "border-l-amber-500",
      iconBg: "bg-amber-100 text-amber-700",
      desc: "How asset value is calculated and monitored over time.",
      items: [
        "Depreciation is calculated using the Written Down Value (WDV) method.",
        "Each asset has a Useful Life (years) and Depreciation Rate (% per year) set at registration.",
        "The Depreciation page provides a live view of current market value for all active, non-condemned assets.",
        "Download a comprehensive Depreciation Report as PDF from the Depreciation page for auditing.",
      ],
    },
    {
      title: "User Roles & Permissions",
      icon: ShieldCheck,
      accent: "from-blue-500/5 to-indigo-600/5",
      border: "border-l-blue-500",
      iconBg: "bg-blue-100 text-blue-700",
      desc: "Access control guidelines for institutional roles.",
      items: [
        "Lab Assistant — Can view inventory and reports. Cannot add, delete, or modify records.",
        "Lab Incharge — Can file Inspection Reports and submit Procurement Requests.",
        "Store Keeper — Can register, edit, and delete inventory items. Can mark Procured requests as Procured. Can initiate Write-Off for condemned assets.",
        "Principal — Reviews and approves/rejects Inspection Reports and Procurement Requests. Final authority on all condemnation decisions.",
        "Admin — Full access to system: user management, inventory, and settings. Cannot approve/reject reports or requests (that is exclusive to Principal).",
        "Keep credentials confidential and log out after every session.",
      ],
    },
    {
      title: "Dead Inventory",
      icon: Trash2,
      accent: "from-gray-500/5 to-slate-600/5",
      border: "border-l-gray-500",
      iconBg: "bg-gray-100 text-gray-700",
      desc: "Management of written-off assets awaiting final disposal.",
      items: [
        "Written-off assets are held in Dead Inventory for 90 days (3 months) before permanent deletion.",
        "A countdown timer is displayed for each asset showing remaining days before automatic deletion.",
        "Admin can recover an asset from Dead Inventory back to the main Inventory during this window.",
        "Required documents for write-off: GFR-17 Form, Condemnation Certificate, and optionally a Depreciation Report (all PDF).",
      ],
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-20 py-10">
      <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Operational Guidelines
            </h2>
          </div>
          <p className="text-muted-foreground font-medium text-sm ml-14">
            Official protocols for Jamia Millia Islamia University Polytechnic laboratory management.
          </p>
        </div>
      </div>

      {/* Guideline Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${section.accent} bg-white rounded-2xl border border-border border-l-4 ${section.border} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden`}
          >
            <div className="p-7">
              <div className="flex items-start gap-4 mb-5">
                <div className={`p-2.5 rounded-xl ${section.iconBg} shrink-0`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">{section.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">{section.desc}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground font-medium group hover:text-foreground transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* PDF Download Card */}
        <div className="bg-gradient-to-br from-[#0d3318] to-[#1a5a28] rounded-2xl border-none shadow-xl flex flex-col justify-between overflow-hidden relative">
          {/* Decorative Element */}
          <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="p-7 relative z-10 space-y-4">
            <div className="p-3 bg-white/15 rounded-xl w-fit">
              <FileText className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-1">
                Official Document
              </p>
              <h3 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Need a PDF Copy?
              </h3>
              <p className="text-white/60 font-medium leading-relaxed mt-2 text-sm">
                Download the full printable version of the Institutional Lab Policy for offline reference and official records.
              </p>
            </div>
          </div>
          <div className="px-7 pb-7 relative z-10">
            <button
              onClick={() => downloadPolicyPDF()}
              className="flex items-center gap-2 font-bold px-6 py-3 bg-yellow-400 text-[#0d3318] rounded-xl hover:bg-yellow-300 transition-all shadow-lg group w-full justify-center"
            >
              Download Policy PDF
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Role Summary Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-7 py-5 border-b bg-muted/20 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-foreground">Quick Role Reference</h3>
            <p className="text-xs text-muted-foreground font-medium">Who can do what in the system</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b">
                {["Action", "Lab Assistant", "Lab Incharge", "Store Keeper", "Principal", "Admin"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-black text-xs uppercase tracking-wider text-foreground/60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                ["View Inventory & Reports", "✅", "✅", "✅", "✅", "✅"],
                ["Add / Edit Inventory", "❌", "❌", "✅", "❌", "❌"],
                ["Delete Inventory Items", "❌", "❌", "✅", "❌", "❌"],
                ["File Inspection Report", "❌", "✅", "❌", "❌", "❌"],
                ["Approve / Reject Report", "❌", "❌", "❌", "✅", "❌"],
                ["Submit Procurement Request", "❌", "✅", "❌", "❌", "❌"],
                ["Approve / Reject Request", "❌", "❌", "❌", "✅", "❌"],
                ["Mark Request as Procured", "❌", "❌", "✅", "❌", "❌"],
                ["Condemn Inventory Item", "❌", "❌", "✅", "❌", "❌"],
                ["Write-Off (Dead Inventory)", "❌", "❌", "✅", "❌", "❌"],
                ["Recover from Dead Inventory", "❌", "❌", "✅", "❌", "❌"],
                ["Manage Users & Roles", "❌", "❌", "❌", "❌", "✅"],
              ].map(([action, ...cells], i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">{action}</td>
                  {cells.map((cell, j) => (
                    <td key={j} className={`px-4 py-3 text-center font-bold text-base ${cell === "✅" ? "text-green-600" : "text-red-400/60"}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Info Banner */}
      <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="p-2 bg-amber-100 rounded-lg shrink-0">
          <Info className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900">Policy Compliance Notice</p>
          <p className="text-sm text-amber-700/80 font-medium mt-0.5 leading-relaxed">
            All staff members are expected to adhere to these guidelines. Non-compliance may result in restricted system access or disciplinary action. For clarifications, contact the Lab Incharge or System Administrator at <strong>jmi.lab.inventory@gmail.com</strong>.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
