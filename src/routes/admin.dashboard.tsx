import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Loader2,
  Search,
} from "lucide-react";
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

interface DashboardApplication {
  id: string;
  applicationNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  profile?: {
    firstName: string;
    lastName: string;
    email: string;
    passportNumber: string;
  };
  exam?: {
    name: string;
    location: string;
    examDate: string;
  };
}

interface DashboardApplicationResponse {
  items: DashboardApplication[];
  total: number;
  page: number;
  size: number;
}

function AdminDashboard() {
  const { lang } = useLang();
  const [searchTerm, setSearchTerm] = useState("");
  const [queryText, setQueryText] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiGet<DashboardStats>("/api/admin/dashboard"),
  });
  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["admin", "dashboard", "applications", queryText, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (queryText) params.set("search", queryText);
      params.set("page", String(page));
      params.set("size", "12");
      return apiGet<DashboardApplicationResponse>(`/api/admin/applications?${params.toString()}`);
    },
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
        <StatCard
          icon={Users}
          label={lang === "mn" ? "Нийт оюутан" : "Students"}
          value={data.totalUsers}
          tone="primary"
        />
        <StatCard
          icon={BookOpen}
          label={lang === "mn" ? "Идэвхтэй шалгалт" : "Active exams"}
          value={data.activeExams}
          tone="primary"
        />
        <StatCard
          icon={FileText}
          label={lang === "mn" ? "Нийт бүртгэл" : "Applications"}
          value={data.pendingApplications + data.approvedApplications + data.rejectedApplications}
          tone="primary"
        />
        <StatCard
          icon={Clock}
          label={lang === "mn" ? "Хүлээгдэж буй" : "Pending"}
          value={data.pendingApplications}
          tone="warning"
        />
        <StatCard
          icon={CheckCircle2}
          label={lang === "mn" ? "Зөвшөөрсөн" : "Approved"}
          value={data.approvedApplications}
          tone="success"
        />
        <StatCard
          icon={XCircle}
          label={lang === "mn" ? "Татгалзсан" : "Rejected"}
          value={data.rejectedApplications}
          tone="destructive"
        />
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

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{lang === "mn" ? "Бүртгүүлэгч хайлт" : "Applicant search"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[260px]">
              <Label>{lang === "mn" ? "Хайлт" : "Search"}</Label>
              <Input
                placeholder={
                  lang === "mn"
                    ? "Нэр, овог, ID, паспорт, шалгалтын нэр..."
                    : "Name, surname, ID, passport, exam name..."
                }
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setQueryText(searchTerm.trim());
                    setPage(0);
                  }
                }}
              />
            </div>
            <Button
              onClick={() => {
                setQueryText(searchTerm.trim());
                setPage(0);
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              {lang === "mn" ? "Хайх" : "Search"}
            </Button>
          </div>

          {appsLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {(applications?.items ?? []).map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono text-xs">{item.applicationNumber}</div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status as "pending" | "approved" | "rejected"} />
                      <Badge variant="outline">{item.paymentStatus}</Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    {(item.profile?.lastName ?? "") + " " + (item.profile?.firstName ?? "")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.profile?.email} · {item.profile?.passportNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.exam?.name} · {item.exam?.location} · {item.exam?.examDate}
                  </div>
                </div>
              ))}
              {(applications?.items ?? []).length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {lang === "mn" ? "Хайлтад тохирох бүртгэл алга" : "No applicants found"}
                </div>
              )}
            </div>
          )}

          {applications && applications.total > applications.size && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {lang === "mn" ? "Нийт" : "Total"}: {applications.total}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={applications.page === 0}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                >
                  {lang === "mn" ? "Өмнөх" : "Prev"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={(applications.page + 1) * applications.size >= applications.total}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  {lang === "mn" ? "Дараах" : "Next"}
                </Button>
              </div>
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
