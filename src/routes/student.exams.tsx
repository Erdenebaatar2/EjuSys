import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import type { Lang } from "@/lib/i18n";
import {
  StudentEmptyState,
  StudentMetricCard,
  StudentPageHeader,
  StudentPanel,
} from "@/components/student/StudentPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CalendarSearch,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Info,
  Loader2,
  MapPin,
  FileText,
  Timer,
} from "lucide-react";
import { formatDate, isRegistrationOpen, sessionLabel } from "@/lib/eju-format";
import { ExamRegistrationSheet, type ExamInfo } from "@/components/ExamRegistrationSheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/exams")({
  head: () => ({ meta: [{ title: "Шалгалтын мэдээлэл | EJU" }] }),
  component: StudentExams,
});

interface ExistingApplication {
  id: string;
  applicationNumber?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
}

interface Exam {
  id: string;
  name: string;
  examDate: string;
  location: string;
  registrationStart: string;
  registrationEnd: string;
  session: "FIRST" | "SECOND";
  year: number;
  active: boolean;
  examInfoLocation?: string | null;
  examInfoStartTime?: string | null;
  examInfoMethod?: string | null;
  examInfoDurationMinutes?: number | null;
  existingApplication?: ExistingApplication | null;
}

interface StudentApplication {
  id: string;
  applicationNumber?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  exam?: {
    id?: string | null;
    name?: string | null;
    examDate?: string | null;
  } | null;
}

function StudentExams() {
  const { lang }: { lang: Lang } = useLang();
  const [selectedExam, setSelectedExam] = useState<ExamInfo | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoExam, setInfoExam] = useState<Exam | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["student", "exams"],
    queryFn: () => apiGet<Exam[]>("/api/student/exams"),
  });

  const { data: application, isLoading: applicationLoading } = useQuery({
    queryKey: ["student", "application"],
    queryFn: () => apiGet<StudentApplication | undefined>("/api/student/application"),
  });

  function openRegistration(exam: Exam) {
    if (exam.existingApplication) return;
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

  function openInfo(exam: Exam) {
    setInfoExam(exam);
    setInfoOpen(true);
  }

  if (examsLoading || applicationLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const examsWithApplication = exams.map((exam) => {
    if (!application || exam.existingApplication || !isSameApplicationExam(application, exam)) {
      return exam;
    }

    return {
      ...exam,
      existingApplication: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        paymentStatus: application.paymentStatus,
      },
    };
  });

  const openExams = examsWithApplication.filter((exam) =>
    isRegistrationOpen(exam.registrationStart, exam.registrationEnd),
  );
  const closedExams = examsWithApplication.filter(
    (exam) => !isRegistrationOpen(exam.registrationStart, exam.registrationEnd),
  );
  const registeredCount = examsWithApplication.filter((exam) => exam.existingApplication).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <StudentPageHeader
        icon={CalendarSearch}
        eyebrow="EJU"
        title={lang === "mn" ? "Шалгалтын мэдээлэл" : "Exam information"}
        description={
          lang === "mn"
            ? "Шалгалтын огноо, байршил болон бүртгэлийн хугацааны мэдээлэл."
            : "Exam date, location, and registration window."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StudentMetricCard
          icon={CheckCircle2}
          label={lang === "mn" ? "Бүртгэл нээлттэй" : "Open exams"}
          value={openExams.length}
          tone="emerald"
        />
        <StudentMetricCard
          icon={CalendarDays}
          label={lang === "mn" ? "Нийт шалгалт" : "Total exams"}
          value={examsWithApplication.length}
          tone="blue"
        />
        <StudentMetricCard
          icon={ClipboardList}
          label={lang === "mn" ? "Миний бүртгэл" : "Registered"}
          value={registeredCount}
          tone="teal"
        />
        <StudentMetricCard
          icon={AlertCircle}
          label={lang === "mn" ? "Хаалттай" : "Closed"}
          value={closedExams.length}
          tone="amber"
        />
      </div>

      {exams.length === 0 ? (
        <StudentPanel>
          <StudentEmptyState>
            {lang === "mn"
              ? "Одоогоор шалгалтын мэдээлэл ороогүй байна."
              : "There is no exam information at the moment. Please check back later."}
          </StudentEmptyState>
        </StudentPanel>
      ) : (
        <>
          <StudentPanel
            title={lang === "mn" ? "Бүртгэл нээлттэй" : "Registration open"}
            description={
              lang === "mn"
                ? "Одоогоор бүртгэл авч буй шалгалтууд."
                : "Exams currently accepting applications."
            }
          >
            {openExams.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {openExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    lang={lang}
                    onRegister={() => openRegistration(exam)}
                    onViewInfo={() => openInfo(exam)}
                  />
                ))}
              </div>
            ) : (
              <StudentEmptyState>
                {lang === "mn"
                  ? "Одоогоор нээлттэй шалгалт алга."
                  : "There are no open exams right now."}
              </StudentEmptyState>
            )}
          </StudentPanel>

          {closedExams.length > 0 && (
            <StudentPanel
              title={lang === "mn" ? "Бүртгэл хаалттай" : "Registration closed"}
              description={
                lang === "mn"
                  ? "Өмнөх болон бүртгэл хаагдсан шалгалтууд."
                  : "Past or closed registration periods."
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                {closedExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    lang={lang}
                    muted
                    onRegister={() => openRegistration(exam)}
                    onViewInfo={() => openInfo(exam)}
                  />
                ))}
              </div>
            </StudentPanel>
          )}
        </>
      )}

      <ExamRegistrationSheet
        exam={selectedExam}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
      <ExamInfoDialog
        exam={infoExam}
        lang={lang}
        open={infoOpen}
        onOpenChange={(nextOpen) => {
          setInfoOpen(nextOpen);
          if (!nextOpen) setInfoExam(null);
        }}
      />
    </div>
  );
}

function ExamCard({
  exam,
  lang,
  muted = false,
  onRegister,
  onViewInfo,
}: {
  exam: Exam;
  lang: Lang;
  muted?: boolean;
  onRegister: () => void;
  onViewInfo: () => void;
}) {
  const open = isRegistrationOpen(exam.registrationStart, exam.registrationEnd);
  const existingApplication = exam.existingApplication;
  const isRegistered = Boolean(existingApplication);
  const canRegister = open && !isRegistered;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card shadow-card transition-all duration-200",
        canRegister && "cursor-pointer hover:-translate-y-0.5 hover:shadow-elegant",
        muted && "opacity-75",
      )}
      onClick={canRegister ? onRegister : undefined}
    >
      <div className={cn("h-1", open ? "bg-primary" : "bg-muted")} />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">{exam.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sessionLabel(exam.session.toLowerCase() as "first" | "second", lang)} · {exam.year}
            </p>
          </div>
          <ExamStatusBadge open={open} registered={isRegistered} lang={lang} />
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <IconLine icon={CalendarDays} text={formatDate(exam.examDate, lang)} />
          <IconLine icon={MapPin} text={exam.location} />
          <IconLine
            icon={Clock3}
            text={`${lang === "mn" ? "Дуусах:" : "Closes:"} ${formatDate(
              exam.registrationEnd,
              lang,
            )}`}
          />
        </div>

        {isRegistered && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{lang === "mn" ? "Бүртгэгдсэн" : "Registered"}</span>
            {existingApplication?.applicationNumber && (
              <span className="ml-auto min-w-0 truncate font-mono text-xs text-emerald-700">
                {existingApplication.applicationNumber}
              </span>
            )}
          </div>
        )}

        <div className="grid gap-2 border-t pt-4 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={(event) => {
              event.stopPropagation();
              onViewInfo();
            }}
          >
            <Info className="h-4 w-4" />
            {lang === "mn" ? "Мэдээлэл" : "Info"}
          </Button>
          {isRegistered ? (
            <Button
              asChild
              variant="outline"
              className="w-full border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              <Link
                to="/student/applications/$id"
                params={{ id: existingApplication?.id ?? "" }}
                onClick={(event) => event.stopPropagation()}
              >
                <FileText className="h-4 w-4" />
                {lang === "mn" ? "Applicant form" : "Applicant form"}
              </Link>
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={!open}
              onClick={(event) => {
                event.stopPropagation();
                if (open) onRegister();
              }}
            >
              {lang === "mn" ? "Бүртгүүлэх" : "Register"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ExamStatusBadge({
  open,
  registered,
  lang,
}: {
  open: boolean;
  registered: boolean;
  lang: Lang;
}) {
  const label = registered
    ? lang === "mn"
      ? "Бүртгэгдсэн"
      : "Registered"
    : open
      ? lang === "mn"
        ? "Нээлттэй"
        : "Open"
      : lang === "mn"
        ? "Хаалттай"
        : "Closed";

  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0",
        registered || open
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </Badge>
  );
}

function IconLine({
  icon: Icon,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function ExamInfoDialog({
  exam,
  lang,
  open,
  onOpenChange,
}: {
  exam: Exam | null;
  lang: Lang;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!exam) return null;

  const rows = [
    {
      icon: MapPin,
      label: lang === "mn" ? "Шалгалт авах газар" : "Exam venue",
      value: exam.examInfoLocation,
    },
    {
      icon: Clock3,
      label: lang === "mn" ? "Эхлэх цаг" : "Start time",
      value: exam.examInfoStartTime ? exam.examInfoStartTime.slice(0, 5) : "",
    },
    {
      icon: ClipboardList,
      label: lang === "mn" ? "Хэрхэн авах" : "Method",
      value: exam.examInfoMethod,
    },
    {
      icon: Timer,
      label: lang === "mn" ? "Хугацаа" : "Duration",
      value:
        exam.examInfoDurationMinutes == null
          ? ""
          : lang === "mn"
            ? `${exam.examInfoDurationMinutes} минут`
            : `${exam.examInfoDurationMinutes} minutes`,
    },
  ].filter((row) => row.value && row.value.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{lang === "mn" ? "Шалгалтын мэдээлэл" : "Exam information"}</DialogTitle>
          <DialogDescription>
            {exam.name} · {exam.year} ·{" "}
            {sessionLabel(exam.session.toLowerCase() as "first" | "second", lang)}
          </DialogDescription>
        </DialogHeader>

        {rows.length > 0 ? (
          <div className="grid gap-3">
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex gap-3 rounded-lg border bg-muted/20 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="mt-1 whitespace-pre-line break-words text-sm font-medium text-foreground">
                      {row.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <StudentEmptyState>
            {lang === "mn"
              ? "Одоогоор мэдээлэл ороогүй байна."
              : "No information has been entered yet."}
          </StudentEmptyState>
        )}
      </DialogContent>
    </Dialog>
  );
}

function isSameApplicationExam(application: StudentApplication | undefined, exam: Exam): boolean {
  if (!application?.exam) return false;
  if (application.exam.id && application.exam.id === exam.id) return true;

  return (
    application.exam.name === exam.name &&
    application.exam.examDate != null &&
    String(application.exam.examDate) === exam.examDate
  );
}
