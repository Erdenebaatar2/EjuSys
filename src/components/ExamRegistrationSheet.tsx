/**
 * ExamRegistrationSheet
 * ---------------------
 * Slide-over panel that contains the EXACT same form fields, validation,
 * and API wiring as the original student.application.tsx page.
 * Only the presentation changes — nothing else.
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { apiGet, apiPatch, apiPost, uploadPhoto } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Smartphone,
  Upload,
  Calendar,
  MapPin,
  X,
} from "lucide-react";

/* ─── Identical schema (unchanged from student.application.tsx) ────── */
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
      ctx.addIssue({ code: "custom", path: ["subjectJapanese"], message: "At least one subject is required" });
    }
    if (values.subjectScience && !values.scienceOption1) {
      ctx.addIssue({ code: "custom", path: ["scienceOption1"], message: "Science option is required" });
    }
    if (values.subjectMathematics && !values.mathCourse) {
      ctx.addIssue({ code: "custom", path: ["mathCourse"], message: "Math course is required" });
    }
  });

type FormValues = z.input<typeof schema>;

/* ─── API types (unchanged) ─────────────────────────────────────────── */
type ApplicationResponse = Partial<FormValues> & {
  id: string;
  status: "pending_payment" | "pending" | "approved" | "rejected";
  paymentStatus?: "unpaid" | "paid";
  applicationNumber: string;
  rejectionReason?: string | null;
};

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

/* ─── Exam info shape (passed in as prop) ───────────────────────────── */
export interface ExamInfo {
  id: string;
  name: string;
  year: number;
  session: string;
  examDate: string;
  registrationEnd: string;
  location: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   QPay Dialog — identical logic to student.application.tsx
═══════════════════════════════════════════════════════════════════════ */
function QPayDialog({
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

  useEffect(() => {
    if (!open || initialized) return;
    setInitialized(true);
    if (!data) createMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) setInitialized(false);
  }, [open]);

  useEffect(() => {
    if (!open || !data || isPaid) return;
    const interval = setInterval(() => {
      void qc
        .fetchQuery({
          queryKey: ["payment", "qpay", applicationId],
          queryFn: () =>
            apiGet<PaymentResponse>(`/api/student/application/${applicationId}/payment/qpay/status`),
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
    } catch { return []; }
  }, [data?.deeplinks]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        {isPaid ? (
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
              <p className="text-xs font-mono text-muted-foreground">{data.senderInvoiceNo}</p>
            )}
            <Button className="w-full" onClick={onPaid}>{lang === "mn" ? "Хаах" : "Close"}</Button>
          </div>
        ) : createMut.isPending && !data ? (
          <div className="py-10 text-center space-y-3">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {lang === "mn" ? "QPay invoice бэлдэж байна..." : "Creating QPay invoice..."}
            </p>
          </div>
        ) : createMut.isError && !data ? (
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
            {data?.senderInvoiceNo && (
              <p className="text-center text-xs font-mono text-muted-foreground">
                {data.senderInvoiceNo}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {lang === "mn" ? "Төлбөр хүлээж байна..." : "Waiting for payment confirmation..."}
            </div>
            {deeplinks.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {lang === "mn" ? "Банкны аппаар нэвтрэх" : "Open with bank app"}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {deeplinks.map((dl) => (
                    <a
                      key={dl.name}
                      href={dl.link}
                      className="flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center text-[11px] transition-colors hover:bg-muted/50"
                    >
                      {dl.logo
                        ? <img src={dl.logo} alt={dl.name} className="h-9 w-9 rounded-lg" />
                        : <div className="h-9 w-9 rounded-lg bg-muted" />}
                      <span className="line-clamp-2 text-muted-foreground">{dl.description ?? dl.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t">
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
                      apiGet<PaymentResponse>(`/api/student/application/${applicationId}/payment/qpay/status`),
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

/* ═══════════════════════════════════════════════════════════════════════
   Main ExamRegistrationSheet
═══════════════════════════════════════════════════════════════════════ */
export function ExamRegistrationSheet({
  exam,
  open,
  onClose,
}: {
  exam: ExamInfo | null;
  open: boolean;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string>("");
  const [qpayAppId, setQpayAppId] = useState<string | null>(null);

  /* ── same queries as student.application.tsx ── */
  const appQuery = useQuery({
    queryKey: ["student", "application"],
    queryFn: () => apiGet<ApplicationResponse | undefined>("/api/student/application"),
    enabled: open,
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

  const isReadonly =
    appQuery.data?.status === "approved" || appQuery.data?.paymentStatus === "paid";

  const handlePaid = useCallback(() => {
    setQpayAppId(null);
    onClose();
    void navigate({ to: "/student/dashboard" });
  }, [onClose, navigate]);

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col overflow-hidden"
        >
          {/* Sheet header — exam context banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.20_0.08_264)] via-[oklch(0.28_0.12_268)] to-[oklch(0.38_0.16_276)] px-6 py-5 shrink-0">
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetHeader>
                  <SheetTitle className="text-white text-xl font-bold leading-tight">
                    {exam?.name ?? (lang === "mn" ? "EJU Бүртгэл" : "EJU Registration")}
                  </SheetTitle>
                  <SheetDescription className="text-white/60 text-sm mt-0.5">
                    {lang === "mn" ? "Бүртгэлийн маягт бөглөнө үү" : "Fill in the registration form"}
                  </SheetDescription>
                </SheetHeader>
                {exam && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/70">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {exam.examDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {exam.location}
                    </span>
                    {appQuery.data?.applicationNumber && (
                      <Badge className="bg-white/15 text-white border-white/20 text-[10px]">
                        {appQuery.data.applicationNumber}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors shrink-0 mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Pending payment banner */}
          {appQuery.data?.id &&
            appQuery.data.status === "pending_payment" &&
            appQuery.data.paymentStatus !== "paid" && (
              <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
                <p className="text-sm text-amber-800">
                  {lang === "mn"
                    ? "Бүртгэл хадгалагдсан. Төлбөрөө төлснөөр илгээгдэнэ."
                    : "Application saved. Pay the fee to submit for review."}
                </p>
                <Button
                  size="sm"
                  className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => setQpayAppId(appQuery.data!.id)}
                >
                  {lang === "mn" ? "QPay" : "Pay now"}
                </Button>
              </div>
            )}

          {/* Scrollable form body */}
          {appQuery.isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <form
                className="p-6 space-y-5"
                onSubmit={form.handleSubmit((values) => {
                  if (isReadonly) return;
                  saveMut.mutate(values);
                })}
              >
                {/* ── Section 1: Personal info ── */}
                <FormSection title={lang === "mn" ? "1. Хувийн мэдээлэл" : "1. Personal information"}>
                  <div className="md:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {lang === "mn" ? "Цээж зураг (jpg/png, 2MB)" : "Photo (jpg/png, 2MB)"}
                    </Label>
                    <div className="mt-1.5 flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        {lang === "mn" ? "Зураг сонгох" : "Upload photo"}
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
                      {preview && (
                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {preview}
                        </span>
                      )}
                    </div>
                  </div>

                  <F label={lang === "mn" ? "Нэр (ALPHABET)" : "Name (ALPHABET)"}>
                    <Input {...form.register("nameAlphabet")} disabled={isReadonly} className="h-9" />
                  </F>
                  <F label={lang === "mn" ? "Нэр (Kanji)" : "Name (Kanji, optional)"}>
                    <Input {...form.register("nameKanji")} disabled={isReadonly} className="h-9" />
                  </F>
                  <F label={lang === "mn" ? "Хүйс" : "Sex"}>
                    <RadioGroup
                      value={form.watch("sex")}
                      onValueChange={(v) => form.setValue("sex", v as FormValues["sex"])}
                      className="flex gap-4 pt-1"
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="MALE" disabled={isReadonly} />
                        <span className="text-sm">{lang === "mn" ? "Эр" : "Male"}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="FEMALE" disabled={isReadonly} />
                        <span className="text-sm">{lang === "mn" ? "Эм" : "Female"}</span>
                      </label>
                    </RadioGroup>
                  </F>
                  <F label={lang === "mn" ? "Төрсөн огноо" : "Date of birth"}>
                    <Input type="date" {...form.register("dateOfBirth")} disabled={isReadonly} className="h-9" />
                  </F>
                </FormSection>

                {/* ── Section 2: Contact ── */}
                <FormSection title={lang === "mn" ? "2. Хаяг ба холбоо барих" : "2. Contact & address"}>
                  <F label={lang === "mn" ? "Иргэншил" : "Nationality"}>
                    <Input {...form.register("nationality")} disabled={isReadonly} className="h-9" />
                  </F>
                  <F label={lang === "mn" ? "Улсын код" : "Country code"}>
                    <Input {...form.register("countryCode")} disabled={isReadonly} className="h-9" />
                  </F>
                  <div className="md:col-span-2">
                    <F label={lang === "mn" ? "Хаяг" : "Address"}>
                      <Textarea rows={2} {...form.register("address")} disabled={isReadonly} />
                    </F>
                  </div>
                  <F label={lang === "mn" ? "Шуудангийн код" : "Postal code"}>
                    <Input {...form.register("postalCode")} disabled={isReadonly} className="h-9" />
                  </F>
                  <F label="Address code">
                    <Input {...form.register("addressCode")} disabled={isReadonly} className="h-9" />
                  </F>
                  <F label={lang === "mn" ? "Утас" : "Telephone"}>
                    <Input {...form.register("telephone")} disabled={isReadonly} className="h-9" />
                  </F>
                  <F label={lang === "mn" ? "Гар утас" : "Mobile phone"}>
                    <Input {...form.register("mobilePhone")} disabled={isReadonly} className="h-9" />
                  </F>
                  <div className="md:col-span-2">
                    <F label={lang === "mn" ? "Сургууль / Мэргэжил" : "School / Occupation"}>
                      <Input {...form.register("schoolOrOccupation")} disabled={isReadonly} className="h-9" />
                    </F>
                  </div>
                </FormSection>

                {/* ── Section 3: Subjects ── */}
                <FormSection title={lang === "mn" ? "3. Шалгалтын сонголт" : "3. Subject choices"}>
                  <div className="md:col-span-2 space-y-3">
                    <Check
                      checked={Boolean(form.watch("subjectJapanese"))}
                      onCheckedChange={(v) => form.setValue("subjectJapanese", !!v)}
                      label={lang === "mn" ? "Япон хэл" : "Japanese as a Foreign Language"}
                      disabled={isReadonly}
                    />
                    <Check
                      checked={Boolean(form.watch("subjectScience"))}
                      onCheckedChange={(v) => form.setValue("subjectScience", !!v)}
                      label={lang === "mn" ? "Байгалийн ухаан" : "Science"}
                      disabled={isReadonly}
                    />
                    {form.watch("subjectScience") && (
                      <div className="grid gap-3 md:grid-cols-2 pl-6">
                        <Sel
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
                        <Sel
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
                    <Check
                      checked={Boolean(form.watch("subjectJapanAndWorld"))}
                      onCheckedChange={(v) => form.setValue("subjectJapanAndWorld", !!v)}
                      label={lang === "mn" ? "Япон ба дэлхий" : "Japan and the World"}
                      disabled={isReadonly}
                    />
                    <Check
                      checked={Boolean(form.watch("subjectMathematics"))}
                      onCheckedChange={(v) => form.setValue("subjectMathematics", !!v)}
                      label={lang === "mn" ? "Математик" : "Mathematics"}
                      disabled={isReadonly}
                    />
                    {form.watch("subjectMathematics") && (
                      <div className="pl-6">
                        <Sel
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
                  </div>
                </FormSection>

                {/* ── Section 4: Additional ── */}
                <FormSection title={lang === "mn" ? "4. Нэмэлт мэдээлэл" : "4. Additional options"}>
                  <Sel
                    label={lang === "mn" ? "Шалгалтын хэл" : "Exam language"}
                    value={form.watch("examLanguage")}
                    onChange={(v) => form.setValue("examLanguage", v as FormValues["examLanguage"])}
                    options={[
                      { value: "JAPANESE", label: lang === "mn" ? "Япон" : "Japanese" },
                      { value: "ENGLISH", label: lang === "mn" ? "Англи" : "English" },
                    ]}
                    disabled={isReadonly}
                  />
                  <div className="flex items-end pb-1">
                    <Check
                      checked={Boolean(form.watch("jassoScholarshipApply"))}
                      onCheckedChange={(v) => form.setValue("jassoScholarshipApply", !!v)}
                      label={lang === "mn" ? "JASSO тэтгэлэгт хамрагдах" : "Apply for JASSO scholarship"}
                      disabled={isReadonly}
                    />
                  </div>
                  {showExamSite && (
                    <div className="md:col-span-2">
                      <Sel
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
                </FormSection>

                {/* Rejection reason */}
                {appQuery.data?.rejectionReason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                    <p className="text-sm text-destructive">{appQuery.data.rejectionReason}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center gap-3 pt-2 pb-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-sm -mx-6 px-6">
                  <Button
                    type="submit"
                    disabled={saveMut.isPending || isReadonly}
                    className="flex-1 bg-gradient-to-r from-primary to-[oklch(0.45_0.16_280)] font-semibold shadow-soft"
                  >
                    {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {lang === "mn" ? "Хадгалж QPay-ээр төлөх" : "Save & pay with QPay"}
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose}>
                    {lang === "mn" ? "Хаах" : "Cancel"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* QPay modal — shown on top of the Sheet */}
      {qpayAppId && (
        <QPayDialog
          applicationId={qpayAppId}
          open={!!qpayAppId}
          onClose={() => setQpayAppId(null)}
          onPaid={handlePaid}
        />
      )}
    </>
  );
}

/* ─── Tiny layout helpers ──────────────────────────────────────────── */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 px-4 pb-4">
        {children}
      </CardContent>
    </Card>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Check({
  checked, onCheckedChange, label, disabled,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(Boolean(v))}
        disabled={disabled}
      />
      <span className="text-sm group-hover:text-foreground transition-colors">{label}</span>
    </label>
  );
}

function Sel({
  label, value, onChange, options, disabled,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
