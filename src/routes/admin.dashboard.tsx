import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Clock, CheckCircle2, XCircle, BookOpen } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Админ — Хяналтын самбар | EJU" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { lang } = useLang();
  const [stats, setStats] = useState({
    students: 0, exams: 0, total: 0, pending: 0, approved: 0, rejected: 0,
  });

  useEffect(() => {
    void (async () => {
      const [students, exams, total, pending, approved, rejected] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("exams").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      ]);
      setStats({
        students: students.count ?? 0,
        exams: exams.count ?? 0,
        total: total.count ?? 0,
        pending: pending.count ?? 0,
        approved: approved.count ?? 0,
        rejected: rejected.count ?? 0,
      });
    })();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">{lang === "mn" ? "Хяналтын самбар" : "ダッシュボード"}</h1>
        <p className="mt-1 text-muted-foreground text-bilingual-ja">
          {lang === "mn" ? "Системийн ерөнхий статистик" : "システム全体の統計"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label={lang === "mn" ? "Нийт оюутан" : "学生数"} value={stats.students} tone="primary" />
        <StatCard icon={BookOpen} label={lang === "mn" ? "Шалгалт" : "試験"} value={stats.exams} tone="primary" />
        <StatCard icon={FileText} label={lang === "mn" ? "Нийт бүртгэл" : "出願総数"} value={stats.total} tone="primary" />
        <StatCard icon={Clock} label={lang === "mn" ? "Хүлээгдэж буй" : "審査中"} value={stats.pending} tone="warning" />
        <StatCard icon={CheckCircle2} label={lang === "mn" ? "Зөвшөөрсөн" : "承認済み"} value={stats.approved} tone="success" />
        <StatCard icon={XCircle} label={lang === "mn" ? "Татгалзсан" : "却下"} value={stats.rejected} tone="destructive" />
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle>{lang === "mn" ? "Хурдан үйлдэл" : "クイックアクション"}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {lang === "mn"
              ? "Зүүн талын цэснээс шалгалт үүсгэх, бүртгэл хянах, оюутан удирдах боломжтой."
              : "左側のメニューから試験作成、出願管理、学生管理ができます。"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "primary" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number;
  tone?: "primary" | "warning" | "success" | "destructive";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <Card className="shadow-card">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-3xl font-bold">{value}</div>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneCls}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
