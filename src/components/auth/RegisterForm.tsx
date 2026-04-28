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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { toast } from "sonner";

const schema = z.object({
  first_name: z.string().min(1, "Заавал"),
  last_name: z.string().min(1, "Заавал"),
  passport_number: z.string().min(3, "Паспорт дугаар богино байна"),
  phone: z.string().optional(),
  email: z.string().email("Имэйл буруу"),
  password: z.string()
    .min(8, "Хамгийн багадаа 8 тэмдэгт")
    .regex(/[A-Z]/, "1 том үсэг шаардлагатай")
    .regex(/[0-9]/, "1 тоо шаардлагатай"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Нууц үг тохирохгүй байна",
  path: ["confirm"],
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
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
      toast.error(lang === "mn" ? "Бүртгүүлэх амжилтгүй" : "登録失敗", { description: error.message });
      return;
    }
    toast.success(lang === "mn" ? "Бүртгэл амжилттай!" : "登録完了！", {
      description: lang === "mn" ? "Имэйлээ шалгана уу" : "メールをご確認ください",
    });
    void navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-hero text-primary-foreground shadow-soft">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold">EJU</span>
          </Link>
          <LangSwitcher />
        </div>
        <Card className="shadow-elegant border-border">
          <CardHeader>
            <CardTitle className="text-2xl">{t("register")}</CardTitle>
            <CardDescription className="text-bilingual-ja">
              {lang === "mn" ? "Шинэ оюутны бүртгэл" : "新規学生アカウント作成"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">{t("lastName")}</Label>
                  <Input id="last_name" {...register("last_name")} />
                  {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">{t("firstName")}</Label>
                  <Input id="first_name" {...register("first_name")} />
                  {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="passport_number">{t("passportNumber")}</Label>
                <Input id="passport_number" {...register("passport_number")} />
                {errors.passport_number && <p className="text-xs text-destructive">{errors.passport_number.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input id="phone" type="tel" {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">{t("confirmPassword")}</Label>
                  <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
                  {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("register")}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t("hasAccount")}{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  {t("login")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
