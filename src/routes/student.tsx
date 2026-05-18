import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, User } from "lucide-react";

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
          to: "/student/application",
          labelMn: "Бүртгэлийн маягт",
          labelJa: "Application form",
          icon: FileText,
        },
        { to: "/student/profile", labelMn: "Профайл", labelJa: "Profile", icon: User },
      ]}
    />
  );
}
