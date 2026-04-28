import { Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export function SiteHeader() {
  const { user, role, signOut } = useAuth();
  const { t } = useLang();

  const dashboardPath = role === "admin" ? "/admin/dashboard" : "/student/dashboard";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-hero text-primary-foreground shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">EJU</div>
            <div className="text-[10px] text-muted-foreground">
              Examination for Japanese University Admission
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground font-medium" }}
          >
            {t("appName")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to={dashboardPath}>{t("dashboard")}</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                {t("logout")}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t("login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">{t("register")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
