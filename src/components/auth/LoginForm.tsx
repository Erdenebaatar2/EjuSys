import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/contexts/LangContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { AuthLayout } from "@/components/AuthLayout";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setSubmitting(false);
    if (error) {
      toast.error(lang === "mn" ? "Нэвтрэх амжилтгүй" : "Login failed", {
        description: error.message,
      });
      return;
    }
    toast.success(lang === "mn" ? "Тавтай морил!" : "Welcome back!");
    void navigate({ to: "/" });
  }

  const inputCls = "h-11 rounded-xl border-border/60 bg-white/80";

  return (
    <AuthLayout
      title={t("login")}
      subtitle={lang === "mn" ? "Бүртгэлдээ нэвтэрнэ үү" : "Log in to your account"}
    >
      <div className="mb-4 flex justify-end">
        <LangSwitcher />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" className={inputCls} {...register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            className={inputCls}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-[var(--primary-glow)] text-base font-semibold shadow-[var(--shadow-glow)] transition-all hover:shadow-[0_25px_70px_-15px_oklch(0.55_0.22_255_/_0.5)]"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("login")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t("register")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
