import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiGet } from "@/lib/api";
import { useLang } from "../contexts/LangContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Loader2,
  Clock,
  CalendarSearch,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatDate, isRegistrationOpen, sessionLabel } from "@/lib/eju-format";
import { ExamRegistrationSheet, type ExamInfo } from "@/components/ExamRegistrationSheet";

export const Route = createFileRoute("/student/exams")({
  head: () => ({ meta: [{ title: "Идэвхтэй шалгалтууд | EJU" }] }),
  component: StudentExams,
});

interface Exam {
  id: string;
  name: string;
  examDate: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  registrationStart: string;
  registrationEnd: string;
  session: "FIRST" | "SECOND";
  year: number;
  active: boolean;
}

function StudentExams() {
  const { lang } = useLang();
  const [selectedExam, setSelectedExam] = useState<ExamInfo | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["student", "exams"],
    queryFn: () => apiGet<Exam[]>("/api/student/exams"),
  });

  function openRegistration(exam: Exam) {
    setSelectedExam({
      id: exam.id,
      name: exam.name,
      year: exam.year,
      session: sessionLabel(exam.session.toLowerCase() as "first" | "second", lang),
      examDate: formatDate(exam.examDate, lang),
      registrationEnd: formatDate(exam.registrationEnd, lang),
      location: exam.location,
    });
    setSheetOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openExams = exams.filter((e) =>
    isRegistrationOpen(e.registrationStart, e.registrationEnd),
  );
  const closedExams = exams.filter(
    (e) => !isRegistrationOpen(e.registrationStart, e.registrationEnd),
  );

  return (
    <div className="max-w-5xl space-y-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary/60 mb-1.5">
          <CalendarSearch className="h-3.5 w-3.5" />
          {lang === "mn" ? "EJU шалгалтууд" : "EJU exams"}
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {lang === "mn" ? "Идэвхтэй Шалгалтууд" : "Active Exams"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
          {lang === "mn"
            ? "Шалгалтыг сонгоод бүртгэлийн маягтаа бөглөнө үү. Бүртгэл нээлттэй байх хугацаанд бүртгүүлэх боломжтой."
            : "Select an exam and fill in the registration form. You can register while the registration window is open."}
        </p>
      </div>

      {exams.length === 0 ? (
        <Card className="shadow-card border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CalendarSearch className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {lang === "mn" ? "Нээлттэй шалгалт байхгүй" : "No exams available"}
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === "mn"
                ? "Одоогоор шалгалт байхгүй байна. Дараа шалгана уу."
                : "There are no exams at the moment. Please check back later."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Open exams */}
          {openExams.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-foreground">
                  {lang === "mn" ? "Бүртгэл нээлттэй" : "Registration open"}
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({openExams.length})
                  </span>
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {openExams.map((e) => (
                  <ExamCard
                    key={e.id}
                    exam={e}
                    lang={lang}
                    onRegister={() => openRegistration(e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Closed exams */}
          {closedExams.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {lang === "mn" ? "Бүртгэл хаалттай" : "Registration closed"}
                  <span className="ml-2 font-normal">({closedExams.length})</span>
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 opacity-70">
                {closedExams.map((e) => (
                  <ExamCard
                    key={e.id}
                    exam={e}
                    lang={lang}
                    onRegister={() => openRegistration(e)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Registration slide-over */}
      <ExamRegistrationSheet
        exam={selectedExam}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}

/* ─── Exam card ──────────────────────────────────────────────────── */
function ExamCard({
  exam,
  lang,
  onRegister,
}: {
  exam: Exam;
  lang: string;
  onRegister: () => void;
}) {
  const open = isRegistrationOpen(exam.registrationStart, exam.registrationEnd);
  const seatsLeft = exam.availableSeats;
  const fillPct = Math.min(100, ((exam.totalSeats - seatsLeft) / exam.totalSeats) * 100);
  const almostFull = seatsLeft < exam.totalSeats * 0.2;

  return (
    <Card
      className={`overflow-hidden shadow-card transition-all duration-200 hover:shadow-elegant ${
        open ? "cursor-pointer hover:-translate-y-0.5" : ""
      }`}
      onClick={open ? onRegister : undefined}
    >
      {/* Top accent */}
      <div
        className={`h-1 w-full ${
          open
            ? "bg-gradient-to-r from-primary to-[oklch(0.55_0.18_280)]"
            : "bg-muted"
        }`}
      />

      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base leading-tight text-foreground">{exam.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sessionLabel(exam.session.toLowerCase() as "first" | "second", lang)} · {exam.year}
            </p>
          </div>
          <Badge
            className={`shrink-0 text-[11px] font-semibold border ${
              open
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-muted text-muted-foreground border-border"
            }`}
            variant="outline"
          >
            {open
              ? lang === "mn" ? "✓ Нээлттэй" : "✓ Open"
              : lang === "mn" ? "Хаалттай" : "Closed"}
          </Badge>
        </div>

        {/* Info */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(exam.examDate, lang)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{exam.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>
              {lang === "mn" ? "Дуусах:" : "Closes:"}{" "}
              <span className="font-medium text-foreground">
                {formatDate(exam.registrationEnd, lang)}
              </span>
            </span>
          </div>
        </div>

        {/* Seats bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              {lang === "mn" ? "Суудал" : "Seats"}
            </span>
            <span className={`font-medium ${almostFull ? "text-rose-600" : "text-foreground"}`}>
              {seatsLeft}/{exam.totalSeats}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                almostFull ? "bg-rose-500" : fillPct > 60 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* Divider + CTA */}
        <div className="border-t border-border pt-3">
          <Button
            className={`w-full font-semibold text-sm transition-all ${
              open
                ? "bg-gradient-to-r from-primary to-[oklch(0.45_0.16_280)] hover:opacity-90 shadow-soft text-white"
                : "cursor-not-allowed"
            }`}
            disabled={!open}
            onClick={(e) => {
              e.stopPropagation();
              if (open) onRegister();
            }}
          >
            {lang === "mn" ? "Бүртгүүлэх" : "Register"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {open && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              {lang === "mn" ? "Дарж бүртгэлийн маягтыг нэмэ үү" : "Click to open registration form"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
