import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { apiGet, apiPost, uploadPhoto } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  FileImage,
  Loader2,
  MapPin,
  RefreshCw,
  Smartphone,
  Upload,
  UserRound,
  X,
} from "lucide-react";

export interface ExamInfo {
  id: string;
  name: string;
  year: number;
  session: string;
  examDate: string;
  registrationEnd: string;
  location: string;
}

interface ProfileResponse {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  passportNumber?: string | null;
}

interface ApplicationResponse {
  id: string;
  status: "pending_payment" | "pending" | "confirmed" | "approved" | "rejected";
  paymentStatus?: "unpaid" | "paid";
  applicationNumber: string;
  photoUrl?: string | null;
  subjectJapanese?: boolean;
  subjectScience?: boolean;
  subjectJapanAndWorld?: boolean;
  subjectMathematics?: boolean;
  scienceOption1?: "PHYSICS" | "CHEMISTRY" | "BIOLOGY" | null;
  scienceOption2?: "PHYSICS" | "CHEMISTRY" | "BIOLOGY" | null;
  examLanguage?: "JAPANESE" | "ENGLISH" | null;
  jassoScholarshipApply?: boolean;
  specialExam?: boolean;
  specialSupportNote?: string | null;
}

interface RegistrationForm {
  photoUrl: string;
  subjectJapanese: boolean;
  subjectScience: boolean;
  subjectJapanAndWorld: boolean;
  subjectMathematics: boolean;
  scienceOption1?: "PHYSICS" | "CHEMISTRY" | "BIOLOGY";
  scienceOption2?: "PHYSICS" | "CHEMISTRY" | "BIOLOGY";
  examLanguage: "JAPANESE" | "ENGLISH";
  jassoScholarshipApply: boolean;
  specialExam: boolean;
  specialSupportNote: string;
}

type PaymentStatus = "NEW" | "PENDING" | "PAID" | "FAILED" | "EXPIRED";

interface PaymentResponse {
  paymentId: string;
  applicationId: string;
  invoiceId: string | null;
  qpayPaymentId?: string | null;
  senderInvoiceNo: string;
  amount: number;
  status: PaymentStatus;
  qrText: string | null;
  qrImage: string | null;
  deeplinks: string;
  paidAt: string | null;
}

type Deeplink = { name: string; description?: string; logo?: string; link: string };

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const PHOTO_ASPECT_RATIO = 4 / 3;
const PHOTO_ASPECT_TOLERANCE = 0.03;

function emptyForm(): RegistrationForm {
  return {
    photoUrl: "",
    subjectJapanese: true,
    subjectScience: false,
    subjectJapanAndWorld: false,
    subjectMathematics: false,
    scienceOption1: undefined,
    scienceOption2: undefined,
    examLanguage: "JAPANESE",
    jassoScholarshipApply: false,
    specialExam: false,
    specialSupportNote: "",
  };
}

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
  const text = copy(lang);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistrationForm>(() => emptyForm());
  const [qpayAppId, setQpayAppId] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["student", "profile"],
    queryFn: () => apiGet<ProfileResponse>("/api/student/profile"),
    enabled: open,
  });

  const appQuery = useQuery({
    queryKey: ["student", "application", exam?.id],
    queryFn: () =>
      apiGet<ApplicationResponse | undefined>(`/api/student/application?examId=${exam!.id}`),
    enabled: open && Boolean(exam?.id),
  });

  useEffect(() => {
    if (!open || appQuery.isLoading) return;
    const app = appQuery.data;
    if (!app) {
      setForm(emptyForm());
      return;
    }
    setForm({
      photoUrl: app.photoUrl ?? "",
      subjectJapanese: Boolean(app.subjectJapanese),
      subjectScience: Boolean(app.subjectScience),
      subjectJapanAndWorld: Boolean(app.subjectJapanAndWorld),
      subjectMathematics: Boolean(app.subjectMathematics),
      scienceOption1: app.scienceOption1 ?? undefined,
      scienceOption2: app.scienceOption2 ?? undefined,
      examLanguage: app.examLanguage ?? "JAPANESE",
      jassoScholarshipApply: Boolean(app.jassoScholarshipApply),
      specialExam: Boolean(app.specialExam),
      specialSupportNote: app.specialSupportNote ?? "",
    });
  }, [appQuery.data, appQuery.isLoading, open]);

  const uploadMut = useMutation({
    mutationFn: uploadPhoto,
    onSuccess: (path) => {
      setForm((current) => ({ ...current, photoUrl: path }));
      toast.success(text.photoUploaded);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : text.uploadFailed),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      apiPost<ApplicationResponse>("/api/student/application", {
        examId: exam?.id,
        photoUrl: form.photoUrl,
        subjectJapanese: form.subjectJapanese,
        subjectScience: form.subjectScience,
        subjectJapanAndWorld: form.subjectJapanAndWorld,
        subjectMathematics: form.subjectMathematics,
        scienceOption1: form.subjectScience ? form.scienceOption1 : null,
        scienceOption2: form.subjectScience ? form.scienceOption2 : null,
        examLanguage: form.examLanguage,
        jassoScholarshipApply: form.jassoScholarshipApply,
        specialExam: form.specialExam,
        specialSupportNote: form.specialExam ? form.specialSupportNote : null,
      }),
    onSuccess: (saved) => {
      toast.success(text.applicationCreated);
      invalidateStudentData(qc);
      onClose();
      void navigate({ to: "/student/applications/$id", params: { id: saved.id } });
    },
    onError: async (err) => {
      const message = err instanceof Error ? err.message : text.saveFailed;
      if (isDuplicateApplicationError(message)) {
        const latestApplication = await appQuery.refetch();
        if (latestApplication.data) {
          toast.info(text.alreadyRegistered);
          invalidateStudentData(qc);
          return;
        }
      }
      toast.error(message);
    },
  });

  const profile = profileQuery.data;
  const existingApplication = appQuery.data;
  const profileComplete = isProfileComplete(profile);
  const selectedSubjectCount = [
    form.subjectJapanese,
    form.subjectScience,
    form.subjectJapanAndWorld,
    form.subjectMathematics,
  ].filter(Boolean).length;
  const canSubmit =
    profileComplete &&
    Boolean(form.photoUrl) &&
    selectedSubjectCount > 0 &&
    (!form.subjectScience || Boolean(form.scienceOption1)) &&
    !existingApplication;

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error(text.photoTypeError);
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      toast.error(text.photoSizeError);
      return;
    }
    try {
      const dimensions = await readImageDimensions(file);
      const ratio = dimensions.width / Math.max(1, dimensions.height);
      if (Math.abs(ratio - PHOTO_ASPECT_RATIO) > PHOTO_ASPECT_TOLERANCE) {
        toast.error(text.photoAspectError);
        return;
      }
    } catch {
      toast.error(text.photoReadError);
      return;
    }
    uploadMut.mutate(file);
  }

  async function submit() {
    if (!profileComplete) {
      toast.error(text.profileIncomplete);
      return;
    }
    if (!form.photoUrl) {
      toast.error(text.photoRequired);
      return;
    }
    if (selectedSubjectCount === 0) {
      toast.error(text.subjectRequired);
      return;
    }
    if (form.subjectScience && !form.scienceOption1) {
      toast.error(text.scienceRequired);
      return;
    }
    const latestApplication = await appQuery.refetch();
    if (latestApplication.data) {
      toast.info(text.alreadyRegistered);
      return;
    }
    saveMut.mutate();
  }

  const handlePaid = useCallback(
    (applicationId: string) => {
      setQpayAppId(null);
      onClose();
      void navigate({ to: "/student/applications/$id", params: { id: applicationId } });
    },
    [navigate, onClose],
  );

  return (
    <>
      <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-2xl"
        >
          <div className="shrink-0 bg-[oklch(0.22_0.09_260)] px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold text-white">
                    {exam?.name ?? text.title}
                  </SheetTitle>
                  <SheetDescription className="text-white/70">{text.description}</SheetDescription>
                </SheetHeader>
                {exam && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/75">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {exam.examDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {exam.location}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {profileQuery.isLoading || appQuery.isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                {existingApplication && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      {text.alreadyRegistered}
                    </div>
                    <p className="mt-1 font-mono text-xs">
                      {existingApplication.applicationNumber}
                    </p>
                  </div>
                )}

                <Step title={text.stepExam}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Preview label={text.examName} value={exam?.name} />
                    <Preview label={text.examDate} value={exam?.examDate} />
                    <Preview label={text.examLocation} value={exam?.location} />
                    <Preview label={text.registrationEnd} value={exam?.registrationEnd} />
                  </div>
                </Step>

                <Step title={text.stepProfile}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Preview label={text.lastName} value={profile?.lastName} />
                    <Preview label={text.firstName} value={profile?.firstName} />
                    <Preview label={text.email} value={profile?.email} />
                    <Preview label={text.phone} value={profile?.phone} />
                    <Preview
                      className="sm:col-span-2"
                      label={text.address}
                      value={profile?.address}
                    />
                    <Preview
                      className="sm:col-span-2"
                      label={text.documentNumber}
                      value={profile?.passportNumber}
                    />
                  </div>
                  {!profileComplete && (
                    <p className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      {text.profileIncomplete}
                    </p>
                  )}
                </Step>

                <Step title={text.stepPhoto}>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm hover:bg-muted/40">
                      {uploadMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      )}
                      {text.uploadPhoto}
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        disabled={Boolean(existingApplication) || uploadMut.isPending}
                        onChange={(event) => {
                          choosePhoto(event.target.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {form.photoUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={mediaUrl(form.photoUrl)}
                          alt="Application"
                          className="h-16 w-12 rounded-md border object-cover"
                        />
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700"
                        >
                          {text.uploaded}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileImage className="h-4 w-4" />
                        JPG/PNG, max 2MB
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-5 text-muted-foreground">{text.photoHelper}</p>
                </Step>

                <Step title={text.stepSubjects}>
                  <div className="space-y-3">
                    <SubjectCheck
                      label="Japanese"
                      checked={form.subjectJapanese}
                      disabled={Boolean(existingApplication)}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, subjectJapanese: value }))
                      }
                    />
                    <SubjectCheck
                      label="Science"
                      checked={form.subjectScience}
                      disabled={Boolean(existingApplication)}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, subjectScience: value }))
                      }
                    />
                    {form.subjectScience && (
                      <div className="grid gap-3 pl-6 sm:grid-cols-2">
                        <ScienceSelect
                          value={form.scienceOption1}
                          placeholder="Science 1"
                          disabled={Boolean(existingApplication)}
                          onChange={(value) =>
                            setForm((current) => ({ ...current, scienceOption1: value }))
                          }
                          text={text}
                        />
                        <ScienceSelect
                          value={form.scienceOption2}
                          placeholder="Science 2"
                          disabled={Boolean(existingApplication)}
                          onChange={(value) =>
                            setForm((current) => ({ ...current, scienceOption2: value }))
                          }
                          text={text}
                        />
                      </div>
                    )}
                    <SubjectCheck
                      label="Japan and the World"
                      checked={form.subjectJapanAndWorld}
                      disabled={Boolean(existingApplication)}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, subjectJapanAndWorld: value }))
                      }
                    />
                    <SubjectCheck
                      label="Mathematics"
                      checked={form.subjectMathematics}
                      disabled={Boolean(existingApplication)}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, subjectMathematics: value }))
                      }
                    />
                    <div className="grid gap-2 pl-6 sm:max-w-xs">
                      <span className="text-xs font-medium text-muted-foreground">
                        {text.examLanguage}
                      </span>
                      <Select
                        value={form.examLanguage}
                        disabled={Boolean(existingApplication)}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            examLanguage: value as RegistrationForm["examLanguage"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JAPANESE">{text.japaneseLanguage}</SelectItem>
                          <SelectItem value="ENGLISH">{text.englishLanguage}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Step>

                <Step title={text.stepScholarship}>
                  <DescribedCheck
                    label={text.scholarshipLabel}
                    description={text.scholarshipDescription}
                    checked={form.jassoScholarshipApply}
                    disabled={Boolean(existingApplication)}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, jassoScholarshipApply: value }))
                    }
                  />
                </Step>

                <Step title={text.stepSupport}>
                  <div className="space-y-3">
                    <DescribedCheck
                      label={text.specialExamLabel}
                      description={text.specialExamDescription}
                      checked={form.specialExam}
                      disabled={Boolean(existingApplication)}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, specialExam: value }))
                      }
                    />
                    {form.specialExam && (
                      <Textarea
                        value={form.specialSupportNote}
                        disabled={Boolean(existingApplication)}
                        placeholder={text.specialSupportNotePlaceholder}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            specialSupportNote: event.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                </Step>

                <Step title={text.stepPayment}>
                  <p className="text-sm text-muted-foreground">{text.paymentHint}</p>
                </Step>
              </div>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-3 border-t bg-background/95 p-4">
            {existingApplication ? (
              <>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    void navigate({
                      to: "/student/applications/$id",
                      params: { id: existingApplication.id },
                    });
                  }}
                >
                  {text.viewApplicantForm}
                </Button>
                {existingApplication.paymentStatus !== "paid" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setQpayAppId(existingApplication.id)}
                  >
                    <CreditCard className="h-4 w-4" />
                    QPay
                  </Button>
                )}
              </>
            ) : (
              <Button
                type="button"
                className="flex-1"
                disabled={!canSubmit || saveMut.isPending || appQuery.isFetching}
                onClick={submit}
              >
                {saveMut.isPending || appQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {text.registerAndPay}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              {text.close}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {qpayAppId && (
        <QPayDialog
          applicationId={qpayAppId}
          open={Boolean(qpayAppId)}
          onClose={() => setQpayAppId(null)}
          onPaid={() => handlePaid(qpayAppId)}
        />
      )}
    </>
  );
}

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
  const text = copy(lang);
  const qc = useQueryClient();
  const [initialized, setInitialized] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const createMut = useMutation({
    mutationFn: () =>
      apiPost<PaymentResponse>(`/api/student/application/${applicationId}/payment/qpay`),
    onSuccess: (data) => {
      qc.setQueryData(["payment", "qpay", applicationId], data);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "QPay error"),
  });

  const data =
    (qc.getQueryData(["payment", "qpay", applicationId]) as PaymentResponse | undefined) ??
    createMut.data;
  const isPaid = data?.status === "PAID";

  useEffect(() => {
    if (!open || initialized) return;
    setInitialized(true);
    if (!data) createMut.mutate();
  }, [createMut, data, initialized, open]);

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
            apiGet<PaymentResponse>(
              `/api/student/application/${applicationId}/payment/qpay/status`,
            ),
        })
        .then((latest) => {
          if (latest.status === "PAID") {
            invalidateStudentData(qc);
            onPaid();
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [applicationId, data, isPaid, onPaid, open, qc]);

  const deeplinks = useMemo<Deeplink[]>(() => {
    if (!data?.deeplinks) return [];
    try {
      const parsed: unknown = JSON.parse(data.deeplinks);
      return Array.isArray(parsed)
        ? (parsed as Deeplink[]).filter((item) => item.name !== "demo")
        : [];
    } catch {
      return [];
    }
  }, [data?.deeplinks]);

  function checkPayment() {
    setCheckingPayment(true);
    void qc
      .fetchQuery({
        queryKey: ["payment", "qpay", applicationId],
        queryFn: () =>
          apiGet<PaymentResponse>(`/api/student/application/${applicationId}/payment/qpay/status`),
      })
      .then((latest) => {
        if (latest.status === "PAID") {
          toast.success(text.paymentSuccessful);
          invalidateStudentData(qc);
          onPaid();
        } else if (latest.status === "FAILED" || latest.status === "EXPIRED") {
          toast.error(text.paymentFailed);
        } else {
          toast.info(text.paymentPending);
        }
      })
      .catch(() => toast.error(text.paymentCheckFailed))
      .finally(() => setCheckingPayment(false));
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90vh] w-full max-w-md overflow-y-auto">
        {isPaid ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center">{text.paymentSuccessful}</DialogTitle>
            </DialogHeader>
            <Button className="w-full" onClick={onPaid}>
              {text.viewApplicantForm}
            </Button>
          </div>
        ) : createMut.isPending && !data ? (
          <div className="space-y-3 py-10 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{text.creatingInvoice}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  QPay
                </span>
                {data?.amount != null && (
                  <span className="text-base font-bold text-primary">
                    {data.amount.toLocaleString()} ₮
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              {data?.qrImage ? (
                <img
                  src={qrImageSrc(data.qrImage)}
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
            <Button className="w-full" onClick={checkPayment} disabled={checkingPayment}>
              {checkingPayment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {text.checkPayment}
            </Button>
            {deeplinks.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {deeplinks.map((deeplink) => (
                  <a
                    key={deeplink.name}
                    href={deeplink.link}
                    className="rounded-lg border p-2 text-center text-[11px] hover:bg-muted/50"
                  >
                    {deeplink.logo ? (
                      <img
                        src={deeplink.logo}
                        alt={deeplink.name}
                        className="mx-auto h-8 w-8 rounded-lg"
                      />
                    ) : null}
                    <span className="line-clamp-2">{deeplink.description ?? deeplink.name}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-background p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Preview({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="rounded-md border bg-muted/20 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <UserRound className="h-3.5 w-3.5" />
          {label}
        </div>
        <div className="break-words text-sm font-medium">{value || "-"}</div>
      </div>
    </div>
  );
}

function SubjectCheck({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(Boolean(value))}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function DescribedCheck({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border bg-muted/20 p-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-70">
      <Checkbox
        className="mt-0.5"
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(Boolean(value))}
      />
      <span className="grid gap-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function ScienceSelect({
  value,
  placeholder,
  disabled,
  onChange,
  text,
}: {
  value?: RegistrationForm["scienceOption1"];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: RegistrationForm["scienceOption1"]) => void;
  text: ReturnType<typeof copy>;
}) {
  return (
    <Select value={value} disabled={disabled} onValueChange={(v) => onChange(v as typeof value)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PHYSICS">{text.physics}</SelectItem>
        <SelectItem value="CHEMISTRY">{text.chemistry}</SelectItem>
        <SelectItem value="BIOLOGY">{text.biology}</SelectItem>
      </SelectContent>
    </Select>
  );
}

function isProfileComplete(profile?: ProfileResponse | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.firstName?.trim() &&
    profile.lastName?.trim() &&
    profile.email?.trim() &&
    profile.phone?.trim() &&
    profile.address?.trim() &&
    profile.passportNumber?.trim(),
  );
}

function qrImageSrc(qrImage: string | null | undefined): string | undefined {
  if (!qrImage) return undefined;
  return qrImage.startsWith("data:") ? qrImage : `data:image/png;base64,${qrImage}`;
}

function mediaUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  const normalized = path.startsWith("/uploads/")
    ? path
    : path.startsWith("uploads/")
      ? `/${path}`
      : `/uploads/${path}`;
  return `${mediaBaseUrl()}${normalized}`;
}

function mediaBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.port && window.location.port !== "8080") {
    return "http://localhost:8080";
  }
  return "";
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    image.src = url;
  });
}

function invalidateStudentData(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["student", "application"] });
  void qc.invalidateQueries({ queryKey: ["student", "applications"] });
  void qc.invalidateQueries({ queryKey: ["student", "dashboard"] });
  void qc.invalidateQueries({ queryKey: ["student", "exams"] });
}

function isDuplicateApplicationError(message: string): boolean {
  return message.toLowerCase().includes("application already exists");
}

function copy(lang: "mn" | "en") {
  if (lang === "en") {
    return {
      title: "EJU registration",
      description: "Review your profile, upload a photo, choose subjects, and pay with QPay.",
      stepExam: "1. Selected exam",
      stepProfile: "2. Personal information",
      stepPhoto: "3. Photo",
      stepSubjects: "4. Subject choices",
      stepScholarship: "5. Scholarship",
      stepSupport: "6. Special exam support",
      stepPayment: "7. QPay payment",
      examName: "Exam",
      examDate: "Exam date",
      examLocation: "Location",
      registrationEnd: "Registration end",
      lastName: "Last name",
      firstName: "First name",
      email: "Email",
      phone: "Phone",
      address: "Residential address",
      documentNumber: "Document number",
      uploadPhoto: "Upload photo",
      uploaded: "Uploaded",
      photoHelper:
        "The ID photo must be taken within the last 6 months, have a 4x3 ratio, and show the face clearly.",
      examLanguage: "Exam language",
      japaneseLanguage: "Japanese",
      englishLanguage: "English",
      scholarshipLabel: "Request scholarship consideration",
      scholarshipDescription: "Mark this if you want to apply for the JASSO scholarship option.",
      specialExamLabel: "Request special exam support",
      specialExamDescription:
        "For participants with visual, hearing, mobility, or other disabilities.",
      specialSupportNotePlaceholder: "Describe the support you need, if any.",
      physics: "Physics",
      chemistry: "Chemistry",
      biology: "Biology",
      paymentHint:
        "After creating the application, a QPay invoice opens. The application is confirmed automatically when payment becomes PAID.",
      close: "Close",
      registerAndPay: "Register and pay",
      viewApplicantForm: "View applicant form",
      alreadyRegistered: "You are already registered for this exam.",
      photoUploaded: "Photo uploaded",
      uploadFailed: "Upload failed",
      applicationCreated: "Application created. Please complete payment.",
      saveFailed: "Save failed",
      profileIncomplete: "Profile information is incomplete. Please contact an admin.",
      photoTypeError: "Only JPG/PNG images are allowed",
      photoSizeError: "Photo must be under 2MB",
      photoAspectError: "Photo must have a 4x3 aspect ratio.",
      photoReadError: "Could not read the photo. Please choose another image.",
      photoRequired: "Please upload a photo",
      subjectRequired: "Select at least one subject",
      scienceRequired: "Select a science option",
      paymentSuccessful: "Payment successful",
      creatingInvoice: "Creating QPay invoice...",
      checkPayment: "Check payment",
      paymentPending: "Payment is pending.",
      paymentCheckFailed: "Could not check the payment. Please try again.",
      paymentFailed: "Payment failed",
    };
  }

  return {
    title: "EJU бүртгэл",
    description: "Профайлын мэдээллээ шалгаад цээж зураг, хичээлээ сонгож QPay төлбөрөө төлнө үү.",
    stepExam: "1. Сонгосон шалгалт",
    stepProfile: "2. Хувийн мэдээлэл",
    stepPhoto: "3. Цээж зураг",
    stepSubjects: "4. Хичээл сонголт",
    stepScholarship: "5. Тэтгэлэг",
    stepSupport: "6. Тусгай шалгалт",
    stepPayment: "7. QPay төлбөр",
    examName: "Шалгалт",
    examDate: "Шалгалтын огноо",
    examLocation: "Байршил",
    registrationEnd: "Бүртгэл дуусах",
    lastName: "Овог",
    firstName: "Нэр",
    email: "Имэйл",
    phone: "Утас",
    address: "Оршин суугаа хаяг",
    documentNumber: "Бичиг баримтын дугаар",
    uploadPhoto: "Зураг оруулах",
    uploaded: "Оруулсан",
    photoHelper:
      "Цээж зураг нь сүүлийн 6 сарын дотор авахуулсан, 4x3 харьцаатай, нүүр тод харагдсан зураг байх ёстой.",
    examLanguage: "Шалгалтын хэл",
    japaneseLanguage: "Япон хэл",
    englishLanguage: "Англи хэл",
    scholarshipLabel: "JASSO тэтгэлэг хүсэх",
    scholarshipDescription: "Тэтгэлэгт хамрагдах хүсэлттэй бол тэмдэглэнэ үү.",
    specialExamLabel: "Тусгай шалгалт өгөх",
    specialExamDescription:
      "Хараа, сонсгол, хөдөлгөөний болон бусад хөгжлийн бэрхшээлтэй оролцогчдод зориулав",
    specialSupportNotePlaceholder: "Шаардлагатай дэмжлэгээ товч бичнэ үү.",
    physics: "Физик",
    chemistry: "Хими",
    biology: "Биологи",
    paymentHint:
      "Бүртгэл үүссэний дараа QPay invoice нээгдэнэ. Төлбөр PAID болсон үед бүртгэл автоматаар CONFIRMED болно.",
    close: "Хаах",
    registerAndPay: "Бүртгүүлж төлбөр төлөх",
    viewApplicantForm: "Applicant form харах",
    alreadyRegistered: "Та энэ шалгалтад бүртгүүлсэн байна.",
    photoUploaded: "Зураг амжилттай орлоо",
    uploadFailed: "Зураг оруулахад алдаа гарлаа",
    applicationCreated: "Бүртгэл үүслээ. Төлбөрөө төлнө үү.",
    saveFailed: "Хадгалахад алдаа гарлаа",
    profileIncomplete: "Профайлын мэдээлэл дутуу байна. Админтай холбогдоно уу.",
    photoTypeError: "Зөвхөн JPG/PNG зураг оруулна уу",
    photoSizeError: "Зургийн хэмжээ 2MB-аас бага байх ёстой",
    photoAspectError: "Цээж зураг 4x3 харьцаатай байх ёстой.",
    photoReadError: "Цээж зургийг уншиж чадсангүй. Өөр зураг сонгоно уу.",
    photoRequired: "Цээж зураг заавал оруулна уу",
    subjectRequired: "Хамгийн багадаа нэг хичээл сонгоно уу",
    scienceRequired: "Science сонголтоо оруулна уу",
    paymentSuccessful: "Төлбөр амжилттай",
    creatingInvoice: "QPay invoice үүсгэж байна...",
    checkPayment: "Төлбөр шалгах",
    paymentPending: "Төлбөр хүлээгдэж байна.",
    paymentCheckFailed: "Төлбөр шалгахад алдаа гарлаа. Дахин оролдоно уу.",
    paymentFailed: "Төлбөр амжилтгүй",
  };
}
