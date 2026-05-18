import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, FileText, Clock } from "lucide-react";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({ meta: [{ title: "Хяналтын самбар | EJU" }] }),
  component: StudentDashboard,
});

interface DashboardData {
  firstName: string;
  totalApps: number;
  pendingApps: number;
  approvedApps: number;
  openExams: number;
}

function StudentDashboard() {
  const { lang } = useLang();
  const [data, setData] = useState<DashboardData>({
    firstName: "",
    totalApps: 0,
    pendingApps: 0,
    approvedApps: 0,
    openExams: 0,
  });

  useEffect(() => {
    void apiGet<DashboardData>("/api/student/dashboard").then(setData).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">
          {lang === "mn"
            ? `Сайн байна уу, ${data.firstName || "оюутан"}!`
            : `Hello, ${data.firstName || "student"}!`}
        </h1>
        <p className="mt-1 text-muted-foreground text-bilingual-ja">
          {lang === "mn"
            ? "EJU бүртгэлийн системд тавтай морил"
            : "Welcome to the EJU registration system"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label={lang === "mn" ? "Нээлттэй шалгалт" : "Open exams"}
          value={data.openExams}
        />
        <StatCard
          icon={FileText}
          label={lang === "mn" ? "Миний бүртгэл" : "My applications"}
          value={data.totalApps}
        />
        <StatCard
          icon={Clock}
          label={lang === "mn" ? "Хүлээгдэж буй" : "Pending"}
          value={data.pendingApps}
        />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{lang === "mn" ? "Дараагийн алхам" : "Next step"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {lang === "mn"
              ? "Нээлттэй шалгалтыг үзэж, өөрт тохирохыг сонгож бүртгүүлээрэй."
              : "Review the open exams and submit an application that fits you."}
          </p>
          <Button asChild>
            <Link to="/student/exams">
              {lang === "mn" ? "Шалгалт харах" : "View exams"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
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
