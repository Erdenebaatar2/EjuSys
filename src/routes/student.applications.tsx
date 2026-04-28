import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/eju-format";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/student/applications")({
  head: () => ({ meta: [{ title: "Миний бүртгэл | EJU" }] }),
  component: StudentApplications,
});

function StudentApplications() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("applications")
        .select("id, application_number, status, payment_status, created_at, exam_id, exams(name, exam_date, location)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setApps(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{lang === "mn" ? "Миний бүртгэл" : "マイ出願"}</h1>
          <p className="mt-1 text-muted-foreground text-bilingual-ja">
            {lang === "mn" ? "Та илгээсэн бүх бүртгэл" : "提出した出願一覧"}
          </p>
        </div>
        <Button asChild>
          <Link to="/student/exams"><Plus className="mr-1.5 h-4 w-4" /> {lang === "mn" ? "Шинэ бүртгэл" : "新規出願"}</Link>
        </Button>
      </div>

      {apps.length === 0 ? (
        <Card className="mt-6 shadow-card">
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <p>{lang === "mn" ? "Танд бүртгэл алга" : "出願がありません"}</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/student/exams">{lang === "mn" ? "Шалгалт сонгох" : "試験を選ぶ"}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {apps.map((a) => (
            <Card key={a.id} className="shadow-card hover:shadow-elegant transition-shadow">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{a.application_number}</code>
                      <StatusBadge status={a.status} />
                      <StatusBadge status={a.payment_status} />
                    </div>
                    <h3 className="mt-2 font-semibold">{a.exams?.name}</h3>
                    <div className="text-xs text-muted-foreground mt-1">
                      {a.exams?.exam_date && formatDate(a.exams.exam_date, lang)} · {a.exams?.location}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/student/applications/$id" params={{ id: a.id }}>
                      {lang === "mn" ? "Харах" : "表示"} <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
