import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode, useState } from "react";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, LogOut, Menu, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  to: string;
  labelMn: string;
  labelJa: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
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

  const regularItems = navItems.filter((it) => !it.highlight);
  const highlightItems = navItems.filter((it) => it.highlight);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-soft">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">EJU</div>
          <div className="text-[10px] text-muted-foreground">
            {requireRole === "admin"
              ? lang === "mn" ? "Админ" : "Admin"
              : lang === "mn" ? "Оюутан" : "Student"}
          </div>
        </div>
      </div>

      {/* Regular nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        {regularItems.map((it) => {
          const isActive =
            location.pathname === it.to || location.pathname.startsWith(it.to + "/");
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <it.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span className="flex-1 leading-tight">{lang === "mn" ? it.labelMn : it.labelJa}</span>
              {isActive && <ChevronRight className="h-3 w-3 text-primary/50" />}
            </Link>
          );
        })}

        {/* Highlighted CTA nav items */}
        {highlightItems.length > 0 && (
          <div className="pt-3 pb-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1.5">
              {lang === "mn" ? "Үйлдэл" : "Actions"}
            </p>
            {highlightItems.map((it) => {
              const isActive =
                location.pathname === it.to || location.pathname.startsWith(it.to + "/");
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-elegant"
                      : "bg-primary/10 text-primary font-medium hover:bg-primary/20"
                  }`}
                >
                  <it.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 leading-tight">{lang === "mn" ? it.labelMn : it.labelJa}</span>
                  <ArrowRightSmall />
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-sidebar-accent/30">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
            {user.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <p className="text-xs text-muted-foreground truncate flex-1">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
          onClick={() => void signOut()}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          {lang === "mn" ? "Гарах" : "Log out"}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur px-4 h-14">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col bg-sidebar">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="font-bold text-sm tracking-tight">EJU</div>
          <LangSwitcher />
        </header>

        {/* Desktop topbar */}
        <div className="hidden md:flex items-center justify-end gap-3 border-b border-border px-6 h-14 bg-background/60 backdrop-blur-sm">
          <LangSwitcher />
        </div>

        <main className="flex-1 p-5 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ArrowRightSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 opacity-60">
      <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
