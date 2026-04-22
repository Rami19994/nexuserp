import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  Box, 
  Workflow, 
  ArrowRightLeft, 
  ClipboardCheck, 
  BarChart3, 
  Users, 
  LogOut, 
  Menu,
  X,
  Factory,
  Cog
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, hasRole } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "manager", "viewer"] },
    { name: "Materials", href: "/materials", icon: Box, roles: ["admin", "manager"] },
    { name: "Products & BOM", href: "/products", icon: Package, roles: ["admin", "manager"] },
    { name: "Locations", href: "/locations", icon: MapPin, roles: ["admin", "manager"] },
    { name: "Manufacturing Plan", href: "/manufacturing/plan", icon: Factory, roles: ["admin", "manager"] },
    { name: "Production Jobs", href: "/production/jobs", icon: Cog, roles: ["admin", "manager", "storekeeper"] },
    { name: "Stock In", href: "/inventory/stock-in", icon: Workflow, roles: ["admin", "manager", "storekeeper"] },
    { name: "Transfer", href: "/inventory/transfer", icon: ArrowRightLeft, roles: ["admin", "manager", "storekeeper"] },
    { name: "Audit / Count", href: "/inventory/audit", icon: ClipboardCheck, roles: ["admin", "manager", "storekeeper"] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "manager", "viewer"] },
    { name: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
  ];

  const filteredNav = navigation.filter(item => hasRole(item.roles));

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col
      `}>
        <div className="flex items-center h-20 px-6 bg-sidebar border-b border-sidebar-border/50 shrink-0">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="h-8 w-8 rounded-lg shadow-lg shadow-primary/20" />
          <span className="ml-3 font-display font-bold text-xl text-sidebar-foreground tracking-wide">Nexus ERP</span>
          <button className="ml-auto lg:hidden text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {filteredNav.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} className="block">
                <div className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-primary/10 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] ring-1 ring-primary/20' 
                    : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground'}
                `}>
                  <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-sidebar-border bg-sidebar shrink-0">
          <div className="flex items-center px-4 py-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
              <p className="text-xs text-primary font-medium truncate">{user.role}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="ml-2 p-2 rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="h-8 w-8 rounded-lg" />
            <span className="ml-2 font-display font-bold text-lg">Nexus ERP</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto bg-background custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
