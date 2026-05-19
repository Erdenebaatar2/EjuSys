import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/student/payment/$id")({
  head: () => ({ meta: [{ title: "QPay2 payment | EjuSys" }] }),
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

  // create invoice on first load
  useEffect(() => {
    if (creating || invoiceQuery.data || createMut.isPending) return;
    setCreating(true);
    createMut.mutate(undefined, {
      onSettled: () => setCreating(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = invoiceQuery.data ?? createMut.data;
  const isPaid = data?.status === "PAID" || appQuery.data?.paymentStatus === "paid";

  // poll every 3s while NEW
  useEffect(() => {
    if (!data || isPaid) return;
    const interval = setInterval(() => {
      void qc
        .fetchQuery({
          queryKey: ["payment", "status", id],
          queryFn: () =>
            apiGet<PaymentResponse>(`/api/student/application/${id}/payment/qpay/status`),
        })
        .then((d) => {
          if (d.status === "PAID") {
            void qc.invalidateQueries({ queryKey: ["student", "application"] });
            void qc.invalidateQueries({ queryKey: ["student", "dashboard"] });
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [data, isPaid, id, qc]);

  const deeplinks = useMemo<Deeplink[]>(() => {
    if (!data?.deeplinks) return [];
    try {
      const parsed: unknown = JSON.parse(data.deeplinks);
      return Array.isArray(parsed) ? (parsed as Deeplink[]) : [];
    } catch {
      return [];
    }
  }, [data?.deeplinks]);

  if (isPaid) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle>
              {lang === "mn" ? "Төлбөр амжилттай төлөгдлөө" : "Payment received"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              {lang === "mn"
                ? "Таны EJU бүртгэл админы баталгаажуулалт хүлээж байна."
                : "Your EJU application is now waiting for admin approval."}
            </p>
            {data?.senderInvoiceNo && (
              <p className="text-xs text-muted-foreground">{data.senderInvoiceNo}</p>
            )}
            <Button asChild>
              <Link to="/student/dashboard">
                {lang === "mn" ? "Хяналтын самбар руу" : "Go to dashboard"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (createMut.isPending && !data) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "mn" ? "QPay2 invoice бэлдэж байна..." : "Creating QPay2 invoice..."}
        </p>
      </div>
    );
  }

  if (createMut.isError && !data) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card className="shadow-card border-destructive/30">
          <CardContent className="py-6 text-center space-y-4">
            <p className="text-sm text-destructive">
              {createMut.error instanceof Error ? createMut.error.message : "QPay2 invoice failed"}
            </p>
            <Button onClick={() => createMut.mutate()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {lang === "mn" ? "Дахин үүсгэх" : "Retry"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {lang === "mn" ? "Шалгалтын төлбөр" : "Exam payment"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "mn"
            ? "QR кодыг банкны аппаараа уншуулж эсвэл доорх банкны товчоор төлбөрөө хийнэ үү."
            : "Scan the QR with your bank app or open a deeplink below to pay."}
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{lang === "mn" ? "QPay2 invoice" : "QPay2 invoice"}</span>
            <span className="text-base font-semibold">{data?.amount.toLocaleString()} ₮</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {data?.qrImage ? (
            <img
              src={`data:image/png;base64,${data.qrImage}`}
              alt="QPay QR"
              className="mx-auto h-64 w-64 rounded-md border bg-white p-2"
            />
          ) : (
            <div className="mx-auto h-64 w-64 animate-pulse rounded-md bg-muted" />
          )}
          {data?.senderInvoiceNo && (
            <p className="text-xs text-muted-foreground">{data.senderInvoiceNo}</p>
          )}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {lang === "mn"
              ? "Төлбөр төлөгдөхийг хүлээж байна..."
              : "Waiting for payment confirmation..."}
          </div>
        </CardContent>
      </Card>

      {deeplinks.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{lang === "mn" ? "Банкны апп-аар нээх" : "Open with bank app"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {deeplinks.map((dl) => (
                <a
                  key={dl.name}
                  href={dl.link}
                  className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-xs transition hover:bg-muted/40"
                >
                  {dl.logo ? (
                    <img src={dl.logo} alt={dl.name} className="h-10 w-10 rounded" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted" />
                  )}
                  <span className="line-clamp-2">{dl.description ?? dl.name}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button asChild variant="ghost">
          <Link to="/student/application">
            {lang === "mn" ? "← Бүртгэл рүү буцах" : "← Back to application"}
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            qc.fetchQuery({
              queryKey: ["payment", "status", id],
              queryFn: () =>
                apiGet<PaymentResponse>(`/api/student/application/${id}/payment/qpay/status`),
            })
          }
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {lang === "mn" ? "Шинэчлэх" : "Refresh"}
        </Button>
      </div>
    </div>
  );
}
