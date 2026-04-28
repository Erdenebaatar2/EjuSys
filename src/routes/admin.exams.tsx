import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/admin/exams")({
  head: () => ({ meta: [{ title: "Админ — Шалгалтууд | EJU" }] }),
  component: AdminExams,
});

function AdminExams() {
  const { lang } = useLang();
  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold">
        {lang === "mn" ? "Шалгалт удирдах" : "Exam management"}
      </h1>
      <Card className="mt-6 shadow-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Construction className="mx-auto h-10 w-10 mb-3 opacity-50" />
          <p>{lang === "mn" ? "Үе шат 3-д бэлэн болно" : "Planned for phase 3"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
