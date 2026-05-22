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
          labelMn: "Шалгалтын мэдээлэл",
          labelJa: "Exam information",
          icon: CalendarSearch,
        },
        {
          to: "/student/applications",
          labelMn: "Миний бүртгэл",
          labelJa: "My application",
          icon: FileText,
        },
        {
          to: "/student/profile",
          labelMn: "Профайл",
          labelJa: "Profile",
          icon: User,
        },
      ]}
    />
  );
}
