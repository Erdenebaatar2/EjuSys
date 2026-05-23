import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ComponentType, type ReactNode, useState } from "react";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import {
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  to: string;
  labelMn: string;
  labelJa: string;
  icon: ComponentType<{ className?: string }>;
  highlight?: boolean;
}

interface DashboardLayoutProps {
  requireRole: AppRole;
  navItems: NavItem[];
  children?: ReactNode;
  hideDesktopSidebar?: boolean;
}

interface StudentSidebarProfile {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profilePhotoPath?: string | null;
}

export function DashboardLayout({
  requireRole,
  navItems,
  hideDesktopSidebar = false,
}: DashboardLayoutProps) {
  const { user, role, loading, signOut } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAdmin = requireRole === "admin";
  const isStudent = requireRole === "student";
  const isPortal = isAdmin || isStudent;
  const { data: studentProfile } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: () => apiGet<StudentSidebarProfile>("/api/student/profile"),
    enabled: Boolean(user && role === "student" && isStudent),
  });

  useEffect(() => {
    if (!loading) {
      if (!user) void navigate({ to: "/login" });
      else if (role && role !== requireRole) {
        void navigate({ to: role === "admin" ? "/admin/dashboard" : "/student/dashboard" });
      }
    }
  }, [loading, user, role, requireRole, navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSidebarCollapsed(window.localStorage.getItem("dashboard-sidebar-collapsed") === "true");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("dashboard-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  if (loading || !user || role !== requireRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const regularItems = navItems.filter((it) => !it.highlight);
  const highlightItems = navItems.filter((it) => it.highlight);
  const roleLabel =
    requireRole === "admin"
      ? lang === "mn"
        ? "Админ"
        : "Admin"
      : lang === "mn"
        ? "Оюутан"
        : "Student";
  const layoutTitle =
    requireRole === "admin"
      ? lang === "mn"
        ? "Админы хяналтын самбар"
        : "Admin dashboard"
      : lang === "mn"
        ? "Оюутны хяналтын самбар"
        : "Student dashboard";
  const activeItem = navItems.find(
    (it) => location.pathname === it.to || location.pathname.startsWith(it.to + "/"),
  );
  const activeLabel = activeItem
    ? lang === "mn"
      ? activeItem.labelMn
      : activeItem.labelJa
    : layoutTitle;
  const studentName = studentProfile
    ? `${studentProfile.lastName ?? ""} ${studentProfile.firstName ?? ""}`.trim()
    : "";
  const sidebarName =
    isStudent && studentName
      ? studentName
      : isStudent
        ? `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim() || "EJU"
        : "EJU";
  const sidebarSubtitle =
    isStudent && (studentProfile?.email || user.email)
      ? (studentProfile?.email ?? user.email)
      : roleLabel;
  const sidebarInitials =
    initialsForSidebar(studentProfile?.firstName, studentProfile?.lastName) ||
    initialsForSidebar(user.firstName, user.lastName) ||
    user.email?.[0]?.toUpperCase() ||
    "U";
  const sidebarPhoto = mediaUrl(studentProfile?.profilePhotoPath);

  const SidebarContent = ({
    collapsed = false,
    showCollapseToggle = false,
  }: {
    collapsed?: boolean;
    showCollapseToggle?: boolean;
  }) => (
    <>
      <div
        className={cn(
          "flex h-16 items-center border-b",
          collapsed ? "justify-between px-1.5" : "gap-3 px-5",
          isPortal ? "border-white/10" : "border-sidebar-border",
        )}
      >
        {isStudent ? (
          <Link
            to="/student/profile"
            onClick={() => setOpen(false)}
            title={collapsed ? sidebarName : undefined}
            className={cn(
              "flex min-w-0 items-center rounded-lg transition-colors",
              collapsed ? "justify-center" : "gap-3",
              isPortal ? "text-white hover:bg-white/10" : "hover:bg-sidebar-accent/50",
            )}
          >
            <SidebarAvatar
              src={sidebarPhoto}
              initials={sidebarInitials}
              collapsed={collapsed}
              portal={isPortal}
            />
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <div
                  className={cn(
                    "truncate text-sm font-bold tracking-tight",
                    isPortal && "text-white",
                  )}
                >
                  {sidebarName}
                </div>
                <div
                  className={cn(
                    "truncate text-[11px]",
                    isPortal ? "text-white/55" : "text-muted-foreground",
                  )}
                >
                  {sidebarSubtitle}
                </div>
              </div>
            )}
          </Link>
        ) : (
          <>
            {!collapsed && (
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg shadow-soft",
                  isPortal
                    ? "bg-white/10 text-white ring-1 ring-white/15"
                    : "bg-gradient-hero text-primary-foreground",
                )}
              >
                <GraduationCap className="h-5 w-5" />
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <div className={cn("text-sm font-bold tracking-tight", isPortal && "text-white")}>
                  EJU
                </div>
                <div
                  className={cn(
                    "text-[11px]",
                    isPortal ? "text-white/55" : "text-muted-foreground",
                  )}
                >
                  {roleLabel}
                </div>
              </div>
            )}
          </>
        )}
        {showCollapseToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            className={cn(
              collapsed ? "h-7 w-7" : "ml-auto h-8 w-8",
              isPortal
                ? "text-white/70 hover:bg-white/10 hover:text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {regularItems.map((it) => {
          const isActive = location.pathname === it.to || location.pathname.startsWith(it.to + "/");
          const label = lang === "mn" ? it.labelMn : it.labelJa;

          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-lg py-2.5 text-sm transition-all duration-150",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                isPortal
                  ? isActive
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-white/68 hover:bg-white/10 hover:text-white"
                  : isActive
                    ? "bg-blue-50 font-medium text-primary shadow-sm"
                    : "text-sidebar-foreground/65 hover:bg-blue-50/70 hover:text-sidebar-foreground",
              )}
            >
              <it.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive && (isPortal ? "text-primary" : "text-primary"),
                )}
              />
              {!collapsed && <span className="min-w-0 flex-1 truncate leading-tight">{label}</span>}
              {isActive && !collapsed && (
                <ChevronRight
                  className={cn("h-3 w-3", isPortal ? "text-primary/70" : "text-primary/50")}
                />
              )}
            </Link>
          );
        })}

        {highlightItems.length > 0 && (
          <div className="pb-1 pt-3">
            <p
              className={cn(
                "mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider",
                collapsed && "sr-only",
                isPortal ? "text-white/40" : "text-muted-foreground/50",
              )}
            >
              {lang === "mn" ? "Үйлдэл" : "Actions"}
            </p>
            {highlightItems.map((it) => {
              const isActive =
                location.pathname === it.to || location.pathname.startsWith(it.to + "/");
              const label = lang === "mn" ? it.labelMn : it.labelJa;

              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center rounded-lg py-2.5 text-sm transition-all duration-150",
                    collapsed ? "justify-center px-2" : "gap-3 px-3",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-elegant"
                      : isPortal
                        ? "bg-white/10 text-white hover:bg-white/15"
                        : "bg-primary/10 font-medium text-primary hover:bg-primary/20",
                  )}
                >
                  <it.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="min-w-0 flex-1 truncate leading-tight">{label}</span>
                  )}
                  {!collapsed && <ArrowRight className="h-3.5 w-3.5 opacity-60" />}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div
        className={cn(
          "space-y-2 border-t p-3",
          isPortal ? "border-white/10" : "border-sidebar-border",
        )}
      >
        <div
          className={cn(
            "flex items-center rounded-lg py-1.5",
            collapsed ? "justify-center px-1" : "gap-2.5 px-2",
            isPortal ? "bg-white/10" : "bg-sidebar-accent/30",
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              isPortal ? "bg-cyan-400 text-slate-950" : "bg-primary/20 text-primary",
            )}
          >
            {user.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          {!collapsed && (
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-xs",
                isPortal ? "text-white/65" : "text-muted-foreground",
              )}
            >
              {user.email}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          title={collapsed ? (lang === "mn" ? "Гарах" : "Log out") : undefined}
          className={cn(
            "w-full",
            collapsed ? "justify-center px-0" : "justify-start",
            isPortal
              ? "text-white/65 hover:bg-white/10 hover:text-white"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
          )}
          onClick={() => void signOut()}
        >
          <LogOut className={cn("h-3.5 w-3.5", !collapsed && "mr-2")} />
          {!collapsed && (lang === "mn" ? "Гарах" : "Log out")}
        </Button>
      </div>
    </>
  );

  return (
    <div className={cn("flex min-h-screen", isPortal ? "bg-admin-surface" : "bg-background")}>
      {!hideDesktopSidebar && (
        <aside
          className={cn(
            "hidden flex-col transition-[width] duration-200 md:flex",
            sidebarCollapsed ? "w-16" : isPortal ? "w-72" : "w-64",
            isPortal
              ? "bg-admin-sidebar text-white shadow-xl shadow-slate-950/10"
              : "border-r border-sidebar-border bg-sidebar",
          )}
        >
          <SidebarContent collapsed={sidebarCollapsed} showCollapseToggle />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-white/90 px-4 backdrop-blur md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className={cn(
                "flex w-72 flex-col p-0",
                isPortal ? "bg-admin-sidebar text-white" : "bg-sidebar",
              )}
            >
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 truncate text-sm font-semibold tracking-tight">{activeLabel}</div>
          <LangSwitcher />
        </header>

        <div className="hidden h-16 items-center justify-between gap-3 border-b border-border/60 bg-white/80 px-6 shadow-soft backdrop-blur-sm md:flex">
          <div className="flex min-w-0 items-center gap-3">
            {!hideDesktopSidebar && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{activeLabel}</div>
              <div className="truncate text-xs text-muted-foreground">{layoutTitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPortal && (
              <div className="hidden items-center gap-1.5 rounded-md border border-primary/15 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary lg:flex">
                {isAdmin ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <UserRound className="h-3.5 w-3.5" />
                )}
                {isAdmin
                  ? lang === "mn"
                    ? "Админ эрх"
                    : "Admin access"
                  : lang === "mn"
                    ? "Оюутны хэсэг"
                    : "Student portal"}
              </div>
            )}
            <LangSwitcher />
            {hideDesktopSidebar && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => void signOut()}
              >
                <LogOut className="h-3.5 w-3.5" />
                {lang === "mn" ? "Гарах" : "Log out"}
              </Button>
            )}
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarAvatar({
  src,
  initials,
  collapsed,
  portal,
}: {
  src: string;
  initials: string;
  collapsed: boolean;
  portal: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold shadow-soft",
        collapsed ? "h-8 w-8" : "h-10 w-10",
        portal
          ? "bg-white/10 text-white ring-1 ring-white/15"
          : "bg-gradient-hero text-primary-foreground",
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt="Profile"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

function initialsForSidebar(firstName?: string | null, lastName?: string | null): string {
  const last = lastName?.trim()[0] ?? "";
  const first = firstName?.trim()[0] ?? "";
  return `${last}${first}`.toUpperCase();
}

function mediaUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  const normalized = path.startsWith("/uploads/")
    ? path
    : path.startsWith("uploads/")
      ? `/${path}`
      : `/uploads/${path}`;
  return `${mediaBaseUrl()}${normalized}`;
}

function mediaBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.port && window.location.port !== "8080") {
    return "http://localhost:8080";
  }
  return "";
}
