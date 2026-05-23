import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { StudentPageHeader, StudentPanel } from "@/components/student/StudentPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  QrCode,
  ReceiptText,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/student/payment/$id")({
  head: () => ({ meta: [{ title: "QPay2 төлбөр | EJU" }] }),
  component: PaymentPage,
});

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
  demo?: boolean;
};

type AppSummary = {
  id: string;
  status: string;
  paymentStatus?: "paid" | "unpaid";
  applicationNumber?: string;
  exam?: { name: string; year: number; session: string; examDate: string };
};

function PaymentPage() {
  const { id } = Route.useParams();
  const { lang } = useLang();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const appQuery = useQuery({
    queryKey: ["student", "application"],
    queryFn: () => apiGet<AppSummary | undefined>("/api/student/application"),
  });

  const invoiceQuery = useQuery({
    queryKey: ["payment", "status", id],
    queryFn: () => apiGet<PaymentResponse>(`/api/student/application/${id}/payment/qpay/status`),
    enabled: false,
    retry: false,
  });

  const createMut = useMutation({
    mutationFn: () => apiPost<PaymentResponse>(`/api/student/application/${id}/payment/qpay`),
    onSuccess: (data) => {
      qc.setQueryData(["payment", "status", id], data);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "QPay2 error"),
  });

  const demoCompleteMut = useMutation({
    mutationFn: () =>
      apiPost<PaymentResponse>(`/api/student/application/${id}/payment/qpay/demo-complete`),
    onSuccess: (paid) => {
      qc.setQueryData(["payment", "status", id], paid);
      void qc.invalidateQueries({ queryKey: ["student", "application"] });
      void qc.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Demo payment failed"),
  });

  useEffect(() => {
    if (creating || invoiceQuery.data || createMut.data || createMut.isPending) return;
    setCreating(true);
    createMut.mutate(undefined, {
      onSettled: () => setCreating(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = invoiceQuery.data ?? createMut.data;
  const isPaid = data?.status === "PAID" || appQuery.data?.paymentStatus === "paid";
  const amount = data?.amount != null ? `${data.amount.toLocaleString()} ₮` : "-";

  useEffect(() => {
    if (!data || isPaid) return;
    const interval = setInterval(() => {
      void qc
        .fetchQuery({
          queryKey: ["payment", "status", id],
          queryFn: () =>
            apiGet<PaymentResponse>(`/api/student/application/${id}/payment/qpay/status`),
        })
        .then((result) => {
          if (result.status === "PAID") {
            void qc.invalidateQueries({ queryKey: ["student", "application"] });
            void qc.invalidateQueries({ queryKey: ["student", "dashboard"] });
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [data, id, isPaid, qc]);

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
    if (data?.demo) {
      demoCompleteMut.mutate();
      return;
    }
    void qc.fetchQuery({
      queryKey: ["payment", "status", id],
      queryFn: () =>
        apiGet<PaymentResponse>(`/api/student/application/${id}/payment/qpay/status`),
    });
  }

  if (isPaid) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <StudentPageHeader
          icon={CheckCircle2}
          tone="emerald"
          eyebrow={lang === "mn" ? "QPay2 төлбөр" : "QPay2 payment"}
          title={lang === "mn" ? "Төлбөр амжилттай төлөгдлөө" : "Payment received"}
          description={
            lang === "mn"
              ? "Таны EJU бүртгэл төлбөрөөр баталгаажлаа."
              : "Your EJU application has been confirmed by payment."
          }
          actions={
            <Button asChild>
              <Link to="/student/dashboard">{lang === "mn" ? "Хяналтын самбар" : "Dashboard"}</Link>
            </Button>
          }
        />

        <StudentPanel>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {lang === "mn" ? "Баталгаажсан" : "Confirmed"}
            </h2>
            {data?.senderInvoiceNo ? (
              <p className="mt-2 font-mono text-xs text-muted-foreground">{data.senderInvoiceNo}</p>
            ) : null}
            <Button asChild variant="outline" className="mt-5">
              <Link to="/student/applications">
                {lang === "mn" ? "Бүртгэл рүү буцах" : "Back to application"}
              </Link>
            </Button>
          </div>
        </StudentPanel>
      </div>
    );
  }

  if (createMut.isPending && !data) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {lang === "mn" ? "QPay2 invoice бэлдэж байна..." : "Creating QPay2 invoice..."}
        </p>
      </div>
    );
  }

  if (createMut.isError && !data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <StudentPageHeader
          icon={CreditCard}
          eyebrow={lang === "mn" ? "QPay2 төлбөр" : "QPay2 payment"}
          title={lang === "mn" ? "Invoice үүсгэж чадсангүй" : "Could not create invoice"}
          description={
            createMut.error instanceof Error ? createMut.error.message : "QPay2 invoice failed"
          }
        />
        <StudentPanel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {lang === "mn"
                ? "Дахин үүсгэх товч дарж төлбөрийн invoice-г сэргээнэ үү."
                : "Retry creating the payment invoice."}
            </p>
            <Button onClick={() => createMut.mutate()} variant="outline">
              <RefreshCw className="h-4 w-4" />
              {lang === "mn" ? "Дахин үүсгэх" : "Retry"}
            </Button>
          </div>
        </StudentPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <StudentPageHeader
        icon={CreditCard}
        eyebrow={lang === "mn" ? "QPay2 төлбөр" : "QPay2 payment"}
        title={lang === "mn" ? "Шалгалтын төлбөр" : "Exam payment"}
        description={
          lang === "mn"
            ? "QR кодыг банкны аппаараа уншуулж эсвэл доорх банкны товчоор төлбөрөө хийнэ үү."
            : "Scan the QR with your bank app or open a bank deeplink below."
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/student/applications">
                <ArrowLeft className="h-4 w-4" />
                {lang === "mn" ? "Бүртгэл" : "Application"}
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={checkPayment}
              disabled={demoCompleteMut.isPending}
            >
              {demoCompleteMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {lang === "mn" ? "Төлбөр шалгах" : "Check payment"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.8fr)]">
        <StudentPanel
          title={lang === "mn" ? "QPay2 invoice" : "QPay2 invoice"}
          description={
            lang === "mn"
              ? "Төлбөр төлөгдөх хүртэл төлөв автоматаар шинэчлэгдэнэ."
              : "The status refreshes automatically while payment is pending."
          }
          actions={<Badge variant="secondary">{amount}</Badge>}
        >
          <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
            <div className="flex flex-col items-center">
              {data?.qrImage ? (
                <img
                  src={qrImageSrc(data.qrImage)}
                  alt="QPay QR"
                  className="h-64 w-64 rounded-lg border bg-white p-2"
                />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-lg border bg-muted/30">
                  <QrCode className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {lang === "mn"
                  ? "Банкны апп-аар төлсний дараа төлбөрөө шалгана уу."
                  : "After paying in your bank app, check the payment."}
              </div>
              <Button
                className="mt-4 w-64"
                onClick={checkPayment}
                disabled={demoCompleteMut.isPending}
              >
                {demoCompleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {lang === "mn" ? "Төлбөр шалгах" : "Check payment"}
              </Button>
            </div>

            <div className="space-y-3">
              <InfoRow
                icon={ReceiptText}
                label={lang === "mn" ? "Invoice дугаар" : "Invoice number"}
                value={data?.senderInvoiceNo ?? "-"}
                mono
              />
              <InfoRow icon={CreditCard} label={lang === "mn" ? "Дүн" : "Amount"} value={amount} />
              <InfoRow
                icon={Smartphone}
                label={lang === "mn" ? "Төлөв" : "Status"}
                value={data?.status ?? "NEW"}
              />
            </div>
          </div>
        </StudentPanel>

        <StudentPanel
          title={lang === "mn" ? "Бүртгэлийн мэдээлэл" : "Application details"}
          description={
            lang === "mn"
              ? "Төлбөр амжилттай болсны дараа бүртгэл автоматаар шинэчлэгдэнэ."
              : "Your application updates automatically after payment succeeds."
          }
        >
          <div className="space-y-3">
            <InfoRow
              icon={ReceiptText}
              label={lang === "mn" ? "Бүртгэл" : "Application"}
              value={appQuery.data?.applicationNumber ?? id}
              mono
            />
            <InfoRow
              icon={CreditCard}
              label={lang === "mn" ? "Төлбөрийн төлөв" : "Payment status"}
              value={appQuery.data?.paymentStatus ?? "unpaid"}
            />
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/student/applications">
                <ArrowLeft className="h-4 w-4" />
                {lang === "mn" ? "Бүртгэл рүү буцах" : "Back to application"}
              </Link>
            </Button>
          </div>
        </StudentPanel>
      </div>

      {deeplinks.length > 0 ? (
        <StudentPanel
          title={lang === "mn" ? "Банкны апп-аар нээх" : "Open with bank app"}
          description={
            lang === "mn"
              ? "Өөрийн банкны апп сонгож төлбөрийн дэлгэц рүү шууд шилжинэ."
              : "Choose your bank app to open the payment screen directly."
          }
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {deeplinks.map((deeplink) => (
              <a
                key={deeplink.name}
                href={deeplink.link}
                className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border bg-background p-3 text-center text-xs transition hover:border-primary/40 hover:bg-muted/30"
              >
                {deeplink.logo ? (
                  <img
                    src={deeplink.logo}
                    alt={deeplink.name}
                    className="h-10 w-10 rounded object-contain"
                  />
                ) : (
                  <Smartphone className="h-9 w-9 text-muted-foreground" />
                )}
                <span className="line-clamp-2">{deeplink.description ?? deeplink.name}</span>
              </a>
            ))}
          </div>
        </StudentPanel>
      ) : null}
    </div>
  );
}

function qrImageSrc(qrImage: string | null | undefined): string | undefined {
  if (!qrImage) return undefined;
  return qrImage.startsWith("data:") ? qrImage : `data:image/png;base64,${qrImage}`;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <p
        className={
          mono ? "break-words font-mono text-sm font-medium" : "break-words text-sm font-medium"
        }
      >
        {value}
      </p>
    </div>
  );
}
