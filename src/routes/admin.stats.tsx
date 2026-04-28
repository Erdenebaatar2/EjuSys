import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/admin/stats")({
  head: () => ({ meta: [{ title: "Админ — Тайлан | EJU" }] }),
  component: AdminStats,
});

function AdminStats() {
  const { lang } = useLang();
  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold">
        {lang === "mn" ? "Тайлан, статистик" : "Reports and statistics"}
      </h1>
      <Card className="mt-6 shadow-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Construction className="mx-auto h-10 w-10 mb-3 opacity-50" />
          <p>
            {lang === "mn"
              ? "Үе шат 4-т бэлэн болно (CSV экспорт)"
              : "Planned for phase 4 (CSV export)"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
