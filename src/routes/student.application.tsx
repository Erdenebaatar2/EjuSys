import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/student/application")({
  head: () => ({ meta: [{ title: "EJU application | EjuSys" }] }),
  component: StudentApplicationRedirect,
});

function StudentApplicationRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/student/exams", replace: true });
  }, [navigate]);

  return null;
}
