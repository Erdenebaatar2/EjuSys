import { Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Button } from "@/components/ui/button";
import { GraduationCap, LayoutDashboard, LogOut } from "lucide-react";

export function SiteHeader() {
  const { user, role, signOut } = useAuth();
  const { lang } = useLang();

  const dashboardPath = role === "admin" ? "/admin/dashboard" : "/student/dashboard";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.28_0.12_268)] to-[oklch(0.42_0.16_276)] text-white shadow-sm transition-shadow group-hover:shadow-md">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight text-foreground">EJU</div>
            <div className="text-[10px] text-muted-foreground hidden sm:block leading-none">
              {lang === "mn" ? "Бүртгэлийн Систем" : "Registration System"}
            </div>
          </div>
        </Link>

        {/* Center nav links */}
        <nav className="hidden md:flex items-center gap-0.5 text-sm">
          {[
            { to: "/" as const, mn: "Нүүр", en: "Home", exact: true },
            { to: "/registration-guide" as const, mn: "Зааварчилгаа", en: "Guide", exact: false },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all text-sm"
              activeOptions={{ exact: item.exact }}
              activeProps={{
                className: "px-3.5 py-1.5 rounded-lg text-foreground font-medium bg-muted/70 text-sm",
              }}
            >
              {lang === "mn" ? item.mn : item.en}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <LangSwitcher />

          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5">
                <Link to={dashboardPath}>
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {lang === "mn" ? "Самбар" : "Dashboard"}
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => void signOut()}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{lang === "mn" ? "Гарах" : "Sign out"}</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">{lang === "mn" ? "Нэвтрэх" : "Sign in"}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-gradient-to-br from-[oklch(0.28_0.12_268)] to-[oklch(0.40_0.15_276)] text-white hover:opacity-90 shadow-sm font-semibold"
              >
                <Link to="/register">{lang === "mn" ? "Бүртгүүлэх" : "Register"}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
