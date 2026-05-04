import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckCircle2, Eye, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Админ — Бүртгэлүүд | EJU" }] }),
  component: AdminApplications,
});

interface ApplicationRow {
  id: string;
  applicationNumber: string;
  status: string;
  paymentStatus: string;
  phone?: string | null;
  address?: string | null;
  targetUniversity?: string | null;
  rejectionReason?: string | null;
  passportScanPath?: string | null;
  photoPath?: string | null;
  createdAt: string;
  profile?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    passportNumber: string;
  };
  exam?: {
    name: string;
    year: number;
    session: string;
    examDate: string;
    location: string;
  };
}

interface ListResponse {
  items: ApplicationRow[];
  total: number;
  page: number;
  size: number;
}

function AdminApplications() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<ApplicationRow | null>(null);
  const [rejectFor, setRejectFor] = useState<ApplicationRow | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "applications", status, search, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("size", "20");
      return apiGet<ListResponse>(`/api/admin/applications?${params}`);
    },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => apiPatch(`/api/admin/applications/${id}/approve`),
    onSuccess: () => {
      toast.success(lang === "mn" ? "Зөвшөөрлөө" : "Approved");
      void qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const rejectMut = useMutation({
    mutationFn: (args: { id: string; reason: string }) =>
      apiPatch(`/api/admin/applications/${args.id}/reject`, { reason: args.reason }),
    onSuccess: () => {
      toast.success(lang === "mn" ? "Татгалзлаа" : "Rejected");
      setRejectFor(null);
      setReason("");
      void qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const paymentMut = useMutation({
    mutationFn: (args: { id: string; status: "paid" | "unpaid" }) =>
      apiPatch(`/api/admin/applications/${args.id}/payment`, { status: args.status.toUpperCase() }),
    onSuccess: () => {
      toast.success(lang === "mn" ? "Шинэчиллээ" : "Updated");
      void qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-3xl font-bold">{lang === "mn" ? "Бүртгэл удирдах" : "Application management"}</h1>

      <Card className="shadow-card">
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label>{lang === "mn" ? "Хайх" : "Search"}</Label>
            <Input
              placeholder={lang === "mn" ? "Бүртгэлийн дугаар..." : "Application number..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div className="w-48">
            <Label>{lang === "mn" ? "Төлөв" : "Status"}</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "mn" ? "Бүгд" : "All"}</SelectItem>
                <SelectItem value="pending">{lang === "mn" ? "Хүлээгдэж буй" : "Pending"}</SelectItem>
                <SelectItem value="approved">{lang === "mn" ? "Зөвшөөрсөн" : "Approved"}</SelectItem>
                <SelectItem value="rejected">{lang === "mn" ? "Татгалзсан" : "Rejected"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === "mn" ? "Дугаар" : "Number"}</TableHead>
                  <TableHead>{lang === "mn" ? "Оюутан" : "Student"}</TableHead>
                  <TableHead>{lang === "mn" ? "Шалгалт" : "Exam"}</TableHead>
                  <TableHead>{lang === "mn" ? "Төлөв" : "Status"}</TableHead>
                  <TableHead>{lang === "mn" ? "Төлбөр" : "Payment"}</TableHead>
                  <TableHead className="text-right">{lang === "mn" ? "Үйлдэл" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.applicationNumber}</TableCell>
                    <TableCell>
                      {a.profile ? `${a.profile.lastName} ${a.profile.firstName}` : "—"}
                      <div className="text-xs text-muted-foreground">{a.profile?.email}</div>
                    </TableCell>
                    <TableCell>
                      {a.exam?.name}
                      <div className="text-xs text-muted-foreground">{a.exam?.examDate}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={a.paymentStatus}
                        onValueChange={(v) => paymentMut.mutate({ id: a.id, status: v as "paid" | "unpaid" })}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">{lang === "mn" ? "Төлөөгүй" : "Unpaid"}</SelectItem>
                          <SelectItem value="paid">{lang === "mn" ? "Төлсөн" : "Paid"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => setDetail(a)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {a.status !== "approved" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => approveMut.mutate(a.id)}
                          disabled={approveMut.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        </Button>
                      )}
                      {a.status !== "rejected" && (
                        <Button size="icon" variant="ghost" onClick={() => setRejectFor(a)}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {lang === "mn" ? "Бүртгэл алга" : "No applications"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data && data.total > data.size && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {lang === "mn" ? "Нийт" : "Total"}: {data.total}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              {lang === "mn" ? "Өмнөх" : "Prev"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={(page + 1) * data.size >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              {lang === "mn" ? "Дараах" : "Next"}
            </Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.applicationNumber}</DialogTitle>
            <DialogDescription>
              {detail?.profile?.lastName} {detail?.profile?.firstName} · {detail?.profile?.email}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <Field label={lang === "mn" ? "Шалгалт" : "Exam"} value={detail.exam?.name} />
              <Field label={lang === "mn" ? "Огноо" : "Date"} value={detail.exam?.examDate} />
              <Field label={lang === "mn" ? "Байршил" : "Location"} value={detail.exam?.location} />
              <Field label={lang === "mn" ? "Паспорт" : "Passport"} value={detail.profile?.passportNumber} />
              <Field label={lang === "mn" ? "Утас" : "Phone"} value={detail.phone ?? detail.profile?.phone} />
              <Field label={lang === "mn" ? "Хаяг" : "Address"} value={detail.address} />
              <Field label={lang === "mn" ? "Зорилтот сургууль" : "Target university"} value={detail.targetUniversity} />
              <Field label={lang === "mn" ? "Төлөв" : "Status"} value={detail.status} />
              {detail.rejectionReason && (
                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground">{lang === "mn" ? "Татгалзсан шалтгаан" : "Reject reason"}</div>
                  <Badge variant="outline" className="mt-1">
                    {detail.rejectionReason}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "mn" ? "Татгалзах шалтгаан" : "Reject reason"}</DialogTitle>
          </DialogHeader>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>
              {lang === "mn" ? "Болих" : "Cancel"}
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!reason.trim() || rejectMut.isPending}
              onClick={() => rejectFor && rejectMut.mutate({ id: rejectFor.id, reason })}
            >
              {rejectMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {lang === "mn" ? "Татгалзах" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}
