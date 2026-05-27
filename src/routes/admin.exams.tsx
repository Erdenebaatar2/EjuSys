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
import {
  Banknote,
  BookOpen,
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isRegistrationOpen } from "@/lib/eju-format";

export const Route = createFileRoute("/admin/exams")({
  head: () => ({ meta: [{ title: "Админ - Шалгалтууд | EJU" }] }),
  component: AdminExamPage,
});

type Session = "FIRST" | "SECOND" | "THIRD";
type ExamHost = "ULAANBAATAR" | "DARKHAN" | "ERDENET";

interface ExamRecord {
  id: string;
  name: string;
  year: number;
  session: Session;
  examRound?: number | null;
  examHost?: ExamHost | null;
  hostCity?: string | null;
  examDate: string;
  location: string;
  examFee: number;
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
  year: string;
  session: Session;
  examRound: string;
  examHost: ExamHost;
  examDate: string;
  examFee: string;
  registrationStart: string;
  registrationEnd: string;
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
  const exams = useMemo(() => examData ?? EMPTY_EXAMS, [examData]);

  const selectedExam = exams.find((exam) => exam.id === selectedExamId) ?? null;
  const openExamCount = exams.filter(
    (exam) =>
      exam.active !== false && isRegistrationOpen(exam.registrationStart, exam.registrationEnd),
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
        (old ?? []).map((exam) => (exam.id === id ? { ...exam, active: false } : exam)),
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
            ? "Шалгалтын бүртгэл, хугацаа болон шалгалтын нэмэлт зааврыг удирдана."
            : "Manage exam records, registration windows, and exam instructions."
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
          label={lang === "mn" ? "Нийт шалгалт" : "All exams"}
          value={exams.length}
          helper={lang === "mn" ? "Идэвхтэй болон хаалттай" : "Active and closed records"}
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
            <AdminEmptyState>{lang === "mn" ? "Шалгалт алга." : "No exams."}</AdminEmptyState>
          ) : (
            <div className="space-y-2">
              {exams.map((exam) => {
                const selected = exam.id === selectedExamId && !isCreating;
                const registrationOpen =
                  exam.active !== false &&
                  isRegistrationOpen(exam.registrationStart, exam.registrationEnd);

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
                            <span>{roundLabel(exam.examRound, exam.session, lang)}</span>
                            <span>{exam.examDate}</span>
                            <span>{formatCurrency(exam.examFee)}</span>
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
                              ? "OPEN / ACTIVE"
                              : "OPEN / ACTIVE"
                            : lang === "mn"
                              ? "CLOSED / INACTIVE"
                              : "CLOSED / INACTIVE"}
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
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        session: value as Session,
                        examRound: String(sessionToRound(value as Session)),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST">{sessionLabel("FIRST", lang)}</SelectItem>
                      <SelectItem value="SECOND">{sessionLabel("SECOND", lang)}</SelectItem>
                      <SelectItem value="THIRD">{sessionLabel("THIRD", lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={lang === "mn" ? "Шалгалтын дугаар" : "Exam round"}>
                  <Input
                    type="number"
                    required
                    min="1"
                    value={form.examRound}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({
                        ...form,
                        examRound: value,
                        session: roundToSessionValue(Number(value)),
                      });
                    }}
                  />
                </Field>
                <Field label={lang === "mn" ? "Шалгалт зохион байгуулагдах хот" : "Exam host city"}>
                  <Select
                    value={form.examHost}
                    onValueChange={(value) => setForm({ ...form, examHost: value as ExamHost })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ULAANBAATAR">Улаанбаатар</SelectItem>
                      <SelectItem value="DARKHAN">Дархан</SelectItem>
                      <SelectItem value="ERDENET">Эрдэнэт</SelectItem>
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
                <Field label={lang === "mn" ? "Шалгалтын үнэ" : "Exam fee"}>
                  <div className="relative">
                    <Banknote className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      type="number"
                      required
                      min="1"
                      value={form.examFee}
                      onChange={(e) => setForm({ ...form, examFee: e.target.value })}
                    />
                  </div>
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
                  ? "Оюутанд харагдах эхлэх цаг, үргэлжлэх хугацаа, заавар."
                  : "Start time, duration, and method visible to students."
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
    year: String(new Date().getFullYear()),
    session: "FIRST",
    examRound: "1",
    examHost: "ULAANBAATAR",
    examDate: "",
    examFee: "70000",
    registrationStart: "",
    registrationEnd: "",
    examInfoStartTime: "",
    examInfoMethod: "",
    examInfoDurationMinutes: "",
    isActive: true,
  };
}

function formFromExam(exam: ExamRecord): ExamForm {
  return {
    year: String(exam.year),
    session: exam.session,
    examRound: String(exam.examRound ?? sessionToRound(exam.session)),
    examHost: exam.examHost ?? inferExamHost(exam.location),
    examDate: exam.examDate,
    examFee: String(exam.examFee ?? 70000),
    registrationStart: exam.registrationStart,
    registrationEnd: exam.registrationEnd,
    examInfoStartTime: toTimeInputValue(exam.examInfoStartTime),
    examInfoMethod: exam.examInfoMethod ?? "",
    examInfoDurationMinutes:
      exam.examInfoDurationMinutes == null ? "" : String(exam.examInfoDurationMinutes),
    isActive: exam.active,
  };
}

function formToPayload(form: ExamForm) {
  return {
    year: Number(form.year),
    session: form.session,
    examRound: Number(form.examRound),
    examHost: form.examHost,
    hostCity: hostCityLabel(form.examHost),
    examDate: form.examDate,
    examFee: Number(form.examFee),
    totalSeats: 0,
    registrationStart: form.registrationStart,
    registrationEnd: form.registrationEnd,
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
      ? "Шалгалтын он, session, зохион байгуулагдах хот, огноо, бүртгэлийн эхлэх/дуусах огноог бүрэн бөглөнө үү."
      : "Please fill in year, session, host city, exam date, and registration dates.";
  if (!form.examDate || !form.examHost || !form.registrationStart || !form.registrationEnd) {
    return requiredMessage;
  }

  const year = Number(form.year);
  if (!Number.isInteger(year) || year < 2000) {
    return lang === "mn" ? "Оныг зөв оруулна уу." : "Enter a valid year.";
  }

  const examRound = Number(form.examRound);
  if (!Number.isInteger(examRound) || examRound < 1) {
    return lang === "mn"
      ? "Шалгалтын дугаарыг эерэг бүхэл тоогоор оруулна уу."
      : "Enter a positive whole number for the exam round.";
  }

  if (form.registrationEnd < form.registrationStart) {
    return lang === "mn"
      ? "Бүртгэл дуусах огноо эхлэх огнооноос өмнө байж болохгүй."
      : "Registration end date cannot be before the start date.";
  }

  const examFee = Number(form.examFee);
  if (!Number.isInteger(examFee) || examFee <= 0) {
    return lang === "mn" ? "Шалгалтын үнийн дүнг зөв оруулна уу." : "Enter a valid exam fee.";
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

function hostCityLabel(host: ExamHost): string {
  const labels: Record<ExamHost, string> = {
    ULAANBAATAR: "Улаанбаатар",
    DARKHAN: "Дархан",
    ERDENET: "Эрдэнэт",
  };
  return labels[host];
}

function inferExamHost(location?: string | null): ExamHost {
  const normalized = (location ?? "").toLowerCase();
  if (normalized.includes("дархан")) return "DARKHAN";
  if (normalized.includes("эрдэнэт")) return "ERDENET";
  return "ULAANBAATAR";
}

function toTimeInputValue(value?: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function formatCurrency(value?: number | null): string {
  return `${(value ?? 0).toLocaleString()} ₮`;
}

function sessionLabel(session: Session, lang: "mn" | "en"): string {
  if (lang !== "mn") {
    if (session === "SECOND") return "Second";
    if (session === "THIRD") return "Third";
    return "First";
  }
  if (session === "SECOND") return "Хоёр дахь";
  if (session === "THIRD") return "Гурав дахь";
  return "Эхний";
}

function roundLabel(
  examRound: number | null | undefined,
  session: Session,
  lang: "mn" | "en",
): string {
  const round = examRound ?? sessionToRound(session);
  return lang === "mn" ? `${round}-р шалгалт` : `Round ${round}`;
}

function sessionToRound(session: Session): number {
  if (session === "SECOND") return 2;
  if (session === "THIRD") return 3;
  return 1;
}

function roundToSessionValue(round: number): Session {
  if (round === 2) return "SECOND";
  if (round === 3) return "THIRD";
  return "FIRST";
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
