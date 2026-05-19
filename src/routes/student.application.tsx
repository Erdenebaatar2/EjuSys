import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiGet, apiPatch, apiPost, uploadPhoto } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
<<<<<<< HEAD
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Smartphone,
  Upload,
} from "lucide-react";
=======
import { CheckCircle2, CreditCard, Loader2, Upload } from "lucide-react";
>>>>>>> 057d44990dc2b5b74d6d3d67fdfcea83c67f4b30

export const Route = createFileRoute("/student/application")({
  head: () => ({ meta: [{ title: "EJU application | EjuSys" }] }),
  component: StudentApplicationPage,
});

/* ─── schema ─────────────────────────────────────── */
const schema = z
  .object({
    photoUrl: z.string().min(1),
    nameAlphabet: z.string().min(2),
    nameKanji: z.string().optional(),
    sex: z.enum(["MALE", "FEMALE"]).optional(),
    dateOfBirth: z.string().min(1),
    nationality: z.string().min(2),
    countryCode: z.string().min(2),
    address: z.string().min(4),
    postalCode: z.string().optional(),
    addressCode: z.string().optional(),
    telephone: z.string().optional(),
    mobilePhone: z.string().min(4),
    schoolOrOccupation: z.string().min(2),
    subjectJapanese: z.boolean().default(false),
    subjectScience: z.boolean().default(false),
    subjectJapanAndWorld: z.boolean().default(false),
    subjectMathematics: z.boolean().default(false),
    scienceOption1: z.enum(["PHYSICS", "CHEMISTRY", "BIOLOGY"]).optional(),
    scienceOption2: z.enum(["PHYSICS", "CHEMISTRY", "BIOLOGY"]).optional(),
    mathCourse: z.enum(["COURSE1", "COURSE2"]).optional(),
    examLanguage: z.enum(["JAPANESE", "ENGLISH"]).optional(),
    jassoScholarshipApply: z.boolean().default(false),
    examSite: z
      .enum(["JAKARTA", "SURABAYA", "HANOI", "HOCHIMINH", "BANGKOK", "CHIANGMAI"])
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (
      !values.subjectJapanese &&
      !values.subjectScience &&
      !values.subjectJapanAndWorld &&
      !values.subjectMathematics
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["subjectJapanese"],
        message: "At least one subject is required",
      });
    }
    if (values.subjectScience && !values.scienceOption1) {
      ctx.addIssue({
        code: "custom",
        path: ["scienceOption1"],
        message: "Science option is required",
      });
    }
    if (values.subjectMathematics && !values.mathCourse) {
      ctx.addIssue({ code: "custom", path: ["mathCourse"], message: "Math course is required" });
    }
  });

type FormValues = z.input<typeof schema>;

type ActiveExam = {
  id: string;
  name: string;
  year: number;
  session: string;
  examDate: string;
  registrationStart: string;
  registrationEnd: string;
  location: string;
};

type ApplicationResponse = Partial<FormValues> & {
  id: string;
  status: "pending_payment" | "pending" | "approved" | "rejected";
  paymentStatus?: "unpaid" | "paid";
  applicationNumber: string;
  exam?: ActiveExam;
  rejectionReason?: string | null;
};

/* ─── QPay types ──────────────────────────────────── */
type Deeplink = { name: string; description?: string; logo?: string; link: string };

type PaymentResponse = {
  paymentId: string;
  applicationId: string;
  invoiceId: string | null;
  senderInvoiceNo: string;
  amount: number;
  status: "NEW" | "PAID" | "FAILED";
  qrText: string | null;
  qrImage: string | null;
  deeplinks: string;
  paidAt: string | null;
};

/* ═══════════════════════════════════════════════════
   QPay Modal — inline payment dialog
══════════════════════════════════════════════════ */
function QPayModal({
  applicationId,
  open,
  onClose,
  onPaid,
}: {
  applicationId: string;
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
}) {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [initialized, setInitialized] = useState(false);

  const createMut = useMutation({
    mutationFn: () =>
      apiPost<PaymentResponse>(`/api/student/application/${applicationId}/payment/qpay`),
    onSuccess: (data) => {
      qc.setQueryData(["payment", "qpay", applicationId], data);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "QPay алдаа"),
  });

  const data: PaymentResponse | undefined =
    (qc.getQueryData(["payment", "qpay", applicationId]) as PaymentResponse | undefined) ??
    createMut.data;

  const isPaid = data?.status === "PAID";

  /* create invoice once when dialog opens */
  useEffect(() => {
    if (!open || initialized) return;
    setInitialized(true);
    if (!data) createMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* reset on close so next open re-fetches */
  useEffect(() => {
    if (!open) setInitialized(false);
  }, [open]);

  /* poll every 3 s while NEW */
  useEffect(() => {
    if (!open || !data || isPaid) return;
    const interval = setInterval(() => {
      void qc
        .fetchQuery({
          queryKey: ["payment", "qpay", applicationId],
          queryFn: () =>
            apiGet<PaymentResponse>(
              `/api/student/application/${applicationId}/payment/qpay/status`,
            ),
        })
        .then((d) => {
          if (d.status === "PAID") {
            void qc.invalidateQueries({ queryKey: ["student", "application"] });
            void qc.invalidateQueries({ queryKey: ["student", "dashboard"] });
            onPaid();
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [open, data, isPaid, applicationId, qc, onPaid]);

  const deeplinks = useMemo<Deeplink[]>(() => {
    if (!data?.deeplinks) return [];
    try {
      const parsed: unknown = JSON.parse(data.deeplinks);
      return Array.isArray(parsed) ? (parsed as Deeplink[]) : [];
    } catch {
      return [];
    }
  }, [data?.deeplinks]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        {isPaid ? (
          /* ── SUCCESS STATE ─── */
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-lg">
                {lang === "mn" ? "Төлбөр амжилттай!" : "Payment successful!"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {lang === "mn"
                ? "Таны бүртгэл админы баталгаажуулалт хүлээж байна."
                : "Your application is waiting for admin approval."}
            </p>
            {data?.senderInvoiceNo && (
              <p className="text-xs text-muted-foreground font-mono">{data.senderInvoiceNo}</p>
            )}
            <Button className="w-full" onClick={onPaid}>
              {lang === "mn" ? "Хаах" : "Close"}
            </Button>
          </div>
        ) : createMut.isPending && !data ? (
          /* ── CREATING INVOICE ─── */
          <div className="py-10 text-center space-y-3">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {lang === "mn" ? "QPay invoice бэлдэж байна..." : "Creating QPay invoice..."}
            </p>
          </div>
        ) : createMut.isError && !data ? (
          /* ── ERROR STATE ─── */
          <div className="py-8 text-center space-y-4">
            <DialogHeader>
              <DialogTitle className="text-center text-destructive">
                {lang === "mn" ? "Алдаа гарлаа" : "Error"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {createMut.error instanceof Error ? createMut.error.message : "QPay error"}
            </p>
            <Button variant="outline" onClick={() => createMut.mutate()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {lang === "mn" ? "Дахин оролдох" : "Retry"}
            </Button>
          </div>
        ) : (
          /* ── PAYMENT UI ─── */
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  {lang === "mn" ? "QPay төлбөр" : "QPay payment"}
                </span>
                {data?.amount != null && (
                  <span className="text-base font-bold text-primary">
                    {data.amount.toLocaleString()} ₮
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">
              {lang === "mn"
                ? "QR кодыг банкны аппаараа уншуулж эсвэл доорх товчоор нэвтэрнэ үү."
                : "Scan the QR with your bank app, or tap a bank button below."}
            </p>

            {/* QR code */}
            <div className="flex justify-center">
              {data?.qrImage ? (
                <img
                  src={`data:image/png;base64,${data.qrImage}`}
                  alt="QPay QR"
                  className="h-56 w-56 rounded-xl border bg-white p-2 shadow-sm"
                />
              ) : (
                <div className="h-56 w-56 animate-pulse rounded-xl bg-muted" />
              )}
            </div>

            {/* invoice number */}
            {data?.senderInvoiceNo && (
              <p className="text-center text-xs font-mono text-muted-foreground">
                {data.senderInvoiceNo}
              </p>
            )}

            {/* waiting indicator */}
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {lang === "mn"
                ? "Төлбөр төлөгдөхийг хүлээж байна..."
                : "Waiting for payment confirmation..."}
            </div>

            {/* deeplink bank buttons */}
            {deeplinks.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {lang === "mn" ? "Банкны аппаар нэвтрэх" : "Open with bank app"}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {deeplinks.map((dl) => (
                    <a
                      key={dl.name}
                      href={dl.link}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-2 text-center text-[11px] transition-colors hover:bg-muted/50 hover:border-primary/30"
                    >
                      {dl.logo ? (
                        <img src={dl.logo} alt={dl.name} className="h-9 w-9 rounded-lg" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-muted" />
                      )}
                      <span className="line-clamp-2 leading-tight text-muted-foreground">
                        {dl.description ?? dl.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* bottom actions */}
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <Button variant="ghost" size="sm" onClick={onClose}>
                {lang === "mn" ? "Дараа төлөх" : "Pay later"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  qc.fetchQuery({
                    queryKey: ["payment", "qpay", applicationId],
                    queryFn: () =>
                      apiGet<PaymentResponse>(
                        `/api/student/application/${applicationId}/payment/qpay/status`,
                      ),
                  })
                }
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {lang === "mn" ? "Шинэчлэх" : "Refresh"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════
   Main application page
══════════════════════════════════════════════════ */
function StudentApplicationPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string>("");
  const [qpayAppId, setQpayAppId] = useState<string | null>(null);

  const examQuery = useQuery({
    queryKey: ["student", "activeExam"],
    queryFn: () => apiGet<ActiveExam | undefined>("/api/student/exam"),
  });
  const appQuery = useQuery({
    queryKey: ["student", "application"],
    queryFn: () => apiGet<ApplicationResponse | undefined>("/api/student/application"),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      photoUrl: "",
      nameAlphabet: "",
      nameKanji: "",
      sex: undefined,
      dateOfBirth: "",
      nationality: "",
      countryCode: "",
      address: "",
      postalCode: "",
      addressCode: "",
      telephone: "",
      mobilePhone: "",
      schoolOrOccupation: "",
      subjectJapanese: true,
      subjectScience: false,
      subjectJapanAndWorld: false,
      subjectMathematics: false,
      scienceOption1: undefined,
      scienceOption2: undefined,
      mathCourse: undefined,
      examLanguage: "JAPANESE",
      jassoScholarshipApply: false,
      examSite: undefined,
    },
  });

  useEffect(() => {
    const app = appQuery.data;
    if (!app) return;
    form.reset({
      photoUrl: app.photoUrl ?? "",
      nameAlphabet: app.nameAlphabet ?? "",
      nameKanji: app.nameKanji ?? "",
      sex: app.sex,
      dateOfBirth: app.dateOfBirth ?? "",
      nationality: app.nationality ?? "",
      countryCode: app.countryCode ?? "",
      address: app.address ?? "",
      postalCode: app.postalCode ?? "",
      addressCode: app.addressCode ?? "",
      telephone: app.telephone ?? "",
      mobilePhone: app.mobilePhone ?? "",
      schoolOrOccupation: app.schoolOrOccupation ?? "",
      subjectJapanese: !!app.subjectJapanese,
      subjectScience: !!app.subjectScience,
      subjectJapanAndWorld: !!app.subjectJapanAndWorld,
      subjectMathematics: !!app.subjectMathematics,
      scienceOption1: app.scienceOption1,
      scienceOption2: app.scienceOption2,
      mathCourse: app.mathCourse,
      examLanguage: app.examLanguage,
      jassoScholarshipApply: !!app.jassoScholarshipApply,
      examSite: app.examSite,
    });
    setPreview(app.photoUrl ?? "");
  }, [appQuery.data, form]);

  const uploadMut = useMutation({
    mutationFn: uploadPhoto,
    onSuccess: (path) => {
      form.setValue("photoUrl", path, { shouldValidate: true });
      setPreview(path);
      toast.success(lang === "mn" ? "Зураг амжилттай байршууллаа" : "Photo uploaded");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Upload failed"),
  });

  const saveMut = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = schema.parse(values);
      if (appQuery.data?.id)
        return apiPatch<ApplicationResponse>("/api/student/application", payload);
      return apiPost<ApplicationResponse>("/api/student/application", payload);
    },
    onSuccess: (data) => {
      toast.success(lang === "mn" ? "Бүртгэлийг хадгаллаа" : "Application saved");
      void qc.invalidateQueries({ queryKey: ["student", "application"] });
      void qc.invalidateQueries({ queryKey: ["student", "dashboard"] });
      /* open QPay modal if not yet paid */
      if (data?.paymentStatus !== "paid") {
        setQpayAppId(data.id);
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const countryCode = form.watch("countryCode");
  const showExamSite = useMemo(
    () => ["ID", "VN", "TH"].includes((countryCode ?? "").toUpperCase()),
    [countryCode],
  );
<<<<<<< HEAD
  const isReadonly =
    appQuery.data?.status === "approved" || appQuery.data?.paymentStatus === "paid";
=======
  const isPaid = appQuery.data?.paymentStatus === "paid";
  const isReadonly = appQuery.data?.status === "approved" || isPaid;
>>>>>>> 057d44990dc2b5b74d6d3d67fdfcea83c67f4b30

  /* ── loading ── */
  if (examQuery.isLoading || appQuery.isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* ── no active exam ── */
  if (!examQuery.data && !appQuery.data) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-10 text-center text-muted-foreground">
          {lang === "mn"
            ? "Идэвхтэй шалгалтын бүртгэл хаалттай байна."
            : "No active exam registration is available."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* title row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            {lang === "mn" ? "EJU бүртгэлийн маягт" : "EJU application form"}
          </h1>
          {appQuery.data?.applicationNumber && (
            <p className="mt-1 text-sm text-muted-foreground">
              {appQuery.data.applicationNumber} ·{" "}
              <span className="uppercase">{appQuery.data.status}</span>
            </p>
          )}
        </div>
        {examQuery.data && (
          <Badge variant="secondary">
            {examQuery.data.year} · {examQuery.data.session} · {examQuery.data.examDate}
          </Badge>
        )}
      </div>

      {/* pending payment banner */}
      {appQuery.data?.id &&
        appQuery.data.status === "pending_payment" &&
        appQuery.data.paymentStatus !== "paid" && (
          <Card className="border-warning/40 bg-warning/5 shadow-card">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <p className="text-sm">
                {lang === "mn"
                  ? "Таны бүртгэл хадгалагдсан. Төлбөрөө төлснөөр админ руу илгээгдэнэ."
                  : "Application saved. Pay the fee to submit it for admin review."}
              </p>
              <Button
                type="button"
                onClick={() => setQpayAppId(appQuery.data!.id)}
              >
                {lang === "mn" ? "QPay-ээр төлөх" : "Pay with QPay"}
              </Button>
            </CardContent>
          </Card>
        )}

      {/* form */}
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((values) => {
          if (isReadonly) return;
          saveMut.mutate(values);
        })}
      >
        {/* 1. Personal info */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {lang === "mn" ? "1. Хувийн мэдээлэл" : "1. Personal information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>{lang === "mn" ? "Цээж зураг (jpg/png, 2MB)" : "Photo (jpg/png, 2MB)"}</Label>
              <div className="mt-2 flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-3 hover:bg-muted/40">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">{lang === "mn" ? "Зураг сонгох" : "Upload photo"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    disabled={isReadonly || uploadMut.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      uploadMut.mutate(file);
                    }}
                  />
                </label>
                {uploadMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {preview && <span className="text-xs text-muted-foreground">{preview}</span>}
              </div>
            </div>
            <Field label={lang === "mn" ? "Нэр (ALPHABET)" : "Name (ALPHABET)"}>
              <Input {...form.register("nameAlphabet")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Нэр (Kanji, optional)" : "Name (Kanji, optional)"}>
              <Input {...form.register("nameKanji")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Хүйс" : "Sex"}>
              <RadioGroup
                value={form.watch("sex")}
                onValueChange={(v) => form.setValue("sex", v as FormValues["sex"])}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="MALE" id="male" disabled={isReadonly} />
                  <Label htmlFor="male">{lang === "mn" ? "Эр" : "Male"}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="FEMALE" id="female" disabled={isReadonly} />
                  <Label htmlFor="female">{lang === "mn" ? "Эм" : "Female"}</Label>
                </div>
              </RadioGroup>
            </Field>
            <Field label={lang === "mn" ? "Төрсөн огноо" : "Date of birth"}>
              <Input type="date" {...form.register("dateOfBirth")} disabled={isReadonly} />
            </Field>
          </CardContent>
        </Card>

        {/* 2. Contact */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {lang === "mn" ? "2. Хаяг ба холбоо барих" : "2. Contact and address"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label={lang === "mn" ? "Иргэншил" : "Nationality"}>
              <Input {...form.register("nationality")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Улсын код" : "Country code"}>
              <Input {...form.register("countryCode")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Хаяг" : "Address"}>
              <Textarea rows={3} {...form.register("address")} disabled={isReadonly} />
            </Field>
            <div className="grid gap-4">
              <Field label={lang === "mn" ? "Шуудангийн код" : "Postal code"}>
                <Input {...form.register("postalCode")} disabled={isReadonly} />
              </Field>
              <Field label="Address code">
                <Input {...form.register("addressCode")} disabled={isReadonly} />
              </Field>
            </div>
            <Field label={lang === "mn" ? "Утас" : "Telephone"}>
              <Input {...form.register("telephone")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Гар утас" : "Mobile phone"}>
              <Input {...form.register("mobilePhone")} disabled={isReadonly} />
            </Field>
            <Field label={lang === "mn" ? "Сургууль / Мэргэжил" : "School / Occupation"}>
              <Input {...form.register("schoolOrOccupation")} disabled={isReadonly} />
            </Field>
          </CardContent>
        </Card>

        {/* 3. Subjects */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{lang === "mn" ? "3. Шалгалтын сонголт" : "3. Subject choices"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckField
              checked={Boolean(form.watch("subjectJapanese"))}
              onCheckedChange={(v) => form.setValue("subjectJapanese", !!v)}
              label={lang === "mn" ? "Япон хэл" : "Japanese as a Foreign Language"}
              disabled={isReadonly}
            />
            <CheckField
              checked={Boolean(form.watch("subjectScience"))}
              onCheckedChange={(v) => form.setValue("subjectScience", !!v)}
              label={lang === "mn" ? "Байгалийн ухаан" : "Science"}
              disabled={isReadonly}
            />
            {form.watch("subjectScience") && (
              <div className="grid gap-4 md:grid-cols-2 pl-6">
                <SelectField
                  label="Science 1"
                  value={form.watch("scienceOption1")}
                  onChange={(v) => form.setValue("scienceOption1", v as FormValues["scienceOption1"])}
                  options={[
                    { value: "PHYSICS", label: lang === "mn" ? "Физик" : "Physics" },
                    { value: "CHEMISTRY", label: lang === "mn" ? "Хими" : "Chemistry" },
                    { value: "BIOLOGY", label: lang === "mn" ? "Биологи" : "Biology" },
                  ]}
                  disabled={isReadonly}
                />
                <SelectField
                  label={lang === "mn" ? "Science 2 (optional)" : "Science 2 (optional)"}
                  value={form.watch("scienceOption2")}
                  onChange={(v) => form.setValue("scienceOption2", v as FormValues["scienceOption2"])}
                  options={[
                    { value: "PHYSICS", label: lang === "mn" ? "Физик" : "Physics" },
                    { value: "CHEMISTRY", label: lang === "mn" ? "Хими" : "Chemistry" },
                    { value: "BIOLOGY", label: lang === "mn" ? "Биологи" : "Biology" },
                  ]}
                  disabled={isReadonly}
                />
              </div>
            )}
            <CheckField
              checked={Boolean(form.watch("subjectJapanAndWorld"))}
              onCheckedChange={(v) => form.setValue("subjectJapanAndWorld", !!v)}
              label={lang === "mn" ? "Япон ба дэлхий" : "Japan and the World"}
              disabled={isReadonly}
            />
            <CheckField
              checked={Boolean(form.watch("subjectMathematics"))}
              onCheckedChange={(v) => form.setValue("subjectMathematics", !!v)}
              label={lang === "mn" ? "Математик" : "Mathematics"}
              disabled={isReadonly}
            />
            {form.watch("subjectMathematics") && (
              <div className="pl-6">
                <SelectField
                  label={lang === "mn" ? "Математикийн курс" : "Math course"}
                  value={form.watch("mathCourse")}
                  onChange={(v) => form.setValue("mathCourse", v as FormValues["mathCourse"])}
                  options={[
                    { value: "COURSE1", label: "Course 1" },
                    { value: "COURSE2", label: "Course 2" },
                  ]}
                  disabled={isReadonly}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Additional */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {lang === "mn" ? "4. Нэмэлт мэдээлэл" : "4. Additional options"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <SelectField
              label={lang === "mn" ? "Шалгалтын хэл" : "Exam language"}
              value={form.watch("examLanguage")}
              onChange={(v) => form.setValue("examLanguage", v as FormValues["examLanguage"])}
              options={[
                { value: "JAPANESE", label: lang === "mn" ? "Япон" : "Japanese" },
                { value: "ENGLISH", label: lang === "mn" ? "Англи" : "English" },
              ]}
              disabled={isReadonly}
            />
            <div className="pt-8">
              <CheckField
                checked={Boolean(form.watch("jassoScholarshipApply"))}
                onCheckedChange={(v) => form.setValue("jassoScholarshipApply", !!v)}
                label={lang === "mn" ? "JASSO тэтгэлэгт хамрагдах" : "Apply for JASSO scholarship"}
                disabled={isReadonly}
              />
            </div>
            {showExamSite && (
              <div className="md:col-span-2">
                <SelectField
                  label={lang === "mn" ? "Шалгалтын байршил" : "Exam site"}
                  value={form.watch("examSite")}
                  onChange={(v) => form.setValue("examSite", v as FormValues["examSite"])}
                  options={[
                    { value: "JAKARTA", label: "Jakarta" },
                    { value: "SURABAYA", label: "Surabaya" },
                    { value: "HANOI", label: "Hanoi" },
                    { value: "HOCHIMINH", label: "Ho Chi Minh" },
                    { value: "BANGKOK", label: "Bangkok" },
                    { value: "CHIANGMAI", label: "Chiang Mai" },
                  ]}
                  disabled={isReadonly}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* rejection reason */}
        {appQuery.data?.rejectionReason && (
          <Card className="border-destructive/30 shadow-card">
            <CardContent className="py-4 text-sm text-destructive">
              {appQuery.data.rejectionReason}
            </CardContent>
          </Card>
        )}

<<<<<<< HEAD
        {/* submit */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={saveMut.isPending || isReadonly}
            className="min-w-[160px]"
          >
            {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {lang === "mn" ? "Хадгалж QPay-ээр төлөх" : "Save & pay with QPay"}
=======
        <Card className={isPaid ? "border-success/30 bg-success/5 shadow-card" : "shadow-card"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isPaid ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <CreditCard className="h-5 w-5 text-primary" />
              )}
              {lang === "mn" ? "5. Төлбөр" : "5. Payment"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-4">
              <p className="font-medium">
                {lang === "mn" ? "Шалгалтын төлбөрийг QPay2-р төлнө." : "Pay the exam fee with QPay2."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isPaid
                  ? lang === "mn"
                    ? "Төлбөр төлөгдсөн. Таны бүртгэл баталгаажиж админы хяналт руу илгээгдсэн."
                    : "Payment has been received. Your application is confirmed and waiting for admin review."
                  : lang === "mn"
                    ? "Маягтаа хадгалсны дараа QPay2 QR болон банкны аппын сонголтууд нээгдэнэ. Төлбөр амжилттай төлөгдсөний дараа бүртгэл баталгаажна."
                    : "After saving the form, QPay2 QR and bank app options will open. The application is confirmed only after payment succeeds."}
              </p>
            </div>

            {appQuery.data?.id && !isPaid && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate({ to: "/student/payment/$id", params: { id: appQuery.data!.id } })
                }
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {lang === "mn" ? "QPay2 төлбөр рүү очих" : "Go to QPay2 payment"}
              </Button>
            )}
          </CardContent>
        </Card>

        <div>
          <Button type="submit" disabled={saveMut.isPending || isReadonly}>
            {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {lang === "mn" ? "Хадгалаад QPay2-р төлөх" : "Save and pay with QPay2"}
>>>>>>> 057d44990dc2b5b74d6d3d67fdfcea83c67f4b30
          </Button>
          {isReadonly && (
            <p className="text-sm text-muted-foreground">
              {lang === "mn" ? "Бүртгэл баталгаажсан — засах боломжгүй." : "Application locked."}
            </p>
          )}
        </div>
      </form>

      {/* QPay modal */}
      {qpayAppId && (
        <QPayModal
          applicationId={qpayAppId}
          open={!!qpayAppId}
          onClose={() => setQpayAppId(null)}
          onPaid={() => {
            setQpayAppId(null);
            void navigate({ to: "/student/dashboard" });
          }}
        />
      )}
    </div>
  );
}

/* ─── small reusable field components ─────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function CheckField({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(Boolean(v))}
        disabled={disabled}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
