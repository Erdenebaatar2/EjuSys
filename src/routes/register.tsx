import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Бүртгүүлэх | EJU" }] }),
  component: RegisterForm,
});
