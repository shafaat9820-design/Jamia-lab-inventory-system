import { BookOpen, ShieldCheck, AlertCircle, CheckCircle2, Info, ArrowRight, FileText } from "lucide-react";

export default function Guidelines() {
  const sections = [
    {
      title: "Inventory Management",
      icon: BookOpen,
      accent: "from-[#0d3318]/10 to-[#1a5a28]/5",
      border: "border-l-[#1a5a28]",
      iconBg: "bg-[#0d3318]/10 text-[#1a5a28]",
      desc: "How to properly catalog and track laboratory assets.",
      items: [
        "All new equipment must be entered into the system within 48 hours of receipt.",
        "Ensure item codes follow the institutional naming convention (e.g., DEPT-LAB-XXX).",
        "Original cost and purchase date must be accurate for depreciation calculations.",
        "Any movement of equipment between labs must be updated in the registry."
      ]
    },
    {
      title: "Condemnation Process",
      icon: AlertCircle,
      accent: "from-red-500/5 to-rose-600/5",
      border: "border-l-red-500",
      iconBg: "bg-red-100 text-red-700",
      desc: "Protocol for retiring non-functional or obsolete equipment.",
      items: [
        "Mark items as 'Non Working' in the inventory before initiating condemnation.",
        "A formal request must be submitted for items with original cost > ₹50,000.",
        "The Principal must approve all final disposal of assets.",
        "Retain physical records of the condemnation certificate for 5 years."
      ]
    },
    {
      title: "User Roles & Permissions",
      icon: ShieldCheck,
      accent: "from-blue-500/5 to-indigo-600/5",
      border: "border-l-blue-500",
      iconBg: "bg-blue-100 text-blue-700",
      desc: "Accessibility guidelines for different institutional roles.",
      items: [
        "Lab Assistants can view and request items but cannot delete records.",
        "Store Keepers are responsible for verifying entries and updating status.",
        "Admin users have full control over user management and system settings.",
        "Keep credentials confidential and log out after every session."
      ]
    }
  ];

  return (
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
            Official protocols for Jamia Millia Islamia laboratory management.
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
                Download the full printable version of the Institutional Lab Policy (2024 Revision) for offline reference.
              </p>
            </div>
          </div>
          <div className="px-7 pb-7 relative z-10">
            <button className="flex items-center gap-2 font-bold px-6 py-3 bg-yellow-400 text-[#0d3318] rounded-xl hover:bg-yellow-300 transition-all shadow-lg group w-full justify-center">
              Download Policy PDF
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
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
            All staff members are expected to adhere to these guidelines. Non-compliance may result in restricted system access. For clarifications, contact the Lab Incharge or System Administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
