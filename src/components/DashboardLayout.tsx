import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface NavItem {
  to: string;
  labelMn: string;
  labelJa: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  requireRole: AppRole;
  navItems: NavItem[];
  children?: ReactNode;
}

export function DashboardLayout({ requireRole, navItems }: DashboardLayoutProps) {
  const { user, role, loading, signOut } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) void navigate({ to: "/login" });
      else if (role && role !== requireRole) {
        void navigate({ to: role === "admin" ? "/admin/dashboard" : "/student/dashboard" });
      }
    }
  }, [loading, user, role, requireRole, navigate]);

  if (loading || !user || role !== requireRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-hero text-primary-foreground shadow-soft">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">EJU</div>
          <div className="text-[10px] text-muted-foreground">
            {requireRole === "admin" ? (lang === "mn" ? "Админ" : "管理者") : (lang === "mn" ? "Оюутан" : "学生")}
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((it) => {
          const isActive = location.pathname === it.to || location.pathname.startsWith(it.to + "/");
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <it.icon className="h-4 w-4" />
              <span className="flex-1">{lang === "mn" ? it.labelMn : it.labelJa}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="px-2 text-xs text-muted-foreground truncate">{user.email}</div>
        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          {lang === "mn" ? "Гарах" : "ログアウト"}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile + main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur px-4 h-14">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col bg-sidebar">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="font-semibold text-sm">EJU</div>
          <LangSwitcher />
        </header>
        <div className="hidden md:flex items-center justify-end gap-3 border-b border-border px-6 h-14 bg-background/60">
          <LangSwitcher />
        </div>
        <main className="flex-1 p-5 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
