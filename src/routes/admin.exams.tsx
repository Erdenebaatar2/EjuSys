import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminPage";
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
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, CalendarDays, Clock3, MapPin, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isRegistrationOpen } from "@/lib/eju-format";

export const Route = createFileRoute("/admin/exams")({
  head: () => ({ meta: [{ title: "Админ - Шалгалтууд | EJU" }] }),
  component: AdminExamPage,
});

type Session = "FIRST" | "SECOND";

interface ExamRecord {
  id: string;
  name: string;
  year: number;
  session: Session;
  examDate: string;
  location: string;
  registrationStart: string;
  registrationEnd: string;
  description?: string | null;
  examInfoLocation?: string | null;
  examInfoStartTime?: string | null;
  examInfoMethod?: string | null;
  examInfoDurationMinutes?: number | null;
  active: boolean;
}

interface ExamForm {
  name: string;
  year: string;
  session: Session;
  examDate: string;
  location: string;
  registrationStart: string;
  registrationEnd: string;
  description: string;
  examInfoLocation: string;
  examInfoStartTime: string;
  examInfoMethod: string;
  examInfoDurationMinutes: string;
  isActive: boolean;
}

const EMPTY_EXAMS: ExamRecord[] = [];

function AdminExamPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [deleteFor, setDeleteFor] = useState<ExamRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ExamForm>(() => emptyForm());

  const { data: examData, isLoading } = useQuery({
    queryKey: ["admin", "exams"],
    queryFn: () => apiGet<ExamRecord[]>("/api/admin/exam/all"),
  });
  const exams = useMemo(
    () => (examData ?? EMPTY_EXAMS).filter((exam) => exam.active !== false),
    [examData],
  );

  const selectedExam = exams.find((exam) => exam.id === selectedExamId) ?? null;
  const openExamCount = exams.filter((exam) =>
    isRegistrationOpen(exam.registrationStart, exam.registrationEnd),
  ).length;
  const closedExamCount = exams.length - openExamCount;

  useEffect(() => {
    if (isCreating) return;
    if (selectedExamId && !exams.some((exam) => exam.id === selectedExamId)) {
      setSelectedExamId(null);
      setForm(emptyForm());
    }
  }, [exams, isCreating, selectedExamId]);

  useEffect(() => {
    if (isCreating || !selectedExam) return;
    setForm(formFromExam(selectedExam));
  }, [isCreating, selectedExam]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const validationMessage = validateExamForm(form, lang);
      if (validationMessage) {
        throw new Error(validationMessage);
      }
      const payload = formToPayload(form);
      if (selectedExam && !isCreating) {
        return apiPatch<ExamRecord>(`/api/admin/exam/${selectedExam.id}`, payload);
      }
      return apiPost<ExamRecord>("/api/admin/exam", payload);
    },
    onSuccess: (saved) => {
      toast.success(lang === "mn" ? "Шалгалтын мэдээлэл хадгалагдлаа" : "Exam information saved");
      qc.setQueryData<ExamRecord[]>(["admin", "exams"], (old) => {
        const current = old ?? [];
        const index = current.findIndex((exam) => exam.id === saved.id);
        if (index === -1) return [...current, saved];
        return current.map((exam) => (exam.id === saved.id ? saved : exam));
      });
      closeEditor();
      void invalidateExamData(qc);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/api/admin/exam/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "exams"] });
      const previousExams = qc.getQueryData<ExamRecord[]>(["admin", "exams"]);
      qc.setQueryData<ExamRecord[]>(["admin", "exams"], (old) =>
        (old ?? []).filter((exam) => exam.id !== id),
      );
      if (selectedExamId === id) {
        setSelectedExamId(null);
        setForm(emptyForm());
      }
      setDeleteFor(null);
      return { previousExams };
    },
    onSuccess: () => {
      toast.success(lang === "mn" ? "Шалгалт устгагдлаа" : "Exam deleted");
      setIsCreating(false);
    },
    onError: (err, _id, context) => {
      if (context?.previousExams) {
        qc.setQueryData(["admin", "exams"], context.previousExams);
      }
      toast.error(err instanceof Error ? err.message : "Delete failed");
    },
    onSettled: () => {
      void invalidateExamData(qc);
    },
  });

  function startCreate() {
    setIsCreating(true);
    setSelectedExamId(null);
    setForm(emptyForm());
  }

  function closeEditor() {
    setIsCreating(false);
    setSelectedExamId(null);
    setForm(emptyForm());
  }

  function selectExam(id: string) {
    setIsCreating(false);
    setSelectedExamId(id);
  }

  const editorOpen = isCreating || Boolean(selectedExam);

  const saveLabel =
    isCreating || !selectedExam
      ? lang === "mn"
        ? "Шинээр үүсгэх"
        : "Create"
      : lang === "mn"
        ? "Өөрчлөлт хадгалах"
        : "Save changes";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminPageHeader
        icon={BookOpen}
        eyebrow={lang === "mn" ? "Шалгалтын тохиргоо" : "Exam setup"}
        title={lang === "mn" ? "Шалгалт удирдах" : "Exam management"}
        description={
          lang === "mn"
            ? "Идэвхтэй шалгалтын бүртгэл, хугацаа болон шалгалтын нэмэлт зааврыг удирдана."
            : "Manage active exam records, registration windows, and exam instructions."
        }
        actions={
          <Button type="button" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            {lang === "mn" ? "Шинэ шалгалт" : "New exam"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AdminMetricCard
          icon={BookOpen}
          label={lang === "mn" ? "Идэвхтэй шалгалт" : "Active exams"}
          value={exams.length}
          helper={lang === "mn" ? "Нээлттэй бүртгэлүүд" : "Open records"}
          tone="blue"
        />
        <AdminMetricCard
          icon={CalendarDays}
          label={lang === "mn" ? "Бүртгэл нээлттэй" : "Registration open"}
          value={openExamCount}
          helper={lang === "mn" ? "Одоо бүртгэл авч буй" : "Accepting applications now"}
          tone="emerald"
        />
        <AdminMetricCard
          icon={Clock3}
          label={lang === "mn" ? "Бүртгэл хаалттай" : "Registration closed"}
          value={closedExamCount}
          helper={lang === "mn" ? "Одоогоор бүртгэл авахгүй" : "Not currently accepting"}
          tone="teal"
        />
      </div>

      <div className={cn("grid gap-6", editorOpen && "xl:grid-cols-[380px_minmax(0,1fr)]")}>
        <AdminPanel
          title={lang === "mn" ? "Одоогийн шалгалтууд" : "Current exams"}
          description={
            lang === "mn" ? "Засах шалгалтаа сонгоно уу." : "Select an exam to edit its details."
          }
        >
          {isLoading ? (
            <div className="py-10 text-center">
              <Clock3 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : exams.length === 0 ? (
            <AdminEmptyState>
              {lang === "mn" ? "Идэвхтэй шалгалт алга." : "No active exams."}
            </AdminEmptyState>
          ) : (
            <div className="space-y-2">
              {exams.map((exam) => {
                const selected = exam.id === selectedExamId && !isCreating;
                const registrationOpen = isRegistrationOpen(
                  exam.registrationStart,
                  exam.registrationEnd,
                );

                return (
                  <div
                    key={exam.id}
                    className={cn(
                      "rounded-lg border bg-background p-3 transition-colors",
                      selected ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                    )}
                  >
                    <button
                      type="button"
                      className="w-full min-w-0 text-left"
                      onClick={() => selectExam(exam.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold">{exam.name}</span>
                            {selected && <Pencil className="h-3.5 w-3.5 shrink-0 text-primary" />}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{exam.year}</span>
                            <span>{sessionLabel(exam.session, lang)}</span>
                            <span>{exam.examDate}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0",
                            registrationOpen
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "bg-white text-muted-foreground",
                          )}
                        >
                          {registrationOpen
                            ? lang === "mn"
                              ? "Нээлттэй"
                              : "Open"
                            : lang === "mn"
                              ? "Хаалттай"
                              : "Closed"}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="min-w-0 truncate">{exam.location}</span>
                      </div>
                    </button>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={selected ? "default" : "outline"}
                        onClick={() => selectExam(exam.id)}
                      >
                        <Pencil className="h-4 w-4" />
                        {lang === "mn" ? "Засах" : "Edit"}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title={lang === "mn" ? "Устгах" : "Delete"}
                        disabled={deleteMut.isPending}
                        onClick={() => setDeleteFor(exam)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AdminPanel>

        {editorOpen && (
          <div className="space-y-6">
            <AdminPanel
              title={lang === "mn" ? "Үндсэн мэдээлэл" : "Exam details"}
              description={
                isCreating
                  ? lang === "mn"
                    ? "Шинэ шалгалтын мэдээллийг бөглөнө үү."
                    : "Fill in the new exam details."
                  : selectedExam?.name
              }
              actions={
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeEditor}>
                    {lang === "mn" ? "Болих" : "Cancel"}
                  </Button>
                  <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                    {saveMut.isPending ? (
                      <Clock3 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saveLabel}
                  </Button>
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={lang === "mn" ? "Шалгалтын нэр" : "Exam name"}>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label={lang === "mn" ? "Он" : "Year"}>
                  <Input
                    type="number"
                    required
                    min="2000"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  />
                </Field>
                <Field label="Session">
                  <Select
                    value={form.session}
                    onValueChange={(value) => setForm({ ...form, session: value as Session })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST">{sessionLabel("FIRST", lang)}</SelectItem>
                      <SelectItem value="SECOND">{sessionLabel("SECOND", lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={lang === "mn" ? "Шалгалтын огноо" : "Exam date"}>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      type="date"
                      required
                      value={form.examDate}
                      onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label={lang === "mn" ? "Байршил" : "Location"}>
                  <Input
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </Field>
                <Field label={lang === "mn" ? "Бүртгэл эхлэх" : "Registration start"}>
                  <Input
                    type="date"
                    required
                    value={form.registrationStart}
                    onChange={(e) => setForm({ ...form, registrationStart: e.target.value })}
                  />
                </Field>
                <Field label={lang === "mn" ? "Бүртгэл дуусах" : "Registration end"}>
                  <Input
                    type="date"
                    required
                    value={form.registrationEnd}
                    onChange={(e) => setForm({ ...form, registrationEnd: e.target.value })}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label={lang === "mn" ? "Тайлбар" : "Description"}>
                    <Textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(value) => setForm({ ...form, isActive: value })}
                    />
                    <Label>{lang === "mn" ? "Идэвхтэй" : "Active"}</Label>
                  </div>
                </div>
              </div>
            </AdminPanel>

            <AdminPanel
              title={lang === "mn" ? "Шалгалтын нэмэлт мэдээлэл" : "Additional exam information"}
              description={
                lang === "mn"
                  ? "Оюутанд харагдах байр, цаг, үргэлжлэх хугацаа, заавар."
                  : "Venue, start time, duration, and method visible to students."
              }
              actions={
                <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                  {saveMut.isPending ? (
                    <Clock3 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {lang === "mn" ? "Мэдээлэл хадгалах" : "Save information"}
                </Button>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={lang === "mn" ? "Шалгалт авах газар" : "Exam venue"}>
                  <Input
                    value={form.examInfoLocation}
                    onChange={(e) => setForm({ ...form, examInfoLocation: e.target.value })}
                  />
                </Field>
                <Field label={lang === "mn" ? "Эхлэх цаг" : "Start time"}>
                  <Input
                    type="time"
                    value={form.examInfoStartTime}
                    onChange={(e) => setForm({ ...form, examInfoStartTime: e.target.value })}
                  />
                </Field>
                <Field label={lang === "mn" ? "Хугацаа (минут)" : "Duration (minutes)"}>
                  <Input
                    type="number"
                    min="1"
                    value={form.examInfoDurationMinutes}
                    onChange={(e) => setForm({ ...form, examInfoDurationMinutes: e.target.value })}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label={lang === "mn" ? "Хэрхэн авах" : "Method"}>
                    <Textarea
                      rows={4}
                      value={form.examInfoMethod}
                      onChange={(e) => setForm({ ...form, examInfoMethod: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </AdminPanel>
          </div>
        )}
      </div>

      <Dialog open={!!deleteFor} onOpenChange={(open) => !open && setDeleteFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "mn" ? "Шалгалт устгах" : "Delete exam"}</DialogTitle>
            <DialogDescription>
              {lang === "mn"
                ? `${deleteFor?.name ?? ""} шалгалтыг устгах уу?`
                : `Delete ${deleteFor?.name ?? ""}?`}
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
              {deleteMut.isPending && <Clock3 className="h-4 w-4 animate-spin" />}
              {lang === "mn" ? "Устгах" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function emptyForm(): ExamForm {
  return {
    name: "",
    year: String(new Date().getFullYear()),
    session: "FIRST",
    examDate: "",
    location: "",
    registrationStart: "",
    registrationEnd: "",
    description: "",
    examInfoLocation: "",
    examInfoStartTime: "",
    examInfoMethod: "",
    examInfoDurationMinutes: "",
    isActive: true,
  };
}

function formFromExam(exam: ExamRecord): ExamForm {
  return {
    name: exam.name,
    year: String(exam.year),
    session: exam.session,
    examDate: exam.examDate,
    location: exam.location,
    registrationStart: exam.registrationStart,
    registrationEnd: exam.registrationEnd,
    description: exam.description ?? "",
    examInfoLocation: exam.examInfoLocation ?? "",
    examInfoStartTime: toTimeInputValue(exam.examInfoStartTime),
    examInfoMethod: exam.examInfoMethod ?? "",
    examInfoDurationMinutes:
      exam.examInfoDurationMinutes == null ? "" : String(exam.examInfoDurationMinutes),
    isActive: exam.active,
  };
}

function formToPayload(form: ExamForm) {
  return {
    name: form.name,
    year: Number(form.year),
    session: form.session,
    examDate: form.examDate,
    location: form.location,
    totalSeats: 0,
    registrationStart: form.registrationStart,
    registrationEnd: form.registrationEnd,
    description: blankToNull(form.description),
    examInfoLocation: blankToNull(form.examInfoLocation),
    examInfoStartTime: form.examInfoStartTime || null,
    examInfoMethod: blankToNull(form.examInfoMethod),
    examInfoDurationMinutes: form.examInfoDurationMinutes
      ? Number(form.examInfoDurationMinutes)
      : null,
    isActive: form.isActive,
  };
}

function validateExamForm(form: ExamForm, lang: "mn" | "en"): string | null {
  const requiredMessage =
    lang === "mn"
      ? "Шалгалтын нэр, огноо, байршил, бүртгэлийн эхлэх/дуусах огноог бүрэн бөглөнө үү."
      : "Please fill in the exam name, date, location, and registration dates.";
  if (
    !form.name.trim() ||
    !form.examDate ||
    !form.location.trim() ||
    !form.registrationStart ||
    !form.registrationEnd
  ) {
    return requiredMessage;
  }

  const year = Number(form.year);
  if (!Number.isInteger(year) || year < 2000) {
    return lang === "mn" ? "Оныг зөв оруулна уу." : "Enter a valid year.";
  }

  if (form.registrationEnd < form.registrationStart) {
    return lang === "mn"
      ? "Бүртгэл дуусах огноо эхлэх огнооноос өмнө байж болохгүй."
      : "Registration end date cannot be before the start date.";
  }

  if (form.examInfoDurationMinutes) {
    const duration = Number(form.examInfoDurationMinutes);
    if (!Number.isInteger(duration) || duration < 1) {
      return lang === "mn"
        ? "Хугацааг минутаар зөв оруулна уу."
        : "Enter a valid duration in minutes.";
    }
  }

  return null;
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toTimeInputValue(value?: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function sessionLabel(session: Session, lang: "mn" | "en"): string {
  if (lang !== "mn") return session === "FIRST" ? "First" : "Second";
  return session === "FIRST" ? "Эхний" : "Хоёр дахь";
}

async function invalidateExamData(qc: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ["admin", "exams"] }),
    qc.invalidateQueries({ queryKey: ["admin", "exam"] }),
    qc.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
    qc.invalidateQueries({ queryKey: ["admin", "stats"] }),
    qc.invalidateQueries({ queryKey: ["student", "exams"] }),
  ]);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
