import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LayoutDashboard, BookOpen, FileText, User } from "lucide-react";

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});

function StudentLayout() {
  return (
    <DashboardLayout
      requireRole="student"
      navItems={[
        { to: "/student/dashboard", labelMn: "Хяналтын самбар", labelJa: "ダッシュボード", icon: LayoutDashboard },
        { to: "/student/exams", labelMn: "Шалгалтууд", labelJa: "試験", icon: BookOpen },
        { to: "/student/applications", labelMn: "Миний бүртгэл", labelJa: "マイ出願", icon: FileText },
        { to: "/student/profile", labelMn: "Профайл", labelJa: "プロフィール", icon: User },
      ]}
    />
  );
}
