import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { 
  LayoutDashboard, 
  UserPlus, 
  Receipt, 
  Pill, 
  Stethoscope, 
  BarChart3, 
  Wallet,
  Heart
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/registration", label: "New Registration", icon: UserPlus },
  { path: "/billing", label: "Medicine/Billing", icon: Receipt },
  { path: "/medicine-master", label: "Medicine Master", icon: Pill },
  { path: "/treatment-master", label: "Treatment Master", icon: Stethoscope },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/expenses", label: "Expense Master", icon: Wallet },
];

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="flex h-16 items-center px-6 gap-6">
        <Link href="/" className="flex items-center gap-2 mr-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg leading-tight" data-testid="text-clinic-name">Prime Care</span>
            <span className="text-xs text-muted-foreground leading-tight">Clinic Management</span>
          </div>
        </Link>
        
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`link-nav-${item.path.replace("/", "") || "dashboard"}`}
              >
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover-elevate ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        <ThemeToggle />
      </div>
    </header>
  );
}
