import { Link } from "@tanstack/react-router";
import { GraduationCap, ExternalLink } from "lucide-react";

const LINKS = {
  product: [
    { href: "/registration-guide", label: "Бүртгэлийн зааварчилгаа" },
    { href: "/register", label: "Бүртгүүлэх" },
    { href: "/login", label: "Нэвтрэх" },
  ],
  resources: [
    { href: "https://www.studyinjapan.go.jp/en/", label: "Study in Japan", external: true },
    { href: "https://www.jasso.go.jp/en/", label: "JASSO", external: true },
    { href: "/files/EJU_Bulletin_2026.pdf", label: "EJU Bulletin 2026", external: false },
  ],
};

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.28_0.12_268)] to-[oklch(0.42_0.16_276)] text-white shadow-sm transition-shadow group-hover:shadow-md">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-foreground">EJU Бүртгэлийн Систем</div>
                <div className="text-[10px] text-muted-foreground">
                  Examination for Japanese University Admission
                </div>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Монгол оюутнуудад зориулсан EJU шалгалтын онлайн бүртгэлийн систем. Шалгалт сонгож,
              баримтаа байршуулж, статусаа хянаарай.
            </p>
            <p className="mt-3 text-xs text-muted-foreground/50 font-mono">
              日本留学試験出願システム
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Систем
            </h4>
            <ul className="space-y-2.5">
              {LINKS.product.map((l) => (
                <li key={l.href}>
                  <Link
                    to={l.href as "/"}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Холбоос
            </h4>
            <ul className="space-y-2.5">
              {LINKS.resources.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
                    >
                      {l.label}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  ) : (
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} EJU Бүртгэлийн Систем. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <p className="text-xs text-muted-foreground/40">
            Spring Boot + TanStack Start
          </p>
        </div>
      </div>
    </footer>
  );
}
