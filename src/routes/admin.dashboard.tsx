import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock3, FileText, LayoutDashboard, Loader2, Users } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Админ - Хяналтын самбар | EJU" }] }),
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
        {(error as Error)?.message ?? "-"}
      </p>
    );
  }

  const pendingRecent = data.recentApplications.filter((item) => item.status === "pending").length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminPageHeader
        icon={LayoutDashboard}
        eyebrow={lang === "mn" ? "EJU админ" : "EJU admin"}
        title={lang === "mn" ? "Хяналтын самбар" : "Dashboard"}
        description={
          lang === "mn"
            ? "Бүртгэл, шалгалт, төлөвийн хамгийн чухал мэдээллээ нэг дороос хянах хэсэг."
            : "A clean overview of registrations, exams, and recent activity."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          icon={Users}
          label={lang === "mn" ? "Бүртгүүлсэн оюутан" : "Registered students"}
          value={data.totalUsers}
          helper={lang === "mn" ? "Системд бүртгэлтэй хэрэглэгчид" : "Users in the system"}
          tone="blue"
        />
        <AdminMetricCard
          icon={BookOpen}
          label={lang === "mn" ? "Идэвхтэй шалгалт" : "Active exams"}
          value={data.activeExams}
          helper={lang === "mn" ? "Одоогоор нээлттэй шалгалтууд" : "Currently open exams"}
          tone="teal"
        />
        <AdminMetricCard
          icon={FileText}
          label={lang === "mn" ? "Сүүлийн бүртгэл" : "Recent applications"}
          value={data.recentApplications.length}
          helper={lang === "mn" ? "Хамгийн сүүлийн 5 бичлэг" : "Latest 5 records"}
          tone="emerald"
        />
        <AdminMetricCard
          icon={Clock3}
          label={lang === "mn" ? "Хүлээгдэж буй" : "Pending review"}
          value={pendingRecent}
          helper={lang === "mn" ? "Сүүлийн бүртгэлүүд дундаас" : "From recent activity"}
          tone="amber"
        />
      </div>

      <AdminPanel
        title={lang === "mn" ? "Сүүлийн бүртгэлүүд" : "Recent applications"}
        description={
          lang === "mn"
            ? "Шинээр ирсэн бүртгэлүүдийн төлөв, төлбөрийн мэдээлэл."
            : "Latest applications with review and payment status."
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/applications">{lang === "mn" ? "Бүгдийг харах" : "View all"}</Link>
          </Button>
        }
        contentClassName="p-0"
      >
        {data.recentApplications.length === 0 ? (
          <div className="p-5">
            <AdminEmptyState>
              {lang === "mn" ? "Одоогоор бүртгэл алга." : "No applications yet."}
            </AdminEmptyState>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {data.recentApplications.map((application) => (
              <Link
                key={application.id}
                to="/admin/applications"
                className="grid gap-3 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {application.applicationNumber}
                    </span>
                    <StatusBadge status={application.status} />
                    <StatusBadge status={application.paymentStatus} />
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">
                    {application.studentName ?? "-"} · {application.studentEmail ?? ""}
                  </div>
                </div>
                <div className="text-left text-xs text-muted-foreground md:text-right">
                  {formatAdminDate(application.createdAt, lang)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function formatAdminDate(value: string, lang: "mn" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(lang === "mn" ? "mn-MN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
