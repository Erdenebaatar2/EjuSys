import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Clock, CheckCircle2, XCircle, BookOpen, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Админ — Хяналтын самбар | EJU" }] }),
  component: AdminDashboard,
});

interface RecentApplication {
  id: string;
  applicationNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  studentName?: string;
  studentEmail?: string;
}

interface DashboardStats {
  totalUsers: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  activeExams: number;
  recentApplications: RecentApplication[];
}

function AdminDashboard() {
  const { lang } = useLang();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiGet<DashboardStats>("/api/admin/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <p className="text-destructive">
        {lang === "mn" ? "Алдаа: " : "Error: "}
        {(error as Error)?.message ?? "—"}
      </p>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">{lang === "mn" ? "Хяналтын самбар" : "Dashboard"}</h1>
        <p className="mt-1 text-muted-foreground">
          {lang === "mn" ? "Системийн ерөнхий статистик" : "High-level system statistics"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label={lang === "mn" ? "Нийт оюутан" : "Students"} value={data.totalUsers} tone="primary" />
        <StatCard icon={BookOpen} label={lang === "mn" ? "Идэвхтэй шалгалт" : "Active exams"} value={data.activeExams} tone="primary" />
        <StatCard
          icon={FileText}
          label={lang === "mn" ? "Нийт бүртгэл" : "Applications"}
          value={data.pendingApplications + data.approvedApplications + data.rejectedApplications}
          tone="primary"
        />
        <StatCard icon={Clock} label={lang === "mn" ? "Хүлээгдэж буй" : "Pending"} value={data.pendingApplications} tone="warning" />
        <StatCard icon={CheckCircle2} label={lang === "mn" ? "Зөвшөөрсөн" : "Approved"} value={data.approvedApplications} tone="success" />
        <StatCard icon={XCircle} label={lang === "mn" ? "Татгалзсан" : "Rejected"} value={data.rejectedApplications} tone="destructive" />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{lang === "mn" ? "Сүүлийн 5 бүртгэл" : "Recent 5 applications"}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentApplications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {lang === "mn" ? "Бүртгэл алга" : "No applications yet"}
            </p>
          ) : (
            <div className="space-y-2">
              {data.recentApplications.map((a) => (
                <Link
                  key={a.id}
                  to="/admin/applications"
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{a.applicationNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.studentName ?? "—"} · {a.studentEmail ?? ""}
                    </div>
                  </div>
                  <StatusBadge status={a.status as "pending" | "approved" | "rejected"} />
                </Link>
              ))}
            </div>
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
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
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
