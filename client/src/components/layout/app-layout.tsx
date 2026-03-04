import { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, University } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          
          {/* Institutional Header */}
          <header className="flex items-center justify-between px-6 py-4 bg-primary text-primary-foreground shadow-md z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white hover:bg-white/20 hover:text-white" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full">
                  <University className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold leading-tight text-white m-0">
                    Jamia Millia Islamia
                  </h1>
                  <p className="text-xs md:text-sm text-primary-foreground/80 font-medium tracking-wide uppercase">
                    Lab Inventory & Condemnation Management System • Dept of Computer Engineering
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end text-sm">
                <span className="font-semibold text-white">{user?.name}</span>
                <span className="text-primary-foreground/80 text-xs px-2 py-0.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20">
                  {user?.role}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logout()}
                title="Log out"
                className="text-white hover:bg-white/20 hover:text-white"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background relative">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          
          {/* Institutional Footer */}
          <footer className="py-4 text-center border-t bg-card text-muted-foreground text-sm font-medium">
            &copy; {new Date().getFullYear()} Jamia Millia Islamia. All rights reserved.
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
