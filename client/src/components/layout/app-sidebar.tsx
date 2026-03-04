import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  ClipboardList, 
  Users 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === "Admin";
  const isPrincipal = user?.role === "Principal";
  
  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Inventory", url: "/inventory", icon: Package },
    { title: "Reports", url: "/reports", icon: FileText },
    { title: "Requests", url: "/requests", icon: ClipboardList },
  ];

  // Only Admin and Principal can see all users
  if (isAdmin || isPrincipal) {
    navItems.push({ title: "Users", url: "/users", icon: Users });
  }

  return (
    <Sidebar className="border-r shadow-lg z-20">
      <div className="p-6 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
          Navigation
        </h2>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-4">
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link 
                        href={item.url}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                            : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-primary"}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
