import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import { AdminEmptyState, AdminPageHeader, AdminPanel } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Админ - Бүртгэлүүд | EJU" }] }),
  component: AdminApplications,
});

interface ApplicationRow {
  id: string;
  applicationNumber: string;
  paymentStatus: string;
  phone?: string | null;
  address?: string | null;
  targetUniversity?: string | null;
  passportScanPath?: string | null;
  photoPath?: string | null;
  photoUrl?: string | null;
  subjectJapanese?: boolean;
  subjectScience?: boolean;
  subjectJapanAndWorld?: boolean;
  subjectMathematics?: boolean;
  scienceOption1?: string | null;
  scienceOption2?: string | null;
  mathCourse?: string | null;
  examLanguage?: "JAPANESE" | "ENGLISH" | null;
  jassoScholarshipApply?: boolean;
  specialExam?: boolean;
  specialSupportNote?: string | null;
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
    examRound?: number | null;
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
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [examId, setExamId] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<ApplicationRow | null>(null);
  const [deleteFor, setDeleteFor] = useState<ApplicationRow | null>(null);

  const { data: exams = [] } = useQuery({
    queryKey: ["admin", "exams", "for-filter"],
    queryFn: () => apiGet<Array<{ id: string; name: string }>>("/api/admin/exam/all"),
  });

  const {
    data,
    error: listError,
    isError: listIsError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin", "applications", paymentStatus, examId, fromDate, toDate, search, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
      if (examId !== "all") params.set("examId", examId);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("size", "20");
      return apiGet<ListResponse>(`/api/admin/applications?${params}`);
    },
    retry: 1,
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

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/api/admin/applications/${id}`),
    onSuccess: () => {
      toast.success(lang === "mn" ? "Бүртгэл устгагдлаа" : "Application deleted");
      setDeleteFor(null);
      void qc.invalidateQueries({ queryKey: ["admin", "applications"] });
      void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const activeFilterCount = useMemo(
    () =>
      [paymentStatus !== "all", examId !== "all", !!fromDate, !!toDate, !!search].filter(Boolean)
        .length,
    [examId, fromDate, paymentStatus, search, toDate],
  );
  const total = data?.total ?? 0;
  const pageSize = data?.size ?? 20;
  const firstItem = total === 0 ? 0 : page * pageSize + 1;
  const lastItem = Math.min((page + 1) * pageSize, total);

  function resetFilters() {
    setPaymentStatus("all");
    setExamId("all");
    setFromDate("");
    setToDate("");
    setSearch("");
    setPage(0);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminPageHeader
        icon={FileText}
        eyebrow={lang === "mn" ? "Бүртгэлийн удирдлага" : "Registration management"}
        title={lang === "mn" ? "Бүртгэл удирдах" : "Application management"}
        description={
          lang === "mn"
            ? "Оюутны бүртгэлийг хайх, шүүх, дэлгэрэнгүй мэдээллийг шалгах хэсэг."
            : "Search, filter, and update student application records."
        }
      />

      <AdminPanel
        title={lang === "mn" ? "Шүүлтүүр" : "Filters"}
        description={
          activeFilterCount > 0
            ? lang === "mn"
              ? `${activeFilterCount} шүүлтүүр идэвхтэй`
              : `${activeFilterCount} filters active`
            : lang === "mn"
              ? "Бүх бүртгэлийг харуулж байна"
              : "Showing all applications"
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
          >
            <RotateCcw className="h-4 w-4" />
            {lang === "mn" ? "Цэвэрлэх" : "Reset"}
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Field className="xl:col-span-2" label={lang === "mn" ? "Хайх" : "Search"}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={
                  lang === "mn" ? "Бүртгэлийн дугаар, нэр, имэйл..." : "Number, name, email..."
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </Field>

          <Field label={lang === "mn" ? "Төлбөр" : "Payment"}>
            <Select
              value={paymentStatus}
              onValueChange={(v) => {
                setPaymentStatus(v);
                setPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "mn" ? "Бүгд" : "All"}</SelectItem>
                <SelectItem value="paid">{lang === "mn" ? "Төлсөн" : "Paid"}</SelectItem>
                <SelectItem value="unpaid">{lang === "mn" ? "Төлөөгүй" : "Unpaid"}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field className="xl:col-span-2" label={lang === "mn" ? "Шалгалт" : "Exam"}>
            <Select
              value={examId}
              onValueChange={(v) => {
                setExamId(v);
                setPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === "mn" ? "Бүгд" : "All"}</SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={lang === "mn" ? "Эхлэх огноо" : "From date"}>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </Field>

          <Field label={lang === "mn" ? "Дуусах огноо" : "To date"}>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel
        title={lang === "mn" ? "Бүртгэлийн жагсаалт" : "Application list"}
        description={
          lang === "mn"
            ? `${firstItem}-${lastItem} / нийт ${total}`
            : `${firstItem}-${lastItem} of ${total} total`
        }
        actions={
          <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/10 text-primary">
            <Filter className="h-3.5 w-3.5" />
            {activeFilterCount}
          </Badge>
        }
        contentClassName="p-0"
      >
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : listIsError ? (
          <div className="p-5">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
              <div className="font-semibold text-destructive">
                {lang === "mn"
                  ? "Бүртгэлийн жагсаалт ачаалж чадсангүй."
                  : "Could not load applications."}
              </div>
              <p className="mt-1 text-muted-foreground">
                {listError instanceof Error ? listError.message : "Request failed"}
              </p>
              <Button className="mt-3" size="sm" variant="outline" onClick={() => void refetch()}>
                <RotateCcw className="h-4 w-4" />
                {lang === "mn" ? "Дахин унших" : "Retry"}
              </Button>
            </div>
          </div>
        ) : (data?.items ?? []).length === 0 ? (
          <div className="p-5">
            <AdminEmptyState>
              {lang === "mn" ? "Тохирох бүртгэл олдсонгүй." : "No matching applications."}
            </AdminEmptyState>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5">{lang === "mn" ? "Дугаар" : "Number"}</TableHead>
                <TableHead>{lang === "mn" ? "Оюутан" : "Student"}</TableHead>
                <TableHead>{lang === "mn" ? "Шалгалт" : "Exam"}</TableHead>
                <TableHead>{lang === "mn" ? "Төлбөр" : "Payment"}</TableHead>
                <TableHead className="pr-5 text-right">
                  {lang === "mn" ? "Үйлдэл" : "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((a) => (
                <TableRow key={a.id} className="hover:bg-primary/5">
                  <TableCell className="px-5">
                    <div className="font-mono text-xs font-semibold text-foreground">
                      {a.applicationNumber}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatAdminDate(a.createdAt, lang)}
                    </div>
                    {a.specialExam && (
                      <Badge
                        variant="outline"
                        className="mt-2 border-amber-200 bg-amber-50 text-amber-700"
                      >
                        {lang === "mn" ? "Тусгай шалгалт" : "Special exam"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{fullName(a)}</div>
                    <div className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
                      {a.profile?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[220px] truncate text-sm text-foreground">
                      {a.exam?.name ?? "-"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{a.exam?.examDate}</div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={a.paymentStatus}
                      onValueChange={(v) =>
                        paymentMut.mutate({ id: a.id, status: v as "paid" | "unpaid" })
                      }
                      disabled={paymentMut.isPending}
                    >
                      <SelectTrigger className="h-8 w-32 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">
                          {lang === "mn" ? "Төлөөгүй" : "Unpaid"}
                        </SelectItem>
                        <SelectItem value="paid">{lang === "mn" ? "Төлсөн" : "Paid"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <div className="inline-flex items-center rounded-md border bg-background p-0.5 shadow-sm">
                      <Button
                        size="icon"
                        variant="ghost"
                        title={lang === "mn" ? "Дэлгэрэнгүй" : "View details"}
                        onClick={() => setDetail(a)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={lang === "mn" ? "Бүртгэл устгах" : "Delete application"}
                        onClick={() => setDeleteFor(a)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AdminPanel>

      {data && data.total > data.size && (
        <div className="flex flex-col gap-3 rounded-lg border bg-white/70 p-3 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">
            {lang === "mn"
              ? `${firstItem}-${lastItem} / нийт ${data.total}`
              : `${firstItem}-${lastItem} of ${data.total}`}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              {lang === "mn" ? "Өмнөх" : "Prev"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={(page + 1) * data.size >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              {lang === "mn" ? "Дараах" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detail?.applicationNumber}</DialogTitle>
            <DialogDescription>
              {detail ? `${fullName(detail)} · ${detail.profile?.email ?? ""}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <InfoField label={lang === "mn" ? "Шалгалт" : "Exam"} value={detail.exam?.name} />
              <InfoField
                label={lang === "mn" ? "Шалгалтын он" : "Exam year"}
                value={detail.exam?.year == null ? null : String(detail.exam.year)}
              />
              <InfoField
                label={lang === "mn" ? "Шалгалтын дугаар" : "Exam round"}
                value={formatExamRound(detail.exam?.examRound, lang)}
              />
              <InfoField label={lang === "mn" ? "Огноо" : "Date"} value={detail.exam?.examDate} />
              <InfoField
                label={lang === "mn" ? "Байршил" : "Location"}
                value={detail.exam?.location}
              />
              <InfoField
                label={lang === "mn" ? "Паспорт" : "Passport"}
                value={detail.profile?.passportNumber}
              />
              <InfoField
                label={lang === "mn" ? "Утас" : "Phone"}
                value={detail.phone ?? detail.profile?.phone}
              />
              <InfoField label={lang === "mn" ? "Хаяг" : "Address"} value={detail.address} />
              <InfoField
                label={lang === "mn" ? "Зорилтот сургууль" : "Target university"}
                value={detail.targetUniversity}
              />
              <InfoField
                label={lang === "mn" ? "Зургийн төлөв" : "Photo status"}
                value={photoStatus(detail, lang)}
              />
              <InfoField
                label={lang === "mn" ? "Зураг файл" : "Photo file"}
                value={detail.photoUrl ?? detail.photoPath}
              />
              <InfoField
                label={lang === "mn" ? "Паспорт файл" : "Passport file"}
                value={detail.passportScanPath}
              />
              <InfoField
                label={lang === "mn" ? "Шалгалтын хэл" : "Examination language"}
                value={formatExamLanguage(detail.examLanguage, lang)}
              />
              <InfoField
                label={lang === "mn" ? "Тэтгэлэг хүссэн эсэх" : "Scholarship requested"}
                value={yesNo(detail.jassoScholarshipApply, lang)}
              />
              <InfoField
                label={lang === "mn" ? "Төлбөрийн төлөв" : "Payment status"}
                value={detail.paymentStatus}
              />
              <InfoField
                label={lang === "mn" ? "Тусгай шалгалт" : "Special exam"}
                value={yesNo(detail.specialExam, lang)}
              />
              <InfoField
                label={lang === "mn" ? "Тусгай дэмжлэгийн тайлбар" : "Special support note"}
                value={detail.specialSupportNote}
              />
              <div className="sm:col-span-2">
                <InfoField
                  label={lang === "mn" ? "Сонгосон хичээлүүд" : "Selected subjects"}
                  value={selectedSubjects(detail)}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteFor} onOpenChange={(open) => !open && setDeleteFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "mn" ? "Бүртгэл устгах" : "Delete application"}</DialogTitle>
            <DialogDescription>
              {lang === "mn"
                ? `${deleteFor?.applicationNumber ?? ""} бүртгэлийг бүр мөсөн устгах уу?`
                : `Delete application ${deleteFor?.applicationNumber ?? ""}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFor(null)}>
              {lang === "mn" ? "Болих" : "Cancel"}
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={() => deleteFor && deleteMut.mutate(deleteFor.id)}
            >
              {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {lang === "mn" ? "Устгах" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 break-words font-medium">{value || "—"}</div>
    </div>
  );
}

function yesNo(value: boolean | null | undefined, lang: "mn" | "en") {
  return value ? (lang === "mn" ? "Тийм" : "Yes") : lang === "mn" ? "Үгүй" : "No";
}

function photoStatus(application: ApplicationRow, lang: "mn" | "en") {
  return application.photoUrl || application.photoPath
    ? lang === "mn"
      ? "Оруулсан"
      : "Uploaded"
    : lang === "mn"
      ? "Оруулаагүй"
      : "Missing";
}

function formatExamRound(value: number | null | undefined, lang: "mn" | "en") {
  if (value == null) return null;
  return lang === "mn" ? `${value}-р шалгалт` : `Round ${value}`;
}

function formatExamLanguage(value: ApplicationRow["examLanguage"], lang: "mn" | "en") {
  if (value === "JAPANESE") return lang === "mn" ? "Япон хэл" : "Japanese";
  if (value === "ENGLISH") return lang === "mn" ? "Англи хэл" : "English";
  return null;
}

function selectedSubjects(application: ApplicationRow) {
  return [
    application.subjectJapanese ? "Japanese as a Foreign Language" : "",
    application.subjectScience
      ? `Science ${[application.scienceOption1, application.scienceOption2].filter(Boolean).join(", ")}`
      : "",
    application.subjectJapanAndWorld ? "Japan and the World" : "",
    application.subjectMathematics ? `Mathematics ${application.mathCourse ?? ""}` : "",
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");
}

function fullName(application: ApplicationRow) {
  if (!application.profile) return "—";
  return `${application.profile.lastName} ${application.profile.firstName}`.trim();
}

function formatAdminDate(value: string, lang: "mn" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(lang === "mn" ? "mn-MN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
