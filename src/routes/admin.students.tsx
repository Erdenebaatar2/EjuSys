import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Админ — Оюутнууд | EJU" }] }),
  component: AdminStudents,
});

function AdminStudents() {
  const { lang } = useLang();
  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold">{lang === "mn" ? "Оюутны жагсаалт" : "学生一覧"}</h1>
      <Card className="mt-6 shadow-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Construction className="mx-auto h-10 w-10 mb-3 opacity-50" />
          <p>{lang === "mn" ? "Үе шат 3-д бэлэн болно" : "フェーズ3で実装予定"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
