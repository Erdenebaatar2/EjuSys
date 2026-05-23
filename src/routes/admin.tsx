import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BarChart3, BookOpen, FileText, LayoutDashboard, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <DashboardLayout
      requireRole="admin"
      navItems={[
        {
          to: "/admin/dashboard",
          labelMn: "Хяналтын самбар",
          labelJa: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          to: "/admin/exams",
          labelMn: "Шалгалтууд",
          labelJa: "Exams",
          icon: BookOpen,
        },
        {
          to: "/admin/applications",
          labelMn: "Бүртгэлүүд",
          labelJa: "Applications",
          icon: FileText,
        },
        {
          to: "/admin/requests",
          labelMn: "Хүсэлтүүд",
          labelJa: "Requests",
          icon: MessageSquare,
        },
        {
          to: "/admin/stats",
          labelMn: "Тайлан",
          labelJa: "Reports",
          icon: BarChart3,
        },
      ]}
    />
  );
}
