import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, LayoutDashboard, ShoppingBag, CreditCard, Headphones, LogOut, Users, DollarSign } from "lucide-react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const clientLinks = [
    { href: "/dashboard", label: "My Orders", icon: LayoutDashboard },
    { href: "/dashboard/new-application", label: "Purchase", icon: ShoppingBag },
    { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
    { href: "/dashboard/support", label: "Support", icon: Headphones },
  ];

  const adminLinks = [
    { href: "/admin", label: "All Orders", icon: Users },
    { href: "/admin/payments", label: "All Payments", icon: CreditCard },
  ];

  const links = isAdmin ? [...clientLinks, ...adminLinks] : clientLinks;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="font-bold text-foreground text-lg">AccelDocs</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            {isAdmin && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">Admin</span>
            )}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-56 border-r bg-card min-h-[calc(100vh-57px)] hidden md:block p-4">
          <nav className="space-y-1">
            {links.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 px-2 py-1">
          <div className="flex justify-around">
            {links.slice(0, 4).map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex flex-col items-center gap-0.5 py-1 px-2 text-xs ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  <span className="truncate max-w-[60px]">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
