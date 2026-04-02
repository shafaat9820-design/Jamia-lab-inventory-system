import { Link } from "wouter";
import { Home, SearchX } from "lucide-react";
import jamiaLogo from "@/assets/jamia-logo.png";

export default function NotFound() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a1f0e 0%, #0d3318 50%, #0a1f0e 100%)" }}
    >
      {/* Decorative circles */}
      <div className="absolute top-[-120px] left-[-120px] w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-120px] right-[-120px] w-96 h-96 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center px-6 flex flex-col items-center gap-8 max-w-lg">
        {/* Logo */}
        <div className="p-3 bg-white/10 backdrop-blur rounded-2xl shadow-xl border border-white/10">
          <img src={jamiaLogo} alt="JMI Logo" className="w-16 h-16 object-contain" />
        </div>

        {/* 404 Text */}
        <div>
          <p className="text-yellow-400 text-xs font-black uppercase tracking-[0.3em] mb-3">
            Error 404
          </p>
          <h1
            className="text-7xl font-black text-white leading-none"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            404
          </h1>
          <h2
            className="text-2xl font-bold text-white/80 mt-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Page Not Found
          </h2>
          <p className="text-white/50 mt-4 text-base leading-relaxed font-medium">
            The page you're looking for doesn't exist or has been moved. Please navigate back to the dashboard.
          </p>
        </div>

        {/* Search X icon decorative */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
          <SearchX className="w-14 h-14 text-yellow-400/50 mx-auto" />
        </div>

        {/* CTA Button */}
        <Link href="/dashboard">
          <button className="flex items-center gap-2.5 px-8 py-3.5 bg-yellow-400 text-[#0d3318] rounded-xl font-black text-base shadow-xl hover:bg-yellow-300 transition-all duration-200 hover:-translate-y-0.5">
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
        </Link>

        <p className="text-white/20 text-xs font-medium">
          © {new Date().getFullYear()} Jamia Millia Islamia — Lab Inventory System
        </p>
      </div>
    </div>
  );
}
