import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { AuthLayout } from "@/components/AuthLayout";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Зөв имэйл оруулна уу"),
  password: z.string().min(1, "Нууц үг оруулна уу"),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const { t, lang } = useLang();
  const { login, role } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (role === "admin") void navigate({ to: "/admin/dashboard" });
    else if (role === "student") void navigate({ to: "/student/dashboard" });
  }, [role]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const result = await login(values.email, values.password);
    setSubmitting(false);
    if (result.error) {
      toast.error(lang === "mn" ? "Нэвтрэх амжилтгүй" : "Login failed", {
        description: result.error,
      });
    }
  }

  const inputCls = "h-11 rounded-xl border-border/60 bg-white/80";

  return (
    <AuthLayout
      title={t("login")}
      subtitle={lang === "mn" ? "Бүртгэлдээ нэвтэрнэ үү" : "Log in to your account"}
    >
      <div className="mb-4 flex justify-end"><LangSwitcher /></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" className={inputCls} {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>
          <Input id="password" type="password" className={inputCls} {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={submitting}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-900 to-blue-500 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:from-blue-800 hover:to-blue-400 disabled:opacity-60">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("login")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">{t("register")}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}