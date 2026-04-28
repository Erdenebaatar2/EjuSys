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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
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

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
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
            <CardTitle className="text-2xl">{t("login")}</CardTitle>
            <CardDescription className="text-bilingual-ja">
              {lang === "mn" ? "Бүртгэлдээ нэвтэрнэ үү" : "Log in to your account"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    {t("forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("login")}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t("noAccount")}{" "}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  {t("register")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
