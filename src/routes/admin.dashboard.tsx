import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { AdminMetricCard, AdminPageHeader, AdminPanel } from "@/components/admin/AdminPage";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { BookOpen, Clock3, LayoutDashboard, Loader2, Radio, Users } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Админ - Хяналтын самбар | EJU" }] }),
  component: AdminDashboard,
});

interface DashboardStats {
  totalUsers: number;
  activeExams: number;
  totalUsersAll?: number;
  recentApplications: RecentApplication[];
}

interface RecentApplication {
  id: string;
  applicationNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  studentName?: string;
  studentEmail?: string;
}

function AdminDashboard() {
  const { lang } = useLang();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiGet<DashboardStats>("/api/admin/dashboard"),
    refetchInterval: 3000,
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminPageHeader
        icon={LayoutDashboard}
        eyebrow={lang === "mn" ? "EJU админ" : "EJU admin"}
        title={lang === "mn" ? "Хяналтын самбар" : "Dashboard"}
        description={
          lang === "mn"
            ? "Бүртгэл, шалгалтын хамгийн чухал мэдээллээ нэг дороос хянах хэсэг."
            : "A clean overview of registrations and exams."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <AdminPanel
        title={lang === "mn" ? "Шинэ бүртгүүлэгчид" : "Live registrations"}
        description={
          lang === "mn"
            ? "Шинээр бүртгүүлсэн оюутан дээд талд нэмэгдэнэ."
            : "Newest applications appear at the top automatically."
        }
        actions={
          <Badge
            variant="outline"
            className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            <Radio className="h-3.5 w-3.5" />
            {lang === "mn" ? "Live" : "Live"}
          </Badge>
        }
      >
        {data.recentApplications.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {lang === "mn" ? "Одоогоор бүртгэл алга." : "No applications yet."}
          </div>
        ) : (
          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {data.recentApplications.map((application, index) => (
              <div
                key={application.id}
                className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3 shadow-sm transition-colors hover:bg-primary/5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-foreground">
                        {application.studentName ||
                          (lang === "mn" ? "Нэргүй оюутан" : "Unnamed student")}
                      </span>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                        {application.applicationNumber}
                      </code>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{application.studentEmail || "-"}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {formatRelativeTime(application.createdAt, lang)}
                      </span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={application.paymentStatus} />
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function formatRelativeTime(value: string, lang: "mn" | "en") {
  const created = new Date(value).getTime();
  if (Number.isNaN(created)) return value;
  const seconds = Math.max(0, Math.floor((Date.now() - created) / 1000));
  if (seconds < 60) return lang === "mn" ? "саяхан" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return lang === "mn" ? `${minutes} минутын өмнө` : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === "mn" ? `${hours} цагийн өмнө` : `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return lang === "mn" ? `${days} өдрийн өмнө` : `${days} days ago`;
}
