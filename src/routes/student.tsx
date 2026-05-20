import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarSearch, FileText, User } from "lucide-react";

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});

function StudentLayout() {
  return (
    <DashboardLayout
      requireRole="student"
      navItems={[
        {
          to: "/student/dashboard",
          labelMn: "Хяналтын самбар",
          labelJa: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          to: "/student/exams",
          labelMn: "Шалгалтууд",
          labelJa: "Exams",
          icon: CalendarSearch,
        },
        {
          to: "/student/application",
          labelMn: "Шалгалтанд бүртгүүлэх",
          labelJa: "Register for exam",
          icon: FileText,
          highlight: true,
        },
        { to: "/student/profile", labelMn: "Профайл", labelJa: "Profile", icon: User },
      ]}
    />
  );
}
