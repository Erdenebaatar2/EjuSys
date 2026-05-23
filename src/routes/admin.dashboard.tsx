import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { AdminMetricCard, AdminPageHeader } from "@/components/admin/AdminPage";
import { BookOpen, LayoutDashboard, Loader2, Users } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Админ - Хяналтын самбар | EJU" }] }),
  component: AdminDashboard,
});

interface DashboardStats {
  totalUsers: number;
  activeExams: number;
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
    </div>
  );
}
