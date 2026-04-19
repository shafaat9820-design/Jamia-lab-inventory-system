import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  University, Mail, Phone, MapPin, ExternalLink, Globe,
  Package, FileText, ClipboardList, BookOpen, Users, Home,
  TrendingDown, Trash2, X, Menu, ChevronRight
} from "lucide-react";
import { ProfileDropdown } from "../profile-dropdown";
import { Link, useLocation } from "wouter";
import jaimaLogo from "@/assets/jamia-logo.png";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "Admin";

  const navItems = [
    { title: "Home", url: "/dashboard", icon: Home },
    { title: "Inventory", url: "/inventory", icon: Package },
    { title: "Depreciation", url: "/depreciation", icon: TrendingDown },
    { title: "Reports", url: "/reports", icon: FileText },
    { title: "Requests", url: "/requests", icon: ClipboardList },
    { title: "Dead Inventory", url: "/dead-inventory", icon: Trash2 },
  ];

  if (isAdmin) {
    navItems.push({ title: "Users", url: "/users", icon: Users });
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background font-sans overflow-x-hidden">

      <header className="sticky top-0 z-50 w-full bg-[#0d3318] border-b border-white/10 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-10 flex items-center justify-between h-20 lg:h-28">


          {/* Logo & Branding */}
          <Link href="/dashboard" className="flex items-center gap-2 lg:gap-3 xl:gap-4 group cursor-pointer min-w-0 flex-1 lg:flex-none">

            <div className="transition-all duration-300 shrink-0">
              <img src={jaimaLogo} alt="Jamia Crest" className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 object-contain filter drop-shadow-2xl" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight -mb-1 truncate sm:whitespace-normal" style={{ fontFamily: "'Playfair Display', serif" }}>
                Jamia Millia Islamia
              </span>
              <span className="hidden sm:block text-[8px] sm:text-[9px] xl:text-[10px] text-yellow-500 font-black tracking-[0.2em] xl:tracking-[0.25em] uppercase">
                Lab Inventory &amp; Management System
              </span>
            </div>
          </Link>


          {/* Desktop Nav Tools */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">

            {navItems.map((item) => {
              const isActive = location === item.url;
              return (
                <Link key={item.title} href={item.url}>
                  <button
                    className={`flex items-center gap-1 xl:gap-2 px-2 xl:px-4 py-2 lg:py-2.5 xl:py-3 rounded-2xl text-[10px] xl:text-sm font-black tracking-wide transition-all duration-300

                      ${isActive
                        ? "bg-white/10 text-white shadow-inner"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <item.icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${isActive ? "text-yellow-500" : ""}`} />
                    {item.title}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Mobile Tools */}
          <div className="flex items-center gap-2 xl:gap-4 shrink-0">
            <div className="flex items-center gap-2 xl:gap-4 shrink-0 border-l border-white/10 pl-2 xl:pl-4">
              <ProfileDropdown />
            </div>

            
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-Out Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-[280px] jmi-header-gradient shadow-2xl animate-slide-right flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <img src={jaimaLogo} alt="Logo" className="w-10 h-10 object-contain bg-white p-0.5 rounded-full shadow-lg" />
                <span className="text-white font-black text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                  JMI Lab System
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User badge */}
            <div className="mx-4 my-3 px-4 py-3 rounded-xl bg-white/10 border border-white/10">
              <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">{user?.role}</p>
              <p className="text-white font-bold text-sm mt-0.5 truncate">{user?.name || user?.email}</p>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <Link key={item.title} href={item.url}>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left
                        ${isActive
                          ? "bg-yellow-400 text-[#0d3318] shadow-lg"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#0d3318]" : ""}`} />
                      <span className="flex-1">{item.title}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="px-5 py-4 border-t border-white/10 text-[10px] text-white/30 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} Jamia Millia Islamia
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area (Full Width) ── */}
      <main className="flex-1 min-h-[calc(100vh-400px)] w-full overflow-x-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        <div className="animate-fade-up">
          {children}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t bg-[#071a0c] text-white/70 mt-auto">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 text-left">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <img src={jaimaLogo} alt="Logo" className="h-8 w-auto" />
                </div>
                <span className="font-bold text-white text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                  JMI Asset Portal
                </span>
              </div>
              <p className="text-sm text-white/45 leading-relaxed max-w-xs">
                Institutional laboratory inventory and condemnation management for the University Polytechnic, JMI.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-400/70 mb-4">Navigation</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Home", href: "/dashboard", icon: Home },
                  { label: "Inventory", href: "/inventory", icon: Package },
                  { label: "Reports", href: "/reports", icon: FileText },
                  { label: "Guidelines", href: "/guidelines", icon: BookOpen },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors font-medium group">
                      <link.icon className="w-3.5 h-3.5 text-yellow-400/40 group-hover:text-yellow-400/70 transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Institutional */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-400/70 mb-4">Institutional</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="https://jmi.ac.in" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors font-medium group">
                    <Globe className="w-3.5 h-3.5 text-yellow-400/40 group-hover:text-yellow-400/70 transition-colors" />
                    JMI Official Portal
                  </a>
                </li>
                <li>
                  <Link href="/guidelines" className="flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors font-medium group">
                    <ExternalLink className="w-3.5 h-3.5 text-yellow-400/40 group-hover:text-yellow-400/70 transition-colors" />
                    Staff Policies
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors font-medium group">
                    <Mail className="w-3.5 h-3.5 text-yellow-400/40 group-hover:text-yellow-400/70 transition-colors" />
                    IT Support Center
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors font-medium group">
                    <Users className="w-3.5 h-3.5 text-yellow-400/40 group-hover:text-yellow-400/70 transition-colors" />
                    My Profile
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-400/70 mb-4">Get in Touch</h4>
              <div className="space-y-3">
                <p className="flex items-start gap-2.5 text-sm text-white/45 leading-relaxed font-medium">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-yellow-400/50 shrink-0" />
                  Maulana Mohammad Ali Jauhar Marg, Jamia Nagar, New Delhi – 110025
                </p>
                <a href="tel:8280660000" className="flex items-center gap-2.5 text-sm text-white/45 hover:text-white transition-colors font-medium">
                  <Phone className="w-3.5 h-3.5 text-yellow-400/50 shrink-0" />
                  828066*****
                </a>
                <a href="mailto:jmi.lab.inventory@gmail.com" className="flex items-center gap-2.5 text-sm text-white/45 hover:text-white transition-colors font-medium break-all">
                  <Mail className="w-3.5 h-3.5 text-yellow-400/50 shrink-0" />
                  jmi.lab.inventory@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-5 border-t border-white/[0.07] flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
              University Polytechnic, Jamia Millia Islamia
            </p>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.25em] text-center">
              © {new Date().getFullYear()} Jamia Millia Islamia — Central University, Govt. of India
            </p>
            <div className="flex gap-5">
              <a href="#" className="text-[10px] font-bold text-white/20 hover:text-white/50 transition-colors uppercase tracking-widest">Privacy</a>
              <a href="#" className="text-[10px] font-bold text-white/20 hover:text-white/50 transition-colors uppercase tracking-widest">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
