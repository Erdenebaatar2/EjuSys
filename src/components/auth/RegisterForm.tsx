import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLang } from "@/contexts/LangContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { AuthLayout } from "@/components/AuthLayout";
import { toast } from "sonner";

const schema = z
  .object({
    first_name: z.string().min(1, "Нэр заавал оруулна уу"),
    last_name: z.string().min(1, "Овог заавал оруулна уу"),
    passport_number: z.string().min(3, "Бичиг баримтын дугаар заавал оруулна уу"),
    phone: z.string().min(4, "Утасны дугаар заавал оруулна уу"),
    address: z.string().min(4, "Оршин суугаа хаяг заавал оруулна уу"),
    email: z.string().email("Имэйл буруу байна"),
    password: z
      .string()
      .min(8, "Хамгийн багадаа 8 тэмдэгт байх ёстой")
      .regex(/[A-Z]/, "Дор хаяж 1 том үсэг шаардлагатай")
      .regex(/[0-9]/, "Дор хаяж 1 тоо шаардлагатай"),
    confirm: z.string(),
    information_confirmed: z.boolean().refine((value) => value, {
      message: "Санамжийг зөвшөөрнө үү",
    }),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Нууц үг тохирохгүй байна",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { information_confirmed: false },
  });
  const informationConfirmed = watch("information_confirmed");
  const text = labels(lang);

  async function onSubmit(v: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: v.email,
          password: v.password,
          firstName: v.first_name,
          lastName: v.last_name,
          passportNumber: v.passport_number,
          phone: v.phone,
          address: v.address,
          informationConfirmed: v.information_confirmed,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(text.registrationFailed, {
          description: body.message ?? text.genericError,
        });
        setSubmitting(false);
        return;
      }
      toast.success(text.registrationSuccess);
      void navigate({ to: "/login" });
    } catch {
      toast.error(text.serverError);
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "h-11 rounded-xl border-border/60 bg-white/80";

  return (
    <AuthLayout title={text.title} subtitle={text.subtitle}>
      <div className="mb-4 flex justify-end">
        <LangSwitcher />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field id="last_name" label={text.lastName} error={errors.last_name?.message}>
            <Input id="last_name" className={inputCls} {...register("last_name")} />
          </Field>
          <Field id="first_name" label={text.firstName} error={errors.first_name?.message}>
            <Input id="first_name" className={inputCls} {...register("first_name")} />
          </Field>
        </div>

        <Field
          id="passport_number"
          label={text.documentNumber}
          error={errors.passport_number?.message}
        >
          <Input id="passport_number" className={inputCls} {...register("passport_number")} />
        </Field>

        <Field id="phone" label={text.phone} error={errors.phone?.message}>
          <Input id="phone" className={inputCls} {...register("phone")} />
        </Field>

        <Field id="address" label={text.address} error={errors.address?.message}>
          <Textarea
            id="address"
            rows={3}
            className="rounded-xl border-border/60 bg-white/80"
            {...register("address")}
          />
        </Field>

        <Field id="email" label={text.email} error={errors.email?.message}>
          <Input id="email" type="email" className={inputCls} {...register("email")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="password" label={text.password} error={errors.password?.message}>
            <Input id="password" type="password" className={inputCls} {...register("password")} />
          </Field>
          <Field id="confirm" label={text.confirmPassword} error={errors.confirm?.message}>
            <Input id="confirm" type="password" className={inputCls} {...register("confirm")} />
          </Field>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{text.officialNotice}</p>
          </div>
        </div>

        <label className="flex items-start gap-2 rounded-xl border bg-white/70 p-3 text-sm">
          <Checkbox
            checked={informationConfirmed}
            onCheckedChange={(value) =>
              setValue("information_confirmed", Boolean(value), { shouldValidate: true })
            }
          />
          <span>
            {text.confirmNotice}
            {errors.information_confirmed && (
              <span className="mt-1 block text-xs text-destructive">
                {errors.information_confirmed.message}
              </span>
            )}
          </span>
        </label>

        <Button
          type="submit"
          disabled={submitting || !informationConfirmed}
          className="h-11 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {text.title}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {text.hasAccount}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {text.login}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function labels(lang: "mn" | "en") {
  if (lang === "en") {
    return {
      title: "Register",
      subtitle: "Create a new student account",
      lastName: "Last name",
      firstName: "First name",
      documentNumber: "Passport / document number",
      phone: "Phone",
      address: "Residential address",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      officialNotice:
        "Enter information exactly as it appears on your official document. Personal information cannot be changed after account creation.",
      confirmNotice:
        "I confirm my information matches my official document and cannot be changed after registration.",
      hasAccount: "Already have an account?",
      login: "Login",
      registrationFailed: "Registration failed",
      registrationSuccess: "Registration successful!",
      genericError: "An error occurred",
      serverError: "Could not reach the server",
    };
  }

  return {
    title: "Бүртгүүлэх",
    subtitle: "Шинэ оюутны бүртгэл",
    lastName: "Овог",
    firstName: "Нэр",
    documentNumber: "Паспорт / бичиг баримтын дугаар",
    phone: "Утасны дугаар",
    address: "Оршин суугаа хаяг",
    email: "Имэйл",
    password: "Нууц үг",
    confirmPassword: "Нууц үг давтах",
    officialNotice:
      "Та бүртгэл үүсгэхдээ өөрийн албан ёсны бичиг баримт дээрх мэдээлэлтэй яг тохирсон үнэн зөв мэдээлэл оруулна уу. Бүртгэл үүссэний дараа хувийн мэдээллийг өөрчлөх боломжгүй.",
    confirmNotice:
      "Миний оруулсан мэдээлэл албан ёсны бичиг баримттай тохирч байгаа бөгөөд бүртгүүлсний дараа хувийн мэдээллийг өөрчлөх боломжгүйг зөвшөөрч байна.",
    hasAccount: "Бүртгэлтэй юу?",
    login: "Нэвтрэх",
    registrationFailed: "Бүртгүүлэх амжилтгүй",
    registrationSuccess: "Бүртгэл амжилттай!",
    genericError: "Алдаа гарлаа",
    serverError: "Сервертэй холбогдох боломжгүй",
  };
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
