import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminEmptyState, AdminMetricCard, AdminPageHeader, AdminPanel } from "@/components/admin/AdminPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPatch } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Search,
  UserPen,
  UserRoundX,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Админ - Оюутнууд | EJU" }] }),
  component: AdminStudents,
});

interface ExamOption {
  id: string;
  name: string;
  year: number;
  session: "FIRST" | "SECOND" | string;
  location: string;
  examDate: string;
  active: boolean;
}

interface StudentRow {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  passportNumber?: string | null;
  isActive: boolean;
  createdAt?: string | null;
}

interface StudentListResponse {
  items: StudentRow[];
  total: number;
  page: number;
  size: number;
}

interface StudentForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  passportNumber: string;
  isActive: boolean;
}

function AdminStudents() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [form, setForm] = useState<StudentForm>(() => emptyForm());

  const { data: examData = [], isLoading: examsLoading } = useQuery({
    queryKey: ["admin", "exams", "students-filter"],
    queryFn: () => apiGet<ExamOption[]>("/api/admin/exam/all"),
  });

  const exams = useMemo(
    () =>
      [...examData].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        if (a.year !== b.year) return b.year - a.year;
        return new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
      }),
    [examData],
  );

  useEffect(() => {
    if (selectedExamId && exams.some((exam) => exam.id === selectedExamId)) return;
    setSelectedExamId(exams[0]?.id ?? "");
  }, [exams, selectedExamId]);

  const selectedExam = exams.find((exam) => exam.id === selectedExamId) ?? null;

  const {
    data,
    isLoading: studentsLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["admin", "students", "unregistered", selectedExamId, search, page],
    queryFn: () => {
      const params = new URLSearchParams({
        examId: selectedExamId,
        page: String(page),
        size: "20",
      });
      if (search.trim()) params.set("search", search.trim());
      return apiGet<StudentListResponse>(`/api/admin/students/unregistered?${params}`);
    },
    enabled: Boolean(selectedExamId),
    retry: 1,
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error(lang === "mn" ? "Оюутан сонгоогүй байна" : "No student selected");
      return apiPatch<StudentRow>(`/api/admin/students/${editing.id}`, form);
    },
    onSuccess: () => {
      toast.success(lang === "mn" ? "Оюутны мэдээлэл шинэчлэгдлээ" : "Student information updated");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["admin", "students"] });
      void qc.invalidateQueries({ queryKey: ["admin", "applications"] });
      void qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.size ?? 20;
  const firstItem = total === 0 ? 0 : page * pageSize + 1;
  const lastItem = Math.min((page + 1) * pageSize, total);
  const formValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.address.trim() &&
    form.passportNumber.trim();

  function openEdit(student: StudentRow) {
    setEditing(student);
    setForm(formFromStudent(student));
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminPageHeader
        icon={Users}
        eyebrow={lang === "mn" ? "Оюутны мэдээлэл" : "Student records"}
        title={lang === "mn" ? "Бүртгүүлээгүй оюутнууд" : "Unregistered students"}
        description={
          lang === "mn"
            ? "Сонгосон шалгалтад бүртгүүлээгүй оюутнуудыг харж, шаардлагатай хувийн мэдээллийг админ засна."
            : "View students who have not registered for the selected exam and edit their profile information."
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AdminMetricCard
          icon={UserRoundX}
          label={lang === "mn" ? "Бүртгүүлээгүй" : "Not registered"}
          value={total}
          helper={
            selectedExam
              ? `${selectedExam.year} ${sessionLabel(selectedExam.session, lang)}`
              : lang === "mn"
                ? "Шалгалт сонгоно уу"
                : "Select an exam"
          }
          tone="amber"
        />
        <AdminMetricCard
          icon={CalendarDays}
          label={lang === "mn" ? "Сонгосон шалгалт" : "Selected exam"}
          value={selectedExam ? formatDate(selectedExam.examDate, lang) : "-"}
          helper={selectedExam?.location ?? "-"}
          tone="blue"
        />
        <AdminMetricCard
          icon={Users}
          label={lang === "mn" ? "Хуудас" : "Page"}
          value={total === 0 ? "0" : `${firstItem}-${lastItem}`}
          helper={lang === "mn" ? "Одоогийн харагдац" : "Current view"}
          tone="teal"
        />
      </div>

      <AdminPanel
        title={lang === "mn" ? "Шүүлтүүр" : "Filters"}
        description={
          lang === "mn"
            ? "Шалгалтаа сонгоод нэр, имэйл, утас, бичиг баримтын дугаараар хайна."
            : "Choose an exam, then search by name, email, phone, or document number."
        }
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Field label={lang === "mn" ? "Шалгалт" : "Exam"}>
            <Select
              value={selectedExamId}
              onValueChange={(value) => {
                setSelectedExamId(value);
                setPage(0);
              }}
              disabled={examsLoading || exams.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={lang === "mn" ? "Шалгалт сонгох" : "Select exam"} />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {examLabel(exam, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={lang === "mn" ? "Хайх" : "Search"}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder={lang === "mn" ? "Нэр, имэйл, утас..." : "Name, email, phone..."}
              />
            </div>
          </Field>
        </div>
      </AdminPanel>

      <AdminPanel
        title={lang === "mn" ? "Оюутнууд" : "Students"}
        description={
          isFetching
            ? lang === "mn"
              ? "Мэдээлэл шинэчилж байна..."
              : "Refreshing..."
            : lang === "mn"
              ? `Нийт ${total.toLocaleString()} оюутан`
              : `${total.toLocaleString()} students`
        }
        contentClassName="p-0"
      >
        {!selectedExamId ? (
          <div className="p-5">
            <AdminEmptyState>
              {lang === "mn" ? "Эхлээд шалгалт үүсгэнэ үү." : "Create an exam first."}
            </AdminEmptyState>
          </div>
        ) : studentsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-5 text-sm text-destructive">{(error as Error).message}</div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <AdminEmptyState>
              {lang === "mn"
                ? "Энэ шалгалтад бүртгүүлээгүй оюутан олдсонгүй."
                : "No unregistered students found for this exam."}
            </AdminEmptyState>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{lang === "mn" ? "Оюутан" : "Student"}</TableHead>
                    <TableHead>{lang === "mn" ? "Утас" : "Phone"}</TableHead>
                    <TableHead>{lang === "mn" ? "Бичиг баримт" : "Document"}</TableHead>
                    <TableHead>{lang === "mn" ? "Хаяг" : "Address"}</TableHead>
                    <TableHead>{lang === "mn" ? "Төлөв" : "Status"}</TableHead>
                    <TableHead className="text-right">{lang === "mn" ? "Үйлдэл" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="font-medium">
                          {studentName(student) || (lang === "mn" ? "Нэргүй" : "Unnamed")}
                        </div>
                        <div className="text-xs text-muted-foreground">{student.email || "-"}</div>
                      </TableCell>
                      <TableCell>{student.phone || "-"}</TableCell>
                      <TableCell>{student.passportNumber || "-"}</TableCell>
                      <TableCell className="max-w-[260px] truncate">{student.address || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            student.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }
                        >
                          {student.isActive
                            ? lang === "mn"
                              ? "Идэвхтэй"
                              : "Active"
                            : lang === "mn"
                              ? "Идэвхгүй"
                              : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(student)}>
                          <UserPen className="h-4 w-4" />
                          {lang === "mn" ? "Засах" : "Edit"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground">
              <span>
                {firstItem}-{lastItem} / {total}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {lang === "mn" ? "Өмнөх" : "Prev"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={lastItem >= total}
                  onClick={() => setPage((value) => value + 1)}
                >
                  {lang === "mn" ? "Дараах" : "Next"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </AdminPanel>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{lang === "mn" ? "Оюутны мэдээлэл засах" : "Edit student information"}</DialogTitle>
            <DialogDescription>
              {lang === "mn"
                ? "Админ эрхээр овог, нэр, холбоо барих болон бичиг баримтын мэдээллийг засна."
                : "Admins can correct profile, contact, and document information."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={lang === "mn" ? "Овог" : "Last name"}>
              <Input
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
              />
            </Field>
            <Field label={lang === "mn" ? "Нэр" : "First name"}>
              <Input
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
              />
            </Field>
            <Field label={lang === "mn" ? "Имэйл" : "Email"}>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </Field>
            <Field label={lang === "mn" ? "Утас" : "Phone"}>
              <Input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </Field>
            <Field className="md:col-span-2" label={lang === "mn" ? "Паспорт / бичиг баримтын дугаар" : "Passport / document number"}>
              <Input
                value={form.passportNumber}
                onChange={(event) =>
                  setForm((current) => ({ ...current, passportNumber: event.target.value }))
                }
              />
            </Field>
            <Field className="md:col-span-2" label={lang === "mn" ? "Оршин суугаа хаяг" : "Address"}>
              <Textarea
                rows={3}
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
            </Field>
            <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">{lang === "mn" ? "Оюутны эрх" : "Student access"}</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lang === "mn" ? "Идэвхгүй бол оюутны профайл хаалттай гэж тооцно." : "Inactive profiles are treated as disabled."}
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              {lang === "mn" ? "Болих" : "Cancel"}
            </Button>
            <Button
              type="button"
              disabled={!formValid || updateMut.isPending}
              onClick={() => updateMut.mutate()}
            >
              {updateMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {lang === "mn" ? "Хадгалах" : "Save"}
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
      <Label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function emptyForm(): StudentForm {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    passportNumber: "",
    isActive: true,
  };
}

function formFromStudent(student: StudentRow): StudentForm {
  return {
    firstName: student.firstName ?? "",
    lastName: student.lastName ?? "",
    email: student.email ?? "",
    phone: student.phone ?? "",
    address: student.address ?? "",
    passportNumber: student.passportNumber ?? "",
    isActive: student.isActive,
  };
}

function studentName(student: StudentRow) {
  return `${student.lastName ?? ""} ${student.firstName ?? ""}`.trim();
}

function examLabel(exam: ExamOption, lang: "mn" | "en") {
  return `${exam.year} ${sessionLabel(exam.session, lang)} - ${exam.location || exam.name}`;
}

function sessionLabel(session: string, lang: "mn" | "en") {
  if (session === "FIRST") return lang === "mn" ? "1-р шалгалт" : "First session";
  if (session === "SECOND") return lang === "mn" ? "2-р шалгалт" : "Second session";
  return session;
}

function formatDate(value: string | null | undefined, lang: "mn" | "en") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === "mn" ? "mn-MN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
