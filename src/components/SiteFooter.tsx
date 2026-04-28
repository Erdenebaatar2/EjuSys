export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto flex flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          © {new Date().getFullYear()} EJU Бүртгэлийн Систем · 日本留学試験出願システム
        </div>
        <div className="text-xs">
          ШУТИС МХТС
        </div>
      </div>
    </footer>
  );
}
