import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Shield, 
  Bell, 
  FileText, 
  MapPin, 
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Red Team", href: "/red-team", icon: Shield },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Audit Log", href: "/audit-log", icon: FileText },
  { name: "Zone Analysis", href: "/zone-analysis", icon: MapPin },
];

const Layout = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">SentinelX</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-100 text-orange-700 border-r-2 border-orange-600"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>Disaster Intelligence Platform</p>
            <p className="mt-1">Version 2.0</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || "SentinelX"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="font-normal">
                    {user.name} ({user.role})
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600">
                    <LogOut className="h-4 w-4 mr-1" />
                    Log out
                  </Button>
                </>
              )}
              <div className="text-sm text-gray-500 hidden sm:inline">
                Government Disaster Response System
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
