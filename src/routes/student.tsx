import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LayoutDashboard, CalendarSearch, User } from "lucide-react";

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
          labelMn: "Идэвхтэй Шалгалтууд",
          labelJa: "Active Exams",
          icon: CalendarSearch,
          highlight: true,
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
