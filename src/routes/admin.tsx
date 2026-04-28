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
        { to: "/admin/dashboard", labelMn: "Хяналтын самбар", labelJa: "ダッシュボード", icon: LayoutDashboard },
        { to: "/admin/exams", labelMn: "Шалгалтууд", labelJa: "試験", icon: BookOpen },
        { to: "/admin/applications", labelMn: "Бүртгэлүүд", labelJa: "出願", icon: FileText },
        { to: "/admin/students", labelMn: "Оюутнууд", labelJa: "学生", icon: Users },
        { to: "/admin/stats", labelMn: "Тайлан", labelJa: "統計", icon: BarChart3 },
      ]}
    />
  );
}
