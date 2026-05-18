import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, ClipboardCheck, FileText, Loader2 } from "lucide-react";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({ meta: [{ title: "Student dashboard | EjuSys" }] }),
  component: StudentDashboard,
});

interface DashboardData {
  firstName: string;
  totalApps: number;
  pendingApps: number;
  approvedApps: number;
  openExams: number;
  hasApplication: boolean;
  applicationStatus?: string | null;
  applicationNumber?: string | null;
  activeExam?: {
    id: string;
    name: string;
    year: number;
    session: string;
    examDate: string;
    registrationStart: string;
    registrationEnd: string;
    location: string;
  };
}

function StudentDashboard() {
  const { lang } = useLang();
  const { data, isLoading } = useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: () => apiGet<DashboardData>("/api/student/dashboard"),
  });

  if (isLoading || !data) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">
          {lang === "mn"
            ? `Сайн байна уу, ${data.firstName || "оюутан"}!`
            : `Hello, ${data.firstName || "student"}!`}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarDays}
          label={lang === "mn" ? "Нээлттэй шалгалт" : "Open exam"}
          value={data.openExams}
        />
        <StatCard
          icon={FileText}
          label={lang === "mn" ? "Нийт бүртгэл" : "Applications"}
          value={data.totalApps}
        />
        <StatCard
          icon={ClipboardCheck}
          label={lang === "mn" ? "Хүлээгдэж буй" : "Pending"}
          value={data.pendingApps}
        />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>
            {lang === "mn" ? "Идэвхтэй EJU бүртгэл" : "Active EJU registration"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.activeExam ? (
            <>
              <div className="text-sm text-muted-foreground">
                {data.activeExam.name} · {data.activeExam.year} · {data.activeExam.session}
              </div>
              <div className="text-sm text-muted-foreground">
                {data.activeExam.registrationStart} — {data.activeExam.registrationEnd}
              </div>
              {data.hasApplication ? (
                <p className="text-sm">
                  {data.applicationNumber} ·{" "}
                  <span className="uppercase">{data.applicationStatus}</span>
                </p>
              ) : null}
              <Button asChild>
                <Link to="/student/application">
                  {lang === "mn" ? "Бүртгэлийн маягт нээх" : "Open application form"}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {lang === "mn" ? "Одоогоор идэвхтэй шалгалт алга." : "No active exam currently."}
            </p>
          )}
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
