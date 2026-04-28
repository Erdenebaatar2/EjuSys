import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LayoutDashboard, BookOpen, FileText, Users, BarChart3 } from "lucide-react";

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
        { to: "/admin/exams", labelMn: "Шалгалтууд", labelJa: "Exams", icon: BookOpen },
        {
          to: "/admin/applications",
          labelMn: "Бүртгэлүүд",
          labelJa: "Applications",
          icon: FileText,
        },
        { to: "/admin/students", labelMn: "Оюутнууд", labelJa: "Students", icon: Users },
        { to: "/admin/stats", labelMn: "Тайлан", labelJa: "Reports", icon: BarChart3 },
      ]}
    />
  );
}
