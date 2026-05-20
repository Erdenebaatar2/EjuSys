import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Loader2,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";

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

const STATUS_MAP: Record<string, { label: string; labelMn: string; color: string }> = {
  pending_payment: { label: "Pending payment", labelMn: "Төлбөр хүлээгдэж байна", color: "bg-amber-100 text-amber-700 border-amber-200" },
  pending: { label: "Under review", labelMn: "Хянагдаж байна", color: "bg-blue-100 text-blue-700 border-blue-200" },
  approved: { label: "Approved", labelMn: "Зөвшөөрөгдсөн", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", labelMn: "Татгалзагдсан", color: "bg-red-100 text-red-700 border-red-200" },
};

function StudentDashboard() {
  const { lang } = useLang();
  const { data, isLoading } = useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: () => apiGet<DashboardData>("/api/student/dashboard"),
  });

  if (isLoading || !data) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusInfo = data.applicationStatus ? STATUS_MAP[data.applicationStatus] : null;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Greeting banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.20_0.08_264)] via-[oklch(0.28_0.12_268)] to-[oklch(0.38_0.16_276)] p-6 md:p-8 text-white shadow-elegant">
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/60 text-xs font-medium mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              {lang === "mn" ? "Тавтай морилоо" : "Welcome back"}
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {lang === "mn"
                ? `Сайн байна уу, ${data.firstName || "Оюутан"}!`
                : `Hello, ${data.firstName || "Student"}!`}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              {lang === "mn"
                ? "EJU бүртгэлийн самбараасаа хянаарай."
                : "Manage your EJU registration from here."}
            </p>
          </div>
          <Button
            asChild
            className="bg-white/15 hover:bg-white/25 border border-white/20 text-white shadow-none shrink-0 transition-all"
          >
            <Link to="/student/application">
              {lang === "mn" ? "Бүртгэлийн маягт" : "Application form"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarDays}
          label={lang === "mn" ? "Нээлттэй шалгалт" : "Open exams"}
          value={data.openExams}
          accent="indigo"
        />
        <StatCard
          icon={FileText}
          label={lang === "mn" ? "Нийт бүртгэл" : "Total applications"}
          value={data.totalApps}
          accent="violet"
        />
        <StatCard
          icon={ClipboardCheck}
          label={lang === "mn" ? "Хүлээгдэж буй" : "Pending"}
          value={data.pendingApps}
          accent="amber"
        />
      </div>

      {/* Active exam card */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {lang === "mn" ? "Идэвхтэй EJU бүртгэл" : "Active EJU registration"}
        </h2>

        {data.activeExam ? (
          <Card className="overflow-hidden border-border shadow-card">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary to-[oklch(0.55_0.18_280)]" />
            <CardContent className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3 min-w-0">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-foreground leading-tight">
                        {data.activeExam.name}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] font-semibold">
                        {data.activeExam.year} · {data.activeExam.session}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                      <span>{data.activeExam.examDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                      <span>{data.activeExam.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                      <span>
                        {data.activeExam.registrationStart} — {data.activeExam.registrationEnd}
                      </span>
                    </div>
                  </div>

                  {/* Application status pill */}
                  {data.hasApplication && statusInfo && (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {lang === "mn" ? statusInfo.labelMn : statusInfo.label}
                      </span>
                      {data.applicationNumber && (
                        <span className="text-xs font-mono text-muted-foreground">
                          {data.applicationNumber}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="shrink-0 flex flex-col gap-2 sm:items-end">
                  <Button asChild className="shadow-soft">
                    <Link to="/student/application">
                      {data.hasApplication
                        ? lang === "mn" ? "Бүртгэл харах" : "View application"
                        : lang === "mn" ? "Бүртгэлийн маягт" : "Open form"}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  {!data.hasApplication && (
                    <p className="text-xs text-muted-foreground text-right">
                      {lang === "mn" ? "Бүртгэлийн хугацаа дуусаагүй" : "Registration is open"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card border-dashed">
            <CardContent className="py-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {lang === "mn"
                  ? "Одоогоор идэвхтэй шалгалт байхгүй байна."
                  : "No active exam registration at the moment."}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/student/exams">
                  {lang === "mn" ? "Бүх шалгалт харах" : "Browse all exams"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          {lang === "mn" ? "Хурдан үйлдлүүд" : "Quick actions"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              to: "/student/application" as const,
              icon: FileText,
              labelMn: "Шалгалтанд бүртгүүлэх",
              labelEn: "Register for exam",
              descMn: "Бүртгэлийн маягт бөглөх",
              descEn: "Fill in the application form",
              color: "text-indigo-600 bg-indigo-50",
            },
            {
              to: "/student/exams" as const,
              icon: CalendarDays,
              labelMn: "Шалгалтуудыг харах",
              labelEn: "Browse exams",
              descMn: "Нээлттэй шалгалтуудын жагсаалт",
              descEn: "View available exam sessions",
              color: "text-violet-600 bg-violet-50",
            },
            {
              to: "/student/profile" as const,
              icon: ClipboardCheck,
              labelMn: "Профайл засах",
              labelEn: "Edit profile",
              descMn: "Хувийн мэдээлэл шинэчлэх",
              descEn: "Update your personal details",
              color: "text-emerald-600 bg-emerald-50",
            },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {lang === "mn" ? action.labelMn : action.labelEn}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                  {lang === "mn" ? action.descMn : action.descEn}
                </p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: "indigo" | "violet" | "amber";
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <Card className="shadow-card overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground leading-tight">{label}</p>
            <p className="mt-1.5 text-3xl font-bold text-foreground tabular-nums">{value}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
