import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/student/exams")({
  head: () => ({ meta: [{ title: "Шалгалтууд | EJU" }] }),
  component: StudentExams,
});

function StudentExams() {
  const { lang } = useLang();
  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold">{lang === "mn" ? "Шалгалтууд" : "試験"}</h1>
      <p className="mt-1 text-muted-foreground text-bilingual-ja">
        {lang === "mn" ? "Нээлттэй EJU шалгалтууд" : "受付中のEJU試験"}
      </p>
      <Card className="mt-6 shadow-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Construction className="mx-auto h-10 w-10 mb-3 opacity-50" />
          <p>{lang === "mn" ? "Дараагийн үе шатанд бэлэн болно" : "次のフェーズで実装予定"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
