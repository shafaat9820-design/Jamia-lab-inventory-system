import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  University, Mail, Phone, MapPin, ExternalLink, Globe,
  Package, FileText, ClipboardList, HelpCircle, BookOpen, Users, Home, LayoutDashboard
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

  const isAdmin = user?.role === "Admin";
  const isPrincipal = user?.role === "Principal";

  const navItems = [
    { title: "Home", url: "/dashboard", icon: Home },
    { title: "Inventory", url: "/inventory", icon: Package },
    { title: "Reports", url: "/reports", icon: FileText },
    { title: "Requests", url: "/requests", icon: ClipboardList },
    { title: "Guidelines", url: "/guidelines", icon: BookOpen },
    { title: "Support", url: "/support", icon: HelpCircle },
  ];

  if (isAdmin || isPrincipal) {
    navItems.push({ title: "Users", url: "/users", icon: Users });
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background font-sans overflow-x-hidden">

      {/* Top Institutional Info Strip */}
      <div className="bg-[#0d2e14] text-white/90 py-1.5 px-6 hidden md:block border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-semibold uppercase tracking-[0.18em]">
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-1.5 text-white/70">
              <MapPin className="w-3 h-3 text-yellow-400" />
              Maulana Mohammad Ali Jauhar Marg, New Delhi
            </span>
            <span className="flex items-center gap-1.5 border-l border-white/15 pl-6 text-white/70">
              <Mail className="w-3 h-3 text-yellow-400" />
              shafaat9820@gmail.com
            </span>
          </div>
          <a
            href="https://jmi.ac.in"
            target="_blank"
            className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <Globe className="w-3 h-3" />
            JMI Official Portal
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 shadow-2xl" style={{ background: 'linear-gradient(135deg, #0d3318 0%, #1a5a28 50%, #0d3318 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-[72px]">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3.5 group cursor-pointer shrink-0">
            <div className="p-1.5 bg-white/95 rounded-xl shadow-lg ring-2 ring-yellow-400/30 group-hover:ring-yellow-400/70 transition-all duration-300">
              <img src={jaimaLogo} alt="Logo" className="w-9 h-9 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black leading-none tracking-tight text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Jamia Millia Islamia
              </span>
              <span className="hidden sm:block text-[9px] text-yellow-400/80 font-bold tracking-[0.18em] uppercase mt-0.5">
                Lab Inventory & Management System
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-0.5 h-full">
            {navItems.map((item) => {
              const isActive = location === item.url;
              return (
                <Link key={item.title} href={item.url}>
                  <button
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                      ${isActive
                        ? "bg-white/15 text-white shadow-inner"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? "text-yellow-400" : ""}`} />
                    {item.title}
                    {isActive && (
                      <span className="absolute -bottom-px left-2 right-2 h-0.5 bg-yellow-400 rounded-full" />
                    )}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <ProfileDropdown />
          </div>
        </div>

        {/* Mobile scrollable nav */}
        <div className="xl:hidden border-t border-white/10 bg-black/20 px-3 py-2 overflow-x-auto scrollbar-none flex gap-1.5">
          {navItems.map((item) => {
            const isActive = location === item.url;
            return (
              <Link key={item.title} href={item.url}>
                <button
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all
                    ${isActive
                      ? "bg-yellow-400 text-[#0d3318] shadow-md"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.title}
                </button>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative min-h-[calc(100vh-350px)]">
        {/* Subtle decorative top glow */}
        <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-14">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-[#0a1f0e] text-white/70 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-left">

            {/* Brand */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <img src={jaimaLogo} alt="Logo" className="h-9 w-auto" />
                </div>
                <span className="font-bold text-white text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                  JMI Asset Portal
                </span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Institutional laboratory inventory and condemnation management for the Department of Computer Engineering, JMI.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400/80 mb-5">Navigation</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Home", href: "/dashboard", icon: Home },
                  { label: "Inventory", href: "/inventory", icon: Package },
                  { label: "Reports", href: "/reports", icon: FileText },
                  { label: "Guidelines", href: "/guidelines", icon: BookOpen },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors font-medium">
                      <link.icon className="w-3.5 h-3.5 text-yellow-400/50" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Institutional */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400/80 mb-5">Institutional</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="https://jmi.ac.in" target="_blank" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors font-medium">
                    <Globe className="w-3.5 h-3.5 text-yellow-400/50" /> JMI Official Portals
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors font-medium">
                    <ExternalLink className="w-3.5 h-3.5 text-yellow-400/50" /> Staff Policies
                  </a>
                </li>
                <li>
                  <Link href="/support" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors font-medium">
                    <Mail className="w-3.5 h-3.5 text-yellow-400/50" /> IT Support Center
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors font-medium">
                    <Users className="w-3.5 h-3.5 text-yellow-400/50" /> My Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.25em] text-yellow-400/80 mb-5">Get in Touch</h4>
              <div className="space-y-4">
                <p className="flex items-start gap-3 text-sm text-white/50 leading-relaxed font-medium">
                  <MapPin className="w-4 h-4 mt-0.5 text-yellow-400/60 shrink-0" />
                  Maulana Mohammad Ali Jauhar Marg, Jamia Nagar, New Delhi – 110025
                </p>
                <a href="tel:8280660000" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors font-medium">
                  <Phone className="w-4 h-4 text-yellow-400/60" />
                  828066*****
                </a>
                <a href="mailto:shafaat9820@gmail.com" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors font-medium break-all">
                  <Mail className="w-4 h-4 text-yellow-400/60 shrink-0" />
                  shafaat9820@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-none">Dept. of Computer Engineering, University Polytechnic</p>
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.25em]">
              © {new Date().getFullYear()} Jamia Millia Islamia — Central University, Government of India
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-[10px] font-bold text-white/25 hover:text-white/60 transition-colors uppercase tracking-widest">Privacy Policy</a>
              <a href="#" className="text-[10px] font-bold text-white/25 hover:text-white/60 transition-colors uppercase tracking-widest">University Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
