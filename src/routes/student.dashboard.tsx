import { createFileRoute, Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useLang } from "@/contexts/LangContext";
import {
  StudentEmptyState,
  StudentMetricCard,
  StudentPageHeader,
  StudentPanel,
} from "@/components/student/StudentPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, sessionLabel } from "@/lib/eju-format";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({ meta: [{ title: "Оюутны хяналтын самбар | EJU" }] }),
  component: StudentDashboard,
});

interface DashboardData {
  firstName: string;
  totalApps: number;
  pendingApps: number;
  approvedApps: number;
  openExams: number;
  hasApplication: boolean;
  applicationStatus?: string | null;
  applicationNumber?: string | null;
  activeExam?: {
    id: string;
    name: string;
    year: number;
    session: string;
    examDate: string;
    registrationStart: string;
    registrationEnd: string;
    location: string;
  };
}

function StudentDashboard() {
  const { lang } = useLang();

  const { data, isLoading } = useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: () => apiGet<DashboardData>("/api/student/dashboard"),
  });

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const greeting =
    lang === "mn"
      ? `Сайн байна уу, ${data.firstName || "Оюутан"}`
      : `Hello, ${data.firstName || "Student"}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <StudentPageHeader
        icon={GraduationCap}
        eyebrow={lang === "mn" ? "EJU оюутан" : "EJU student"}
        title={greeting}
        description={
          lang === "mn"
            ? "Шалгалтын мэдээлэл, бүртгэл, төлбөрийн төлөвөө нэг дороос хянах хэсэг."
            : "Track exam information, applications, and payment status from one workspace."
        }
        actions={
          <>
            <Button asChild>
              <Link to={data.hasApplication ? "/student/applications" : "/student/exams"}>
                {data.hasApplication
                  ? lang === "mn"
                    ? "Бүртгэл харах"
                    : "View application"
                  : lang === "mn"
                    ? "Бүртгүүлэх"
                    : "Register"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/student/profile">
                <UserRound className="h-4 w-4" />
                {lang === "mn" ? "Профайл" : "Profile"}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StudentMetricCard
          icon={CalendarDays}
          label={lang === "mn" ? "Нээлттэй шалгалт" : "Open exams"}
          value={data.openExams}
          helper={lang === "mn" ? "Бүртгэл авах боломжтой" : "Available for registration"}
          tone="blue"
        />
        <StudentMetricCard
          icon={FileText}
          label={lang === "mn" ? "Миний бүртгэл" : "My applications"}
          value={data.totalApps}
          helper={lang === "mn" ? "Илгээсэн бүртгэл" : "Submitted records"}
          tone="teal"
        />
        <StudentMetricCard
          icon={ClipboardCheck}
          label={lang === "mn" ? "Хянагдаж буй" : "Pending"}
          value={data.pendingApps}
          helper={lang === "mn" ? "Админаар шалгагдаж байна" : "Waiting for review"}
          tone="amber"
        />
        <StudentMetricCard
          icon={CheckCircle2}
          label={lang === "mn" ? "Батлагдсан" : "Approved"}
          value={data.approvedApps}
          helper={lang === "mn" ? "Зөвшөөрөгдсөн бүртгэл" : "Accepted applications"}
          tone="emerald"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <StudentPanel
          title={lang === "mn" ? "Идэвхтэй шалгалт" : "Active exam"}
          description={
            data.activeExam
              ? lang === "mn"
                ? "Бүртгэлийн хугацаа болон шалгалтын үндсэн мэдээлэл."
                : "Registration window and key exam details."
              : lang === "mn"
                ? "Одоогоор нээлттэй шалгалт харагдахгүй байна."
                : "No open exam is visible right now."
          }
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/student/exams">
                {lang === "mn" ? "Шалгалтууд" : "Exams"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
          {data.activeExam ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{data.activeExam.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {data.activeExam.year} · {formatSession(data.activeExam.session, lang)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      {lang === "mn" ? "Бүртгэл нээлттэй" : "Registration open"}
                    </Badge>
                  </div>
                </div>
                {data.applicationStatus ? <StatusBadge status={data.applicationStatus} /> : null}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <DetailTile
                  icon={CalendarDays}
                  label={lang === "mn" ? "Шалгалтын өдөр" : "Exam date"}
                  value={formatDate(data.activeExam.examDate, lang)}
                />
                <DetailTile
                  icon={MapPin}
                  label={lang === "mn" ? "Байршил" : "Location"}
                  value={data.activeExam.location}
                />
                <DetailTile
                  icon={Clock3}
                  label={lang === "mn" ? "Бүртгэлийн хугацаа" : "Registration window"}
                  value={`${formatDate(data.activeExam.registrationStart, lang)} - ${formatDate(
                    data.activeExam.registrationEnd,
                    lang,
                  )}`}
                />
              </div>

              <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {data.hasApplication
                      ? lang === "mn"
                        ? "Таны бүртгэл үүссэн байна"
                        : "Your application has been created"
                      : lang === "mn"
                        ? "Та бүртгэлээ эхлүүлж болно"
                        : "You can start your application"}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {data.applicationNumber ??
                      (lang === "mn"
                        ? "Бүртгүүлэх товчоор маягт руу орно уу."
                        : "Use the registration button to continue.")}
                  </p>
                </div>
                <Button asChild className="shrink-0">
                  <Link to={data.hasApplication ? "/student/applications" : "/student/exams"}>
                    {data.hasApplication
                      ? lang === "mn"
                        ? "Бүртгэл харах"
                        : "View application"
                      : lang === "mn"
                        ? "Бүртгүүлэх"
                        : "Register"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <StudentEmptyState>
              {lang === "mn"
                ? "Шалгалтын бүртгэл нээгдэх үед энэ хэсэгт харагдана."
                : "Open exam registration will appear here."}
            </StudentEmptyState>
          )}
        </StudentPanel>

        <StudentPanel
          title={lang === "mn" ? "Миний бүртгэлийн төлөв" : "My application status"}
          description={
            lang === "mn"
              ? "Бүртгэлийн дугаар, хяналтын төлөв, дараагийн алхам."
              : "Application number, review status, and next step."
          }
        >
          <div className="space-y-3">
            <SummaryRow
              label={lang === "mn" ? "Бүртгэл" : "Application"}
              value={data.hasApplication ? (lang === "mn" ? "Үүссэн" : "Created") : "-"}
            />
            <SummaryRow
              label={lang === "mn" ? "Дугаар" : "Number"}
              value={data.applicationNumber ?? "-"}
              mono
            />
            <SummaryRow
              label={lang === "mn" ? "Төлөв" : "Status"}
              value={data.applicationStatus ?? "-"}
            />
            <Button asChild variant="outline" className="mt-2 w-full justify-between">
              <Link to="/student/applications">
                {lang === "mn" ? "Дэлгэрэнгүй харах" : "View details"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </StudentPanel>
      </div>

      <StudentPanel
        title={lang === "mn" ? "Дараагийн алхмууд" : "Next steps"}
        description={
          lang === "mn"
            ? "Бүртгэлээ алдаагүй дуусгахын тулд дараах зүйлсийг шалгаарай."
            : "Check these items to keep your application on track."
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <StepCard
            icon={UserRound}
            title={lang === "mn" ? "Профайл баталгаажуулах" : "Confirm profile"}
            text={
              lang === "mn"
                ? "Нэр, паспорт, холбоо барих мэдээллээ зөв эсэхийг шалгана."
                : "Review your name, passport, and contact details."
            }
            to="/student/profile"
            cta={lang === "mn" ? "Профайл" : "Profile"}
          />
          <StepCard
            icon={CalendarDays}
            title={lang === "mn" ? "Шалгалт сонгох" : "Choose exam"}
            text={
              lang === "mn"
                ? "Нээлттэй шалгалтын огноо, байршил, бүртгэлийн хугацааг харна."
                : "Check open exam dates, venues, and registration windows."
            }
            to="/student/exams"
            cta={lang === "mn" ? "Шалгалт" : "Exams"}
          />
          <StepCard
            icon={BadgeCheck}
            title={lang === "mn" ? "Төлөв хянах" : "Track status"}
            text={
              lang === "mn"
                ? "Илгээсэн бүртгэл болон төлбөрийн төлөвөө хянана."
                : "Monitor submitted application and payment status."
            }
            to="/student/applications"
            cta={lang === "mn" ? "Бүртгэл" : "Application"}
          />
        </div>
      </StudentPanel>
    </div>
  );
}

function DetailTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <p className="break-words text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={mono ? "truncate font-mono text-sm font-medium" : "truncate text-sm font-medium"}
      >
        {value}
      </span>
    </div>
  );
}

function StepCard({
  icon: Icon,
  title,
  text,
  to,
  cta,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
  to: "/student/profile" | "/student/exams" | "/student/applications";
  cta: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
      <p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">{text}</p>
      <Button asChild variant="outline" size="sm" className="mt-4 w-full justify-between">
        <Link to={to}>
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function formatSession(session: string, lang: "mn" | "en") {
  const normalized = session.toLowerCase();
  if (normalized === "first" || normalized === "second") {
    return sessionLabel(normalized, lang);
  }
  return session;
}
