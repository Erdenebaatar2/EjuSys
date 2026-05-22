import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/students")({
  component: AdminStudentsRedirect,
});

function AdminStudentsRedirect() {
  return <Navigate to="/admin/applications" replace />;
}
