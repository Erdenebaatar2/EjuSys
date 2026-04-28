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

const schema = z
  .object({
    first_name: z.string().min(1, "Заавал"),
    last_name: z.string().min(1, "Заавал"),
    passport_number: z.string().min(3, "Паспорт дугаар богино байна"),
    phone: z.string().optional(),
    email: z.string().email("Имэйл буруу"),
    password: z
      .string()
      .min(8, "Хамгийн багадаа 8 тэмдэгт")
      .regex(/[A-Z]/, "1 том үсэг шаардлагатай")
      .regex(/[0-9]/, "1 тоо шаардлагатай"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Нууц үг тохирохгүй байна",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
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

  async function onSubmit(v: FormValues) {
    setSubmitting(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: v.first_name,
          last_name: v.last_name,
          passport_number: v.passport_number,
          phone: v.phone ?? null,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(lang === "mn" ? "Бүртгүүлэх амжилтгүй" : "Registration failed", {
        description: error.message,
      });
      return;
    }
    toast.success(
      lang === "mn" ? "Бүртгэл амжилттай!" : "Registration successful!",
      {
        description:
          lang === "mn" ? "Имэйлээ шалгана уу" : "Please check your email.",
      },
    );
    void navigate({ to: "/login" });
  }

  const inputCls = "h-11 rounded-xl border-border/60 bg-white/80";

  return (
    <AuthLayout
      title={t("register")}
      subtitle={lang === "mn" ? "Шинэ оюутны бүртгэл" : "Create a new student account"}
    >
      <div className="mb-4 flex justify-end">
        <LangSwitcher />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="last_name">{t("lastName")}</Label>
            <Input id="last_name" className={inputCls} {...register("last_name")} />
            {errors.last_name && (
              <p className="text-xs text-destructive">{errors.last_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="first_name">{t("firstName")}</Label>
            <Input id="first_name" className={inputCls} {...register("first_name")} />
            {errors.first_name && (
              <p className="text-xs text-destructive">{errors.first_name.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="passport_number">{t("passportNumber")}</Label>
          <Input
            id="passport_number"
            className={inputCls}
            {...register("passport_number")}
          />
          {errors.passport_number && (
            <p className="text-xs text-destructive">{errors.passport_number.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input id="phone" className={inputCls} {...register("phone")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" className={inputCls} {...register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("password")}</Label>
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
          <div className="space-y-1.5">
            <Label htmlFor="confirm">{t("confirmPassword")}</Label>
            <Input
              id="confirm"
              type="password"
              className={inputCls}
              {...register("confirm")}
            />
            {errors.confirm && (
              <p className="text-xs text-destructive">{errors.confirm.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-[var(--primary-glow)] text-base font-semibold shadow-[var(--shadow-glow)] transition-all hover:shadow-[0_25px_70px_-15px_oklch(0.55_0.22_255_/_0.5)]"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("register")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("login")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
