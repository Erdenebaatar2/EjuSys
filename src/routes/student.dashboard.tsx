import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, FileText, Clock } from "lucide-react";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({ meta: [{ title: "Хяналтын самбар | EJU" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [stats, setStats] = useState({ apps: 0, openExams: 0, pending: 0 });
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    void (async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle();
      if (profile) setFirstName(profile.first_name);

      const today = new Date().toISOString().slice(0, 10);
      const [apps, openExams, pending] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("exams").select("id", { count: "exact", head: true }).eq("is_active", true).gte("registration_end", today),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
      ]);
      setStats({
        apps: apps.count ?? 0,
        openExams: openExams.count ?? 0,
        pending: pending.count ?? 0,
      });
    })();
  }, [user]);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">
          {lang === "mn" ? `Сайн байна уу, ${firstName || "оюутан"}!` : `こんにちは、${firstName || "学生"}さん！`}
        </h1>
        <p className="mt-1 text-muted-foreground text-bilingual-ja">
          {lang === "mn" ? "EJU бүртгэлийн системд тавтай морил" : "EJU出願システムへようこそ"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label={lang === "mn" ? "Нээлттэй шалгалт" : "受付中の試験"} value={stats.openExams} />
        <StatCard icon={FileText} label={lang === "mn" ? "Миний бүртгэл" : "マイ出願"} value={stats.apps} />
        <StatCard icon={Clock} label={lang === "mn" ? "Хүлээгдэж буй" : "審査中"} value={stats.pending} />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{lang === "mn" ? "Дараагийн алхам" : "次のステップ"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {lang === "mn"
              ? "Нээлттэй шалгалтыг үзэж, өөрт тохирохыг сонгож бүртгүүлээрэй."
              : "受付中の試験を確認し、出願してください。"}
          </p>
          <Button asChild>
            <Link to="/student/exams">
              {lang === "mn" ? "Шалгалт харах" : "試験を見る"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card className="shadow-card">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-3xl font-bold">{value}</div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
